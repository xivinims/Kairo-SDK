#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, path::Path};
use tauri::command;

#[command]
fn list_directory(path: String) -> Result<Vec<String>, String> {
  let dir = Path::new(&path);
  if !dir.exists() {
    return Err(format!("Path not found: {}", path));
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
  fs::read_to_string(&path).map_err(|e| format!("{}: {}", path, e))
}

#[command]
fn write_file(path: String, content: String) -> Result<(), String> {
  let p = Path::new(&path);
  if let Some(parent) = p.parent() {
    if !parent.as_os_str().is_empty() && !parent.exists() {
      fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
  }
  fs::write(p, content).map_err(|e| e.to_string())
}

#[command]
fn run_allowed_command(command: String, args: Vec<String>, cwd: String) -> Result<String, String> {
  let allowed = ["git", "npm", "node", "npx", "python", "python3", "cargo", "rustc"];
  let executable = if let Some(cmd) = command.split('/').last() { cmd.to_string() } else { command.clone() };

  if !allowed.iter().any(|value| *value == executable) {
    return Err(format!("Command not allowed: {}", executable));
  }

  let output = std::process::Command::new(&command)
    .args(&args)
    .current_dir(cwd)
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
