#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
  env,
  fs,
  path::{Path, PathBuf},
};
use tauri::command;

fn allowed_roots() -> Vec<PathBuf> {
  let mut roots = Vec::new();
  if let Some(home) = env::var_os("HOME").or_else(|| env::var_os("USERPROFILE")) {
    let home = PathBuf::from(home);
    roots.push(home.join("Documents"));
    roots.push(home.join("Projects"));
  }
  roots
}

fn existing_allowed_roots() -> Vec<String> {
  allowed_roots()
    .into_iter()
    .filter(|path| path.exists())
    .map(|path| path.to_string_lossy().to_string())
    .collect()
}

fn canonical_existing(path: &Path) -> Result<PathBuf, String> {
  fs::canonicalize(path).map_err(|e| format!("Invalid path: {} ({})", path.display(), e))
}

fn is_allowed_path(path: &Path) -> Result<bool, String> {
  let candidate = canonical_existing(path)?;
  let roots = allowed_roots();
  if roots.is_empty() {
    return Err("No authorized desktop folders configured.".to_string());
  }

  for root in roots {
    if let Ok(root) = fs::canonicalize(root) {
      if candidate == root || candidate.starts_with(&root) {
        return Ok(true);
      }
    }
  }
  Ok(false)
}

fn require_allowed_path(path: &Path) -> Result<(), String> {
  if is_allowed_path(path)? {
    Ok(())
  } else {
    Err(format!("Access denied outside authorized folders: {}", path.display()))
  }
}

#[command]
fn list_directory(path: String) -> Result<Vec<String>, String> {
  let dir = Path::new(&path);
  require_allowed_path(dir)?;
  if !dir.is_dir() {
    return Err(format!("Not a directory: {}", path));
  }

  let mut items = Vec::new();
  for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
    let path = entry.map_err(|e| e.to_string())?.path();
    let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    items.push(name);
  }
  items.sort();
  Ok(items)
}

#[command]
fn read_file(path: String) -> Result<String, String> {
  let p = Path::new(&path);
  require_allowed_path(p)?;
  fs::read_to_string(p).map_err(|e| format!("{}: {}", path, e))
}

#[command]
fn write_file(path: String, content: String) -> Result<(), String> {
  let p = Path::new(&path);
  let parent = p.parent().ok_or_else(|| "Invalid file path".to_string())?;

  if !parent.exists() {
    return Err("Parent directory does not exist.".to_string());
  }
  require_allowed_path(parent)?;
  fs::write(p, content).map_err(|e| e.to_string())
}

fn execute_allowed_command(command: &str, args: &[String], cwd: &str) -> Result<String, String> {
  let executable = Path::new(command)
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or(command);

  let allowed = match executable {
    "pwd" => args.is_empty(),
    "ls" => args
      .iter()
      .all(|arg| !arg.starts_with('-') || matches!(arg.as_str(), "-a" | "-A" | "-l" | "-la" | "-al")),
    "git" => matches!(
      args.first().map(String::as_str),
      Some("status") | Some("diff") | Some("log") | Some("show") | Some("branch") | Some("ls-files")
    ),
    _ => false,
  };

  if !allowed {
    return Err(format!("Command not allowed: {}", executable));
  }

  let cwd_path = Path::new(cwd);
  require_allowed_path(cwd_path)?;

  let output = std::process::Command::new(executable)
    .args(args)
    .current_dir(cwd_path)
    .output()
    .map_err(|e| e.to_string())?;

  let stdout = String::from_utf8_lossy(&output.stdout).to_string();
  let stderr = String::from_utf8_lossy(&output.stderr).to_string();
  let combined = if !stderr.is_empty() {
    format!("{}\n{}", stdout, stderr)
  } else {
    stdout
  };

  let bounded = if combined.chars().count() > 80_000 {
    format!(
      "{}\n\n[output truncated]",
      combined.chars().take(80_000).collect::<String>()
    )
  } else {
    combined
  };

  if output.status.success() {
    Ok(bounded)
  } else {
    Err(bounded)
  }
}

#[command]
fn run_allowed_command(command: String, args: Vec<String>, cwd: String) -> Result<String, String> {
  execute_allowed_command(&command, &args, &cwd)
}

