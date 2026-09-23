#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

  // Require the destination's parent to already exist. This prevents path
  // traversal from creating new directory trees outside the authorized roots.
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

  // Only read-only inspection commands are exposed. Arbitrary interpreters,
  // package runners and mutating git operations are intentionally excluded.
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

#[command]
fn get_runtime() -> String {
  std::env::consts::OS.to_string()
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_directory,
      read_file,
      write_file,
      run_allowed_command,
      get_runtime
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
