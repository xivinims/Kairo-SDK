#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{env, fs, path::{Path, PathBuf}};
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

#[command]
fn run_allowed_command(command: String, args: Vec<String>, cwd: String) -> Result<String, String> {
  let executable = Path::new(&command)
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or(&command);

  let allowed = match executable {
    "pwd" => args.is_empty(),
    "ls" => args.iter().all(|arg| !arg.starts_with('-') || matches!(arg.as_str(), "-a" | "-A" | "-l")),
    "git" => matches!(
      args.first().map(String::as_str),
      Some("status") | Some("diff") | Some("log") | Some("show") | Some("branch") | Some("ls-files")
    ),
    _ => false,
  };
  if !allowed {
    return Err(format!("Command not allowed: {}", executable));
  }

  let cwd_path = Path::new(&cwd);
  require_allowed_path(cwd_path)?;

  let output = std::process::Command::new(executable)
    .args(&args)
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

  if output.status.success() {
    Ok(combined)
  } else {
    Err(combined)
  }
}

#[derive(Debug, Deserialize)]
struct KairoRequest {
  messages: Vec<KairoMessage>,
  #[serde(rename = "contentLevel")]
  content_level: String,
  #[serde(rename = "systemInstruction")]
  system_instruction: String,
}

#[derive(Debug, Deserialize)]
struct KairoMessage {
  role: String,
  content: String,
}

#[derive(Debug, Serialize)]
struct KairoAgentResult {
  ok: bool,
  answer: Option<String>,
  skills: Vec<String>,
  error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
  candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
  #[serde(rename = "finishReason")]
  finish_reason: Option<String>,
  content: Option<GeminiContent>,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
  parts: Option<Vec<GeminiPart>>,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
  text: Option<String>,
}

#[command]
async fn ask_kairo(request: KairoRequest) -> Result<KairoAgentResult, String> {
  let latest = request.messages.last().map(|m| m.content.trim()).unwrap_or("");
  if latest.is_empty() {
    return Ok(KairoAgentResult {
      ok: false,
      answer: None,
      skills: Vec::new(),
      error: Some("Mensagem vazia.".to_string()),
    });
  }

  let api_key = env::var("GEMINI_API_KEY")
    .map_err(|_| "GEMINI_API_KEY não está configurada no ambiente do aplicativo.".to_string())?
    .trim()
    .to_string();

  let blocked = [
    "child sexual",
    "minor sexual",
    "sexual exploitation",
    "incest",
    "bestiality",
    "forced sex",
    "rape",
  ];

  let latest_lower = latest.to_lowercase();
  if blocked.iter().any(|needle| latest_lower.contains(needle)) {
    return Ok(KairoAgentResult {
      ok: false,
      answer: None,
      skills: Vec::new(),
      error: Some("Solicitação bloqueada por segurança.".to_string()),
    });
  }

  let contents: Vec<serde_json::Value> = request.messages.iter().map(|message| {
    serde_json::json!({
      "role": if message.role == "assistant" { "model" } else { "user" },
      "parts": [{"text": message.content}]
    })
  }).collect();

  let body = serde_json::json!({
    "systemInstruction": { "parts": [{ "text": request.system_instruction }] },
    "contents": contents,
    "tools": [{ "googleSearch": {} }],
    "generationConfig": {
      "maxOutputTokens": 4096,
      "temperature": 0.7,
      "topP": 0.95
    }
  });

  let response = reqwest::Client::new()
    .post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent")
    .header("Content-Type", "application/json")
    .header("x-goog-api-key", api_key)
    .json(&body)
    .send()
    .await
    .map_err(|_| "Não foi possível conectar ao Gemini agora.".to_string())?;

  let status = response.status();
  if !status.is_success() {
    return Ok(KairoAgentResult {
      ok: false,
      answer: None,
      skills: Vec::new(),
      error: Some(format!("O Gemini retornou HTTP {}.", status.as_u16())),
    });
  }

  let body = response.json::<GeminiResponse>()
    .await
    .map_err(|_| "Resposta inválida do Gemini.".to_string())?;

  let candidate = body.candidates.and_then(|mut candidates| candidates.drain(..).next());
  if candidate.as_ref().and_then(|c| c.finish_reason.as_deref()) == Some("SAFETY") {
    return Ok(KairoAgentResult {
      ok: true,
      answer: Some("Não posso atender a esse pedido dessa forma. Posso ajudar com uma versão segura da solicitação.".to_string()),
      skills: Vec::new(),
      error: None,
    });
  }

  let answer = candidate
    .and_then(|candidate| candidate.content)
    .and_then(|content| content.parts)
    .unwrap_or_default()
    .into_iter()
    .filter_map(|part| part.text)
    .collect::<String>()
    .trim()
    .to_string();

  if answer.is_empty() {
    return Ok(KairoAgentResult {
      ok: false,
      answer: None,
      skills: Vec::new(),
      error: Some("O Gemini não retornou conteúdo.".to_string()),
    });
  }

  Ok(KairoAgentResult {
    ok: true,
    answer: Some(answer),
    skills: Vec::new(),
    error: None,
  })
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_directory,
      read_file,
      write_file,
      run_allowed_command,
      get_runtime,
      ask_kairo
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