#[derive(Debug, Deserialize)]
struct ZenoRequest {
  messages: Vec<ZenoMessage>,
  #[serde(rename = "contentLevel")]
  _content_level: String,
  #[serde(rename = "apiKey")]
  api_key: Option<String>,
  model: Option<String>,
  #[serde(rename = "systemInstruction")]
  system_instruction: String,
  skills: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct ZenoMessage {
  role: String,
  content: String,
}

#[derive(Debug, Serialize)]
struct ZenoToolEvent {
  name: String,
  label: String,
  ok: bool,
  detail: Option<String>,
}

#[derive(Debug, Serialize)]
struct ZenoAgentResult {
  ok: bool,
  answer: Option<String>,
  skills: Vec<String>,
  tools: Vec<ZenoToolEvent>,
  error: Option<String>,
}

fn gemini_function_tools() -> Value {
  json!([
    {
      "functionDeclarations": [
        {
          "name": "web_search",
          "description": "Pesquisa a web em tempo real usando Google Search e retorna resumo e fontes.",
          "parameters": {
            "type": "OBJECT",
            "properties": {
              "query": { "type": "STRING" }
            },
            "required": ["query"]
          }
        },
        {
          "name": "desktop_roots",
          "description": "Lista as pastas locais que o Zeno pode acessar no aplicativo desktop.",
          "parameters": { "type": "OBJECT", "properties": {} }
        },
        {
          "name": "run_local_command",
          "description": "Executa um comando local permitido dentro de uma pasta autorizada. Comandos permitidos: pwd, ls e operações Git somente de leitura.",
          "parameters": {
            "type": "OBJECT",
            "properties": {
              "command": { "type": "STRING" },
              "args": {
                "type": "ARRAY",
                "items": { "type": "STRING" }
              },
              "cwd": { "type": "STRING" }
            },
            "required": ["command", "args", "cwd"]
          }
        }
      ]
    }
  ])
}

async fn execute_web_search(
  client: &reqwest::Client,
  api_key: &str,
  model: &str,
  args: &Value,
) -> Result<Value, String> {
  let query = args
    .get("query")
    .and_then(Value::as_str)
    .unwrap_or("")
    .trim();

  if query.is_empty() {
    return Err("Consulta de pesquisa vazia.".to_string());
  }

  let body = json!({
    "contents": [{
      "role": "user",
      "parts": [{
        "text": format!(
          "Pesquise na web sobre: {}. Retorne um resumo factual e curto, preservando datas e nomes importantes.",
          query
        )
      }]
    }],
    "tools": [{ "googleSearch": {} }],
    "generationConfig": {
      "maxOutputTokens": 2500,
      "temperature": 0.2,
      "topP": 0.9
    }
  });

  let response = client
    .post(format!(
      "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
      model
    ))
    .header("Content-Type", "application/json")
    .header("x-goog-api-key", api_key)
    .json(&body)
    .send()
    .await
    .map_err(|_| "Não foi possível executar a pesquisa web.".to_string())?;

  let status = response.status();
  if !status.is_success() {
    return Err(format!("Pesquisa web HTTP {}", status.as_u16()));
  }

  let body = response
    .json::<Value>()
    .await
    .map_err(|_| "Resposta inválida da pesquisa web.".to_string())?;

  let candidate = body
    .get("candidates")
    .and_then(Value::as_array)
    .and_then(|items| items.first())
    .cloned()
    .ok_or_else(|| "A pesquisa web não retornou conteúdo.".to_string())?;

  let answer = candidate
    .get("content")
    .and_then(|content| content.get("parts"))
    .and_then(Value::as_array)
    .map(|parts| {
      parts
        .iter()
        .filter_map(|part| part.get("text").and_then(Value::as_str))
        .collect::<String>()
    })
    .unwrap_or_default();

  let sources = candidate
    .get("groundingMetadata")
    .and_then(|metadata| metadata.get("groundingChunks"))
    .and_then(Value::as_array)
    .map(|chunks| {
      chunks
        .iter()
        .filter_map(|chunk| chunk.get("web"))
        .filter_map(|web| {
          let uri = web.get("uri").and_then(Value::as_str)?;
          let title = web.get("title").and_then(Value::as_str).unwrap_or(uri);
          Some(json!({ "title": title, "url": uri }))
        })
        .take(8)
        .collect::<Vec<_>>()
    })
    .unwrap_or_default();

  if answer.trim().is_empty() {
    return Err("A pesquisa web não retornou texto.".to_string());
  }

  Ok(json!({
    "query": query,
    "answer": answer.trim(),
    "sources": sources
  }))
}

async fn execute_desktop_tool(
  name: &str,
  args: &Value,
  client: &reqwest::Client,
  api_key: &str,
  model: &str,
) -> (Value, ZenoToolEvent) {
  match name {
    "web_search" => match execute_web_search(client, api_key, model, args).await {
      Ok(response) => (
        response,
        ZenoToolEvent {
          name: name.to_string(),
          label: "Pesquisa web".to_string(),
          ok: true,
          detail: args
            .get("query")
            .and_then(Value::as_str)
            .map(ToString::to_string),
        },
      ),
      Err(error) => (
        json!({ "error": error }),
        ZenoToolEvent {
          name: name.to_string(),
          label: "Pesquisa web".to_string(),
          ok: false,
          detail: Some(error),
        },
      ),
    },
    "desktop_roots" => {
      let roots = existing_allowed_roots();
      (
        json!({ "roots": roots }),
        ZenoToolEvent {
          name: name.to_string(),
          label: "Pastas locais".to_string(),
          ok: true,
          detail: Some("Pastas autorizadas verificadas".to_string()),
        },
      )
    }
    "run_local_command" => {
      let command = args.get("command").and_then(Value::as_str).unwrap_or("");
      let cwd = args.get("cwd").and_then(Value::as_str).unwrap_or("");
      let command_args = args
        .get("args")
        .and_then(Value::as_array)
        .map(|items| {
          items
            .iter()
            .filter_map(Value::as_str)
            .map(ToString::to_string)
            .collect::<Vec<_>>()
        })
        .unwrap_or_default();

      match execute_allowed_command(command, &command_args, cwd) {
        Ok(output) => (
          json!({ "output": output }),
          ZenoToolEvent {
            name: name.to_string(),
            label: "Terminal".to_string(),
            ok: true,
            detail: Some(format!("{} {}", command, command_args.join(" ")).trim().to_string()),
          },
        ),
        Err(error) => (
          json!({ "error": error }),
          ZenoToolEvent {
            name: name.to_string(),
            label: "Terminal".to_string(),
            ok: false,
            detail: Some(error),
          },
        ),
      }
    }
    _ => (
      json!({ "error": "Unknown desktop tool" }),
      ZenoToolEvent {
        name: name.to_string(),
        label: name.to_string(),
        ok: false,
        detail: Some("Ferramenta desconhecida".to_string()),
      },
    ),
  }
}

async fn gemini_request(
  client: &reqwest::Client,
  api_key: &str,
  model: &str,
  system_instruction: &str,
  contents: &[Value],
) -> Result<Value, String> {
  let body = json!({
    "systemInstruction": { "parts": [{ "text": system_instruction }] },
    "contents": contents,
    "tools": gemini_function_tools(),
    "generationConfig": {
      "maxOutputTokens": 8192,
      "temperature": 0.65,
      "topP": 0.95
    }
  });

  let response = client
    .post(format!(
      "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
      model
    ))
    .header("Content-Type", "application/json")
    .header("x-goog-api-key", api_key)
    .json(&body)
    .send()
    .await
    .map_err(|_| "Não foi possível conectar ao Gemini agora.".to_string())?;

  let status = response.status();
  if !status.is_success() {
    let detail = response.text().await.unwrap_or_default();
    return Err(format!(
      "Gemini HTTP {}: {}",
      status.as_u16(),
      detail.chars().take(180).collect::<String>()
    ));
  }

  response
    .json::<Value>()
    .await
    .map_err(|_| "Resposta inválida do Gemini.".to_string())
}

#[command]
async fn ask_zeno(request: ZenoRequest) -> Result<ZenoAgentResult, String> {
  let latest = request
    .messages
    .last()
    .map(|message| message.content.trim())
    .unwrap_or("");

  let skills = request.skills.unwrap_or_default();

  if latest.is_empty() {
    return Ok(ZenoAgentResult {
      ok: false,
      answer: None,
      skills,
      tools: Vec::new(),
      error: Some("Mensagem vazia.".to_string()),
    });
  }

  let api_key = request
    .api_key
    .filter(|key| !key.trim().is_empty())
    .or_else(|| env::var("GEMINI_API_KEY").ok())
    .ok_or_else(|| "Adicione sua API key do Gemini nas configurações do Zeno.".to_string())?;

  let model = request
    .model
    .unwrap_or_else(|| "gemini-2.5-flash".to_string());

  if !model.starts_with("gemini-")
    || !model
      .chars()
      .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.'))
  {
    return Err("Modelo Gemini inválido.".to_string());
  }

  let blocked = [
    "child sexual",
    "minor sexual",
    "sexual exploitation",
    "forced sex",
    "rape",
  ];
  let latest_lower = latest.to_lowercase();
  if blocked.iter().any(|needle| latest_lower.contains(needle)) {
    return Ok(ZenoAgentResult {
      ok: false,
      answer: None,
      skills,
      tools: Vec::new(),
      error: Some("Solicitação bloqueada por segurança.".to_string()),
    });
  }

  let mut contents: Vec<Value> = request
    .messages
    .iter()
    .map(|message| {
      json!({
        "role": if message.role == "assistant" { "model" } else { "user" },
        "parts": [{ "text": message.content }]
      })
    })
    .collect();

  let client = reqwest::Client::new();
  let mut tool_events = Vec::new();

  for _ in 0..6 {
    let body = gemini_request(
      &client,
      api_key.trim(),
      &model,
      &request.system_instruction,
      &contents,
    )
    .await?;

    let candidate = body
      .get("candidates")
      .and_then(Value::as_array)
      .and_then(|items| items.first())
      .cloned();

    let Some(candidate) = candidate else {
      return Ok(ZenoAgentResult {
        ok: false,
        answer: None,
        skills,
        tools: tool_events,
        error: Some("O Gemini não retornou conteúdo.".to_string()),
      });
    };

    if candidate
      .get("finishReason")
      .and_then(Value::as_str)
      == Some("SAFETY")
    {
      return Ok(ZenoAgentResult {
        ok: true,
        answer: Some(
          "Não posso atender a esse pedido dessa forma. Posso ajudar com uma versão segura da solicitação."
            .to_string(),
        ),
        skills,
        tools: tool_events,
        error: None,
      });
    }

    let content = candidate.get("content").cloned().unwrap_or_else(|| json!({
      "role": "model",
      "parts": []
    }));

    let parts = content
      .get("parts")
      .and_then(Value::as_array)
      .cloned()
      .unwrap_or_default();

    let calls: Vec<(Option<String>, String, Value)> = parts
      .iter()
      .filter_map(|part| part.get("functionCall"))
      .filter_map(|call| {
        let name = call.get("name")?.as_str()?.to_string();
        let id = call.get("id").and_then(Value::as_str).map(ToString::to_string);
        let args = call.get("args").cloned().unwrap_or_else(|| json!({}));
        Some((id, name, args))
      })
      .collect();

    if calls.is_empty() {
      let answer = parts
        .iter()
        .filter_map(|part| part.get("text").and_then(Value::as_str))
        .collect::<String>()
        .trim()
        .to_string();

      if answer.is_empty() {
        return Ok(ZenoAgentResult {
          ok: false,
          answer: None,
          skills,
          tools: tool_events,
          error: Some("O Gemini não retornou texto.".to_string()),
        });
      }

      return Ok(ZenoAgentResult {
        ok: true,
        answer: Some(answer),
        skills,
        tools: tool_events,
        error: None,
      });
    }

    contents.push(content);
    let mut response_parts = Vec::new();

    for (id, name, args) in calls {
      let (response, event) = execute_desktop_tool(
        &name,
        &args,
        &client,
        api_key.trim(),
        &model,
      )
      .await;
      tool_events.push(event);

      let mut function_response = json!({
        "name": name,
        "response": response
      });
      if let Some(id) = id {
        function_response["id"] = json!(id);
      }

      response_parts.push(json!({
        "functionResponse": function_response
      }));
    }

    contents.push(json!({
      "role": "user",
      "parts": response_parts
    }));
  }

  Ok(ZenoAgentResult {
    ok: false,
    answer: None,
    skills,
    tools: tool_events,
    error: Some("O agente atingiu o limite de etapas de ferramentas.".to_string()),
  })
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_directory,
      read_file,
      write_file,
      run_allowed_command,
      ask_zeno
    ])
    .run(tauri::generate_context!())
    .expect("error while running Zeno");
}
