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

/// Flags that let a read-only git command write files, run programs or read
/// outside the repository.
const GIT_DENIED_FLAGS: [&str; 8] = [
  "--output", "--ext-diff", "--textconv", "--no-index",
  "--git-dir", "--work-tree", "--open-files-in-pager", "--exec-path",
];

fn git_args_allowed(args: &[String]) -> bool {
  let Some(sub) = args.first().map(String::as_str) else { return false };
  let rest = &args[1..];

  let denied = rest.iter().any(|arg| {
    arg.starts_with("-O")
      || GIT_DENIED_FLAGS.iter().any(|flag| arg == flag || arg.starts_with(&format!("{}=", flag)))
  });
  if denied {
    return false;
  }

  match sub {
    "status" | "diff" | "log" | "show" | "ls-files" => true,
    // `git branch <name>` and `-d/-D/-m` mutate the repository: list only.
    "branch" => rest.iter().all(|arg| matches!(arg.as_str(), "--list" | "-a" | "-r" | "-v" | "-vv" | "--show-current")),
    _ => false,
  }
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
    "git" => git_args_allowed(&args),
    _ => false,
  };
  if !allowed {
    return Err(format!("Command not allowed: {}", executable));
  }

  let cwd_path = Path::new(&cwd);
  require_allowed_path(cwd_path)?;

  let mut final_args: Vec<String> = Vec::new();
  if executable == "git" {
    final_args.push("--no-pager".to_string());
    final_args.push(args[0].clone());
    if matches!(args[0].as_str(), "diff" | "show" | "log") {
      final_args.push("--no-ext-diff".to_string());
      final_args.push("--no-textconv".to_string());
    }
    final_args.extend(args.iter().skip(1).cloned());
  } else {
    final_args = args.clone();
  }

  let mut cmd = std::process::Command::new(executable);
  cmd.args(&final_args).current_dir(cwd_path);
  if executable == "git" {
    cmd.env_remove("GIT_EXTERNAL_DIFF").env_remove("GIT_PAGER");
  }
  let output = cmd.output().map_err(|e| e.to_string())?;

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
