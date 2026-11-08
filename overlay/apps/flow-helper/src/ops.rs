//! The operations Flow Studio asks of the helper. Every request is one JSON object
//! `{"op": "...", ...}` and every answer one JSON object `{"ok": true, ...}` or
//! `{"ok": false, "error": "..."}`. Long operations return `{"job": N}`; poll `job.status`.

use std::collections::BTreeMap;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::{Duration, Instant};

use effectcraft_flow::captions::{self, GroupParams, Line};
use effectcraft_flow::models::{self, Hasher, ModelInfo, Verification};
use effectcraft_flow::sfx;
use effectcraft_flow::silence::{self, SilenceParams};
use effectcraft_flow::style::{self, CaptionStyle};
use effectcraft_flow::{audio, beats, karaoke, pack, stt};
use serde_json::{Value, json};

use crate::{decode, dirs};

/// Most jobs kept (finished ones are dropped oldest first).
const MAX_JOBS: usize = 32;

#[derive(Clone, Debug)]
enum State {
    Running { note: String, progress: Option<f64> },
    Done(Value),
    Failed(String),
}

struct Job {
    started: Instant,
    state: State,
}

#[derive(Clone, Default)]
pub struct Helper {
    jobs: Arc<Mutex<BTreeMap<u64, Job>>>,
    next: Arc<Mutex<u64>>,
}

fn lock<T>(m: &Mutex<T>) -> MutexGuard<'_, T> {
    m.lock().unwrap_or_else(PoisonError::into_inner)
}

pub fn ok(mut v: Value) -> Value {
    if let Some(o) = v.as_object_mut() {
        o.insert("ok".into(), true.into());
    }
    v
}

pub fn err(e: impl std::fmt::Display) -> Value {
    json!({"ok": false, "error": e.to_string()})
}

fn str_arg<'a>(r: &'a Value, key: &str) -> Result<&'a str, String> {
    r.get(key).and_then(Value::as_str).filter(|s| !s.is_empty() && s.len() <= 4096 && !s.contains('\0')).ok_or_else(|| format!("missing or invalid \"{key}\""))
}

fn existing_file(path: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(path);
    match std::fs::metadata(&p) {
        Ok(m) if m.is_file() => Ok(p),
        Ok(_) => Err(format!("{path} is not a file")),
        Err(e) => Err(format!("{path}: {e}")),
    }
}

impl Helper {
    pub fn new() -> Helper {
        Helper::default()
    }

    /// Runs one request. Never panics: a bad request is an error answer.
    pub fn handle(&self, req: &Value) -> Value {
        let Some(op) = req.get("op").and_then(Value::as_str) else { return err("missing \"op\"") };
        let r = match op {
            "ping" => Ok(json!({"name": "effectcraft-flow-helper", "version": env!("CARGO_PKG_VERSION"), "dir": dirs::flow_dir().to_string_lossy()})),
            "job.status" => self.job_status(req),
            "config.get" => Ok(config_get()),
            "config.set" => config_set(req),
            "models.list" => Ok(models_list()),
            "models.install" => self.models_install(req),
            "models.remove" => models_remove(req),
            "models.verify" => models_verify(req),
            "silence.analyze" => self.silence_start(req),
            "captions.transcribe" => self.transcribe_start(req),
            "captions.parse" => captions_parse(req),
            "captions.load" => captions_load(req),
            "captions.export" => captions_export(req),
            "captions.group" => captions_group(req),
            "sfx.list" => Ok(sfx_list()),
            "sfx.install" => sfx_install(req),
            "sfx.scan" => sfx_scan(req),
            "styles.list" => Ok(styles_list()),
            "styles.save" => styles_save(req),
            "styles.delete" => styles_delete(req),
            "beats.analyze" => self.beats_start(req),
            "karaoke.plan" => karaoke_plan(req),
            "pack.export" => pack_export(req),
            "pack.save" => pack_save(req),
            "pack.load" => pack_load(req),
            "pack.import" => pack_import(req),
            other => Err(format!("unknown op {other:?}")),
        };
        match r {
            Ok(v) => ok(v),
            Err(e) => err(e),
        }
    }

    // ---- jobs -------------------------------------------------------------------------------

    fn spawn<F>(&self, f: F) -> Result<Value, String>
    where
        F: FnOnce(&dyn Fn(&str, Option<f64>)) -> Result<Value, String> + Send + 'static,
    {
        let id = {
            let mut n = lock(&self.next);
            *n += 1;
            *n
        };
        {
            let mut jobs = lock(&self.jobs);
            while jobs.len() >= MAX_JOBS {
                let finished = jobs.iter().find(|(_, j)| !matches!(j.state, State::Running { .. })).map(|(k, _)| *k);
                match finished {
                    Some(k) => {
                        jobs.remove(&k);
                    }
                    None => return Err("too many jobs are running".into()),
                }
            }
            jobs.insert(id, Job { started: Instant::now(), state: State::Running { note: "starting".into(), progress: None } });
        }
        let jobs = Arc::clone(&self.jobs);
        let spawned = std::thread::Builder::new().name(format!("flow-job-{id}")).spawn(move || {
            let report = |note: &str, progress: Option<f64>| {
                if let Some(j) = lock(&jobs).get_mut(&id) {
                    j.state = State::Running { note: note.to_string(), progress };
                }
            };
            // A panic inside a job must end that job, not the helper.
            let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| f(&report))).unwrap_or_else(|_| Err("internal error".into()));
            if let Some(j) = lock(&jobs).get_mut(&id) {
                j.state = match outcome {
                    Ok(v) => State::Done(v),
                    Err(e) => State::Failed(e),
                };
            }
        });
        if spawned.is_err() {
            lock(&self.jobs).remove(&id);
            return Err("can't start a worker thread".into());
        }
        Ok(json!({"job": id}))
    }

    fn job_status(&self, req: &Value) -> Result<Value, String> {
        let id = req.get("job").and_then(Value::as_u64).ok_or("missing \"job\"")?;
        let jobs = lock(&self.jobs);
        let j = jobs.get(&id).ok_or("no such job")?;
        let elapsed = j.started.elapsed().as_secs_f64();
        Ok(match &j.state {
            State::Running { note, progress } => json!({"state": "running", "note": note, "progress": progress, "elapsed": elapsed}),
            State::Done(v) => json!({"state": "done", "result": v, "elapsed": elapsed}),
            State::Failed(e) => json!({"state": "failed", "error": e, "elapsed": elapsed}),
        })
    }

    // ---- silence ----------------------------------------------------------------------------

    fn silence_start(&self, req: &Value) -> Result<Value, String> {
        let path = existing_file(str_arg(req, "path")?)?;
        let params: SilenceParams = match req.get("params") {
            Some(p) if !p.is_null() => serde_json::from_value(p.clone()).map_err(|e| format!("bad params: {e}"))?,
            _ => SilenceParams::default(),
        };
        params.validate().map_err(|e| e.to_string())?;
        self.spawn(move |report| {
            report("decoding audio", None);
            let rate = 16_000;
            let samples = decode::decode_mono(&path, rate)?;
            report("analyzing", None);
            let a = silence::analyze(&samples, rate, &params).map_err(|e| e.to_string())?;
            serde_json::to_value(a).map_err(|e| e.to_string())
        })
    }

    // ---- beats ------------------------------------------------------------------------------

    fn beats_start(&self, req: &Value) -> Result<Value, String> {
        let path = existing_file(str_arg(req, "path")?)?;
        let params: beats::BeatParams = match req.get("params") {
            Some(p) if !p.is_null() => serde_json::from_value(p.clone()).map_err(|e| format!("bad params: {e}"))?,
            _ => beats::BeatParams::default(),
        };
        params.validate().map_err(|e| e.to_string())?;
        self.spawn(move |report| {
            report("decoding audio", None);
            let rate = 16_000;
            let samples = decode::decode_mono(&path, rate)?;
            report("detecting beats", None);
            let a = beats::analyze(&samples, rate, &params).map_err(|e| e.to_string())?;
            serde_json::to_value(a).map_err(|e| e.to_string())
        })
    }

    // ---- captions ---------------------------------------------------------------------------

    fn transcribe_start(&self, req: &Value) -> Result<Value, String> {
        let path = existing_file(str_arg(req, "path")?)?;
        let model_id = req.get("model").and_then(Value::as_str).unwrap_or(models::DEFAULT_MODEL).to_string();
        let info = models::find(&model_id).ok_or_else(|| format!("unknown model {model_id:?}"))?;
        let model_path = models_dir_file(info);
        if !model_path.is_file() {
            return Err(format!("{} is not installed: install it from the Models tab first", info.name));
        }
        let language = req.get("language").and_then(Value::as_str).unwrap_or("auto").to_string();
        let group: GroupParams = match req.get("group") {
            Some(g) if !g.is_null() => serde_json::from_value(g.clone()).map_err(|e| format!("bad group: {e}"))?,
            _ => GroupParams::default(),
        };
        let cli = find_whisper_cli()?;
        self.spawn(move |report| {
            dirs::ensure(&dirs::work_dir())?;
            report("decoding audio", None);
            let samples = decode::decode_mono(&path, stt::WHISPER_RATE)?;
            let stamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_millis());
            let stem = dirs::work_dir().join(format!("stt-{stamp}"));
            let wav = stem.with_extension("wav");
            std::fs::write(&wav, audio::encode_wav_pcm16(&samples, stt::WHISPER_RATE)).map_err(|e| format!("can't write {}: {e}", wav.display()))?;
            let args = stt::command_args(&stt::SttRequest {
                wav: wav.to_string_lossy().into_owned(),
                model: model_path.to_string_lossy().into_owned(),
                language,
                out_stem: stem.to_string_lossy().into_owned(),
                threads: std::thread::available_parallelism().map_or(2, |n| n.get().min(8)),
            })
            .map_err(|e| e.to_string())?;
            report("transcribing (this can take a while)", None);
            let out = run_whisper(&cli, &args, report);
            let json_path = stem.with_extension("json");
            let result = out.and_then(|()| std::fs::read_to_string(&json_path).map_err(|e| format!("whisper wrote no result: {e}")));
            let _ = std::fs::remove_file(&wav);
            let _ = std::fs::remove_file(&json_path);
            let words = stt::parse_output(&result?).map_err(|e| e.to_string())?;
            if words.is_empty() {
                return Err("no speech was recognised".into());
            }
            let lines = captions::group_words(&words, &group);
            Ok(json!({"words": words, "lines": lines, "srt": captions::to_srt(&lines)}))
        })
    }
}

fn run_whisper(cli: &Path, args: &[String], report: &dyn Fn(&str, Option<f64>)) -> Result<(), String> {
    let mut child = Command::new(cli)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("can't start {}: {e}", cli.display()))?;
    let started = Instant::now();
    let mut stderr = child.stderr.take();
    // Drain stderr on a thread so a chatty process never blocks on a full pipe.
    let reader = std::thread::spawn(move || {
        let mut s = String::new();
        if let Some(e) = stderr.as_mut() {
            let mut buf = Vec::new();
            let _ = e.take(64 * 1024).read_to_end(&mut buf);
            s = String::from_utf8_lossy(&buf).into_owned();
        }
        s
    });
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let text = reader.join().unwrap_or_default();
                return if status.success() { Ok(()) } else { Err(format!("whisper failed ({status}): {}", text.lines().last().unwrap_or("").trim())) };
            }
            Ok(None) => {
                report(&format!("transcribing… {:.0} s", started.elapsed().as_secs_f64()), None);
                std::thread::sleep(Duration::from_millis(400));
            }
            Err(e) => return Err(format!("whisper: {e}")),
        }
    }
}

/// `whisper-cli` from the config file, the `WHISPER_CLI` variable, or the PATH.
fn find_whisper_cli() -> Result<PathBuf, String> {
    let configured = std::fs::read_to_string(dirs::config_file())
        .ok()
        .and_then(|t| serde_json::from_str::<Value>(&t).ok())
        .and_then(|v| v.get("whisperCli").and_then(Value::as_str).map(PathBuf::from));
    let env = std::env::var_os("WHISPER_CLI").map(PathBuf::from);
    if let Some(p) = configured.or(env).filter(|p| !p.as_os_str().is_empty()) {
        return if p.is_file() { Ok(p) } else { Err(format!("the configured whisper program {} does not exist", p.display())) };
    }
    let names: &[&str] = if cfg!(windows) { &["whisper-cli.exe", "whisper-cpp.exe", "main.exe"] } else { &["whisper-cli", "whisper-cpp"] };
    let path = std::env::var_os("PATH").unwrap_or_default();
    for dir in std::env::split_paths(&path) {
        for n in names {
            let c = dir.join(n);
            if c.is_file() {
                return Ok(c);
            }
        }
    }
    Err("whisper-cli (whisper.cpp, MIT) was not found. Download its release from github.com/ggml-org/whisper.cpp, then set its path in the Models tab".into())
}

fn config_get() -> Value {
    let cfg = std::fs::read_to_string(dirs::config_file()).ok().and_then(|t| serde_json::from_str::<Value>(&t).ok()).unwrap_or_else(|| json!({}));
    let found = find_whisper_cli();
    json!({"config": cfg, "whisperCli": found.as_ref().ok().map(|p| p.to_string_lossy().into_owned()), "whisperCliError": found.err()})
}

fn config_set(req: &Value) -> Result<Value, String> {
    let mut cfg = std::fs::read_to_string(dirs::config_file()).ok().and_then(|t| serde_json::from_str::<Value>(&t).ok()).unwrap_or_else(|| json!({}));
    if let Some(p) = req.get("whisperCli").and_then(Value::as_str) {
        if !p.is_empty() {
            existing_file(p)?;
        }
        cfg["whisperCli"] = p.into();
    }
    dirs::ensure(&dirs::flow_dir())?;
    let text = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
    atomic_write(&dirs::config_file(), text.as_bytes())?;
    Ok(config_get())
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, bytes).map_err(|e| format!("can't write {}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, path).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        format!("can't replace {}: {e}", path.display())
    })
}

// ---- models -------------------------------------------------------------------------------

fn models_dir_file(m: &ModelInfo) -> PathBuf {
    dirs::models_dir().join(m.file)
}

fn read_pins() -> BTreeMap<String, String> {
    std::fs::read_to_string(dirs::pins_file()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

fn write_pins(p: &BTreeMap<String, String>) -> Result<(), String> {
    dirs::ensure(&dirs::flow_dir())?;
    atomic_write(&dirs::pins_file(), serde_json::to_string_pretty(p).map_err(|e| e.to_string())?.as_bytes())
}

fn models_list() -> Value {
    let pins = read_pins();
    let list: Vec<Value> = models::MODELS
        .iter()
        .map(|m| {
            let path = models_dir_file(m);
            let size = std::fs::metadata(&path).ok().map(|x| x.len());
            let mut v = serde_json::to_value(m).unwrap_or(Value::Null);
            if let Some(o) = v.as_object_mut() {
                o.insert("installed".into(), size.is_some().into());
                o.insert("bytes".into(), size.into());
                o.insert("pinned".into(), (!m.sha256.is_empty()).into());
                o.insert("trustedOnFirstUse".into(), pins.contains_key(m.id).into());
                o.insert("default".into(), (m.id == models::DEFAULT_MODEL).into());
            }
            v
        })
        .collect();
    json!({"models": list, "dir": dirs::models_dir().to_string_lossy(), "languages": stt::LANGUAGES})
}

fn hash_file(path: &Path) -> Result<String, String> {
    let mut f = std::fs::File::open(path).map_err(|e| format!("{}: {e}", path.display()))?;
    let mut h = Hasher::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = f.read(&mut buf).map_err(|e| format!("{}: {e}", path.display()))?;
        if n == 0 {
            return Ok(h.finish_hex());
        }
        h.update(buf.get(..n).unwrap_or(&[]));
    }
}

fn check_hash(info: &ModelInfo, computed: &str) -> Result<Value, String> {
    let mut pins = read_pins();
    match models::verify(info, computed).map_err(|e| e.to_string())? {
        Verification::Verified => Ok(json!({"verification": "verified", "sha256": computed})),
        Verification::Unpinned(_) => match pins.get(info.id) {
            Some(first) if first != computed => Err(format!("{} changed since it was installed (SHA-256 {computed}, first seen {first})", info.name)),
            Some(_) => Ok(json!({"verification": "trusted-on-first-use", "sha256": computed})),
            None => {
                pins.insert(info.id.to_string(), computed.to_string());
                write_pins(&pins)?;
                Ok(
                    json!({"verification": "trusted-on-first-use", "sha256": computed, "note": "No SHA-256 is pinned for this model yet; this one was remembered and will be checked from now on."}),
                )
            }
        },
    }
}

impl Helper {
    fn models_install(&self, req: &Value) -> Result<Value, String> {
        let id = str_arg(req, "id")?;
        let info = *models::find(id).ok_or_else(|| format!("unknown model {id:?}"))?;
        if !models::url_allowed(info.url) {
            return Err("the catalog entry points at a host that is not allowed".into());
        }
        self.spawn(move |report| {
            dirs::ensure(&dirs::models_dir())?;
            let dest = models_dir_file(&info);
            let part = dest.with_extension("part");
            let _ = std::fs::remove_file(&part);
            report("downloading", Some(0.0));
            let mut child = Command::new(if cfg!(windows) { "curl.exe" } else { "curl" })
                .args(["--location", "--fail", "--silent", "--show-error", "--output"])
                .arg(&part)
                .arg(info.url)
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("can't start curl (needed to download models): {e}"))?;
            let total = f64::from(info.size_mb) * 1_048_576.0;
            loop {
                match child.try_wait() {
                    Ok(Some(status)) if status.success() => break,
                    Ok(Some(status)) => {
                        let mut msg = String::new();
                        if let Some(mut e) = child.stderr.take() {
                            let _ = e.read_to_string(&mut msg);
                        }
                        let _ = std::fs::remove_file(&part);
                        return Err(format!("download failed ({status}): {}", msg.trim()));
                    }
                    Ok(None) => {
                        let done = std::fs::metadata(&part).map_or(0.0, |m| m.len() as f64);
                        report(&format!("downloading {:.0} / {} MB", done / 1_048_576.0, info.size_mb), Some((done / total).min(0.99)));
                        std::thread::sleep(Duration::from_millis(500));
                    }
                    Err(e) => return Err(format!("download: {e}")),
                }
            }
            report("verifying SHA-256", None);
            let computed = hash_file(&part)?;
            let verdict = match check_hash(&info, &computed) {
                Ok(v) => v,
                Err(e) => {
                    let _ = std::fs::remove_file(&part);
                    return Err(e);
                }
            };
            std::fs::rename(&part, &dest).map_err(|e| format!("can't install the model: {e}"))?;
            Ok(json!({"id": info.id, "path": dest.to_string_lossy(), "check": verdict}))
        })
    }
}

fn models_remove(req: &Value) -> Result<Value, String> {
    let info = models::find(str_arg(req, "id")?).ok_or("unknown model")?;
    let p = models_dir_file(info);
    match std::fs::remove_file(&p) {
        Ok(()) => Ok(json!({"removed": true})),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(json!({"removed": false})),
        Err(e) => Err(format!("can't remove {}: {e}", p.display())),
    }
}

fn models_verify(req: &Value) -> Result<Value, String> {
    let info = models::find(str_arg(req, "id")?).ok_or("unknown model")?;
    let p = models_dir_file(info);
    if !p.is_file() {
        return Err(format!("{} is not installed", info.name));
    }
    check_hash(info, &hash_file(&p)?)
}

// ---- captions -----------------------------------------------------------------------------

fn lines_of(req: &Value) -> Result<Vec<Line>, String> {
    serde_json::from_value(req.get("lines").cloned().ok_or("missing \"lines\"")?).map_err(|e| format!("bad lines: {e}"))
}

fn captions_parse(req: &Value) -> Result<Value, String> {
    let text = req.get("text").and_then(Value::as_str).ok_or("missing \"text\"")?;
    if text.len() > 8 * 1024 * 1024 {
        return Err("caption file too large".into());
    }
    Ok(json!({"lines": captions::parse_captions(text).map_err(|e| e.to_string())?}))
}

fn captions_load(req: &Value) -> Result<Value, String> {
    let p = existing_file(str_arg(req, "path")?)?;
    if std::fs::metadata(&p).map_or(true, |m| m.len() > 8 * 1024 * 1024) {
        return Err("caption file too large".into());
    }
    let text = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
    Ok(json!({"lines": captions::parse_captions(&text).map_err(|e| e.to_string())?}))
}

fn captions_group(req: &Value) -> Result<Value, String> {
    let words: Vec<captions::Word> = serde_json::from_value(req.get("words").cloned().ok_or("missing \"words\"")?).map_err(|e| format!("bad words: {e}"))?;
    let group: GroupParams = match req.get("group") {
        Some(g) if !g.is_null() => serde_json::from_value(g.clone()).map_err(|e| format!("bad group: {e}"))?,
        _ => GroupParams::default(),
    };
    Ok(json!({"lines": captions::group_words(&words, &group)}))
}

/// Writes SRT, VTT or ASS into the exports folder (never to a path the caller chooses).
fn captions_export(req: &Value) -> Result<Value, String> {
    let lines = lines_of(req)?;
    let format = req.get("format").and_then(Value::as_str).unwrap_or("srt");
    let (ext, text) = match format {
        "srt" => ("srt", captions::to_srt(&lines)),
        "vtt" => ("vtt", captions::to_vtt(&lines)),
        "ass" => ("ass", captions::to_ass(&lines)),
        "ass_karaoke" | "ass-karaoke" => ("ass", captions::to_ass_karaoke(&lines)),
        other => return Err(format!("unknown format {other:?} (srt, vtt or ass)")),
    };
    let base = req.get("name").and_then(Value::as_str).and_then(dirs::safe_name).unwrap_or_else(|| "captions".into());
    dirs::ensure(&dirs::exports_dir())?;
    let path = dirs::exports_dir().join(format!("{base}.{ext}"));
    atomic_write(&path, text.as_bytes())?;
    Ok(json!({"path": path.to_string_lossy(), "text": text}))
}

// ---- styles -------------------------------------------------------------------------------

fn user_styles() -> Vec<CaptionStyle> {
    let Ok(rd) = std::fs::read_dir(dirs::styles_dir()) else { return Vec::new() };
    let mut v: Vec<CaptionStyle> = rd
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
        .filter_map(|e| std::fs::read_to_string(e.path()).ok())
        .filter_map(|t| CaptionStyle::from_json(&t).ok())
        .collect();
    v.sort_by(|a, b| a.name.cmp(&b.name));
    v
}

fn sfx_path(id: &str) -> PathBuf {
    dirs::sfx_dir().join(format!("{id}.wav"))
}

fn sfx_list() -> Value {
    let items: Vec<Value> = sfx::SFX
        .iter()
        .map(|s| json!({"id": s.id, "name": s.name, "category": s.category, "seconds": s.seconds, "path": sfx_path(s.id).to_string_lossy(), "installed": sfx_path(s.id).is_file()}))
        .collect();
    json!({"items": items, "dir": dirs::sfx_dir().to_string_lossy()})
}

/// Renders the built-in effects (all, or the `ids` asked for) into the Flow folder as WAV files.
fn sfx_install(req: &Value) -> Result<Value, String> {
    let wanted: Option<Vec<String>> = req.get("ids").and_then(Value::as_array).map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect());
    dirs::ensure(&dirs::sfx_dir())?;
    let mut written = Vec::new();
    for s in sfx::SFX {
        if wanted.as_ref().is_some_and(|w| !w.iter().any(|id| id == s.id)) {
            continue;
        }
        let path = sfx_path(s.id);
        if !path.is_file() {
            let samples = sfx::render(s.id).ok_or_else(|| format!("cannot render {}", s.id))?;
            atomic_write(&path, &audio::encode_wav_pcm16(&samples, sfx::RATE))?;
        }
        written.push(json!({"id": s.id, "path": path.to_string_lossy()}));
    }
    Ok(json!({"files": written}))
}

const SOUND_EXTENSIONS: [&str; 7] = ["wav", "mp3", "ogg", "flac", "m4a", "aac", "aiff"];

/// Lists the sound files in one of the user's own folders (two levels deep, at most 500 files).
fn sfx_scan(req: &Value) -> Result<Value, String> {
    let root = PathBuf::from(str_arg(req, "folder")?);
    if !root.is_dir() {
        return Err(format!("{} is not a folder", root.display()));
    }
    let mut found: Vec<Value> = Vec::new();
    let mut stack = vec![(root.clone(), 0u8)];
    while let Some((dir, depth)) = stack.pop() {
        let Ok(rd) = std::fs::read_dir(&dir) else { continue };
        for entry in rd.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if depth < 2 {
                    stack.push((path, depth + 1));
                }
            } else if path.extension().and_then(|e| e.to_str()).is_some_and(|e| SOUND_EXTENSIONS.iter().any(|x| x.eq_ignore_ascii_case(e))) && found.len() < 500
            {
                let name = path.file_stem().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                found.push(json!({"name": name, "path": path.to_string_lossy()}));
            }
        }
    }
    found.sort_by(|a, b| a["name"].as_str().cmp(&b["name"].as_str()));
    Ok(json!({"items": found, "folder": root.to_string_lossy()}))
}

fn styles_list() -> Value {
    json!({"builtin": style::presets(), "user": user_styles()})
}

fn styles_save(req: &Value) -> Result<Value, String> {
    let s: CaptionStyle = CaptionStyle::from_json(&req.get("style").ok_or("missing \"style\"")?.to_string()).map_err(|e| e.to_string())?;
    if style::presets().iter().any(|p| p.name == s.name) {
        return Err(format!("{:?} is a built-in preset name; choose another", s.name));
    }
    let file = dirs::safe_name(&s.name).ok_or("the name may only use letters, digits, spaces, - _ . ( )")?;
    dirs::ensure(&dirs::styles_dir())?;
    let path = dirs::styles_dir().join(format!("{file}.json"));
    atomic_write(&path, s.to_json().map_err(|e| e.to_string())?.as_bytes())?;
    Ok(json!({"path": path.to_string_lossy()}))
}

fn styles_delete(req: &Value) -> Result<Value, String> {
    let file = dirs::safe_name(str_arg(req, "name")?).ok_or("bad name")?;
    let path = dirs::styles_dir().join(format!("{file}.json"));
    match std::fs::remove_file(&path) {
        Ok(()) => Ok(json!({"removed": true})),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(json!({"removed": false})),
        Err(e) => Err(format!("{}: {e}", path.display())),
    }
}

// ---- karaoke & pack -----------------------------------------------------------------------

fn karaoke_plan(req: &Value) -> Result<Value, String> {
    let lines = lines_of(req)?;
    let options: karaoke::KaraokeOptions = match req.get("options") {
        Some(o) if !o.is_null() => serde_json::from_value(o.clone()).map_err(|e| format!("bad options: {e}"))?,
        _ => karaoke::KaraokeOptions::default(),
    };
    let plan = karaoke::plan(&lines, &options).map_err(|e| e.to_string())?;
    serde_json::to_value(plan).map_err(|e| e.to_string())
}

fn pack_from_request(req: &Value) -> Result<pack::Pack, String> {
    let pack_val = req.get("pack").cloned().ok_or("missing \"pack\"")?;
    serde_json::from_value(pack_val).map_err(|e| format!("bad pack: {e}"))
}

fn pack_export(req: &Value) -> Result<Value, String> {
    let p = pack_from_request(req)?;
    let text = p.to_json().map_err(|e| e.to_string())?;
    Ok(json!({"json": text, "summary": pack::summary(&p)}))
}

/// Writes a pack into the exports folder, never to a path the caller chooses.
fn pack_save(req: &Value) -> Result<Value, String> {
    let p = pack_from_request(req)?;
    let text = p.to_json().map_err(|e| e.to_string())?;
    let base = req.get("name").and_then(Value::as_str).and_then(dirs::safe_name).unwrap_or_else(|| "flow-studio-presets".into());
    dirs::ensure(&dirs::exports_dir())?;
    let path = dirs::exports_dir().join(format!("{base}.json"));
    atomic_write(&path, text.as_bytes())?;
    Ok(json!({"path": path.to_string_lossy(), "json": text, "summary": pack::summary(&p)}))
}

fn pack_load(req: &Value) -> Result<Value, String> {
    let path = existing_file(str_arg(req, "path")?)?;
    if std::fs::metadata(&path).map_or(true, |m| m.len() > 4 * 1024 * 1024) {
        return Err("preset pack too large (maximum 4 MB)".into());
    }
    let text = std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
    let p = pack::parse(&text).map_err(|e| e.to_string())?;
    Ok(json!({"path": path.to_string_lossy(), "summary": pack::summary(&p), "pack": p}))
}

fn pack_import(req: &Value) -> Result<Value, String> {
    let text = req.get("json").and_then(Value::as_str).ok_or("missing \"json\"")?;
    let p = pack::parse(text).map_err(|e| e.to_string())?;
    let summary = pack::summary(&p);
    Ok(json!({"summary": summary, "pack": p}))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static N: AtomicUsize = AtomicUsize::new(0);

    /// Each test gets its own Flow folder; the variable is process-wide, so tests that touch the
    /// disk run under one lock.
    static DISK: Mutex<()> = Mutex::new(());

    fn sandbox() -> (MutexGuard<'static, ()>, PathBuf) {
        let g = lock(&DISK);
        let dir = std::env::temp_dir().join(format!("flow-helper-test-{}-{}", std::process::id(), N.fetch_add(1, Ordering::SeqCst)));
        let _ = std::fs::remove_dir_all(&dir);
        // `std::env::set_var` is `unsafe` in edition 2024 and this workspace forbids `unsafe`,
        // so tests redirect the Flow folder through a test-only override instead.
        crate::dirs::set_test_dir(&dir);
        (g, dir)
    }

    fn wait(h: &Helper, job: u64) -> Value {
        for _ in 0..600 {
            let s = h.handle(&json!({"op": "job.status", "job": job}));
            if s["state"] != "running" {
                return s;
            }
            std::thread::sleep(Duration::from_millis(50));
        }
        json!({"state": "timeout"})
    }

    fn tone_wav(path: &Path) {
        let rate = 16_000usize;
        let mut s = vec![0.0f32; rate / 2];
        s.extend((0..rate).map(|i| 0.4 * (2.0 * std::f32::consts::PI * 300.0 * i as f32 / rate as f32).sin()));
        s.extend(vec![0.0f32; rate]);
        s.extend((0..rate).map(|i| 0.4 * (2.0 * std::f32::consts::PI * 300.0 * i as f32 / rate as f32).sin()));
        std::fs::write(path, audio::encode_wav_pcm16(&s, 16_000)).unwrap();
    }

    #[test]
    fn bad_requests_are_errors() {
        let h = Helper::new();
        for req in [
            json!({}),
            json!({"op": 5}),
            json!({"op": "nope"}),
            json!({"op": "silence.analyze"}),
            json!({"op": "silence.analyze", "path": "/definitely/missing.wav"}),
            json!({"op": "models.install", "id": "x"}),
            json!({"op": "job.status", "job": 99999}),
            json!({"op": "captions.export", "lines": [], "format": "exe"}),
        ] {
            let a = h.handle(&req);
            assert_eq!(a["ok"], false, "{req}");
            assert!(a["error"].is_string());
        }
    }

    #[test]
    fn silence_job_runs_end_to_end_on_a_wav() {
        let (_g, dir) = sandbox();
        std::fs::create_dir_all(&dir).unwrap();
        let wav = dir.join("t.wav");
        tone_wav(&wav);
        let h = Helper::new();
        let a = h.handle(&json!({"op": "silence.analyze", "path": wav.to_string_lossy(), "params": {"thresholdDb": -35}}));
        assert_eq!(a["ok"], true, "{a}");
        let s = wait(&h, a["job"].as_u64().unwrap());
        assert_eq!(s["state"], "done", "{s}");
        let r = &s["result"];
        assert_eq!(r["silent"].as_array().unwrap().len(), 2, "{r}");
        assert!((r["duration"].as_f64().unwrap() - 3.5).abs() < 0.05);
    }

    #[test]
    fn captions_export_and_styles_stay_inside_the_flow_folder() {
        let (_g, dir) = sandbox();
        let h = Helper::new();
        let lines = json!([{"words": [{"text": "hi", "start": 0.0, "end": 1.0}], "start": 0.0, "end": 1.0}]);
        let a = h.handle(&json!({"op": "captions.export", "lines": lines, "format": "srt", "name": "../../evil"}));
        assert_eq!(a["ok"], true, "{a}");
        let p = PathBuf::from(a["path"].as_str().unwrap());
        assert!(p.starts_with(&dir) && p.ends_with("captions.srt"), "{p:?}");
        assert!(std::fs::read_to_string(&p).unwrap().contains("00:00:01,000"));

        let a_ass = h.handle(&json!({"op": "captions.export", "lines": lines, "format": "ass", "name": "caps"}));
        assert_eq!(a_ass["ok"], true, "{a_ass}");
        let p_ass = PathBuf::from(a_ass["path"].as_str().unwrap());
        assert!(p_ass.ends_with("caps.ass"));
        assert!(std::fs::read_to_string(&p_ass).unwrap().contains("[Script Info]"));

        let kp = h.handle(&json!({"op": "karaoke.plan", "lines": lines, "options": {"preset": "karaoke"}}));
        assert_eq!(kp["ok"], true, "{kp}");
        assert_eq!(kp["lines"].as_array().unwrap().len(), 1);

        let pe = h.handle(&json!({"op": "pack.export", "pack": {"schema": 1, "text": [{"name": "T1"}]}}));
        assert_eq!(pe["ok"], true, "{pe}");
        let pi = h.handle(&json!({"op": "pack.import", "json": pe["json"].as_str().unwrap()}));
        assert_eq!(pi["ok"], true, "{pi}");
        assert_eq!(pi["summary"]["text"], 1);

        let ps = h.handle(&json!({"op": "pack.save", "pack": {"schema": 1, "text": [{"name": "T1"}]}, "name": "../../escape"}));
        assert_eq!(ps["ok"], true, "{ps}");
        let saved = PathBuf::from(ps["path"].as_str().unwrap());
        assert!(saved.starts_with(&dir) && saved.ends_with("flow-studio-presets.json"), "{saved:?}");
        let pl = h.handle(&json!({"op": "pack.load", "path": saved.to_string_lossy()}));
        assert_eq!(pl["ok"], true, "{pl}");
        assert_eq!(pl["summary"]["text"], 1);
        assert!(h.handle(&json!({"op": "pack.load", "path": "../../nope.json"}))["ok"] == false);

        let l = h.handle(&json!({"op": "styles.list"}));
        assert_eq!(l["builtin"].as_array().unwrap().len(), style::presets().len());
        let mut mine = style::presets()[0].clone();
        mine.name = "My Look".into();
        mine.font_size = 77.0;
        let a = h.handle(&json!({"op": "styles.save", "style": mine}));
        assert_eq!(a["ok"], true, "{a}");
        let l = h.handle(&json!({"op": "styles.list"}));
        assert_eq!(l["user"][0]["fontSize"], 77.0);
        // Built-in names and unsafe names are refused.
        mine.name = "Clean".into();
        assert_eq!(h.handle(&json!({"op": "styles.save", "style": mine}))["ok"], false);
        mine.name = "../x".into();
        assert_eq!(h.handle(&json!({"op": "styles.save", "style": mine}))["ok"], false);
        assert_eq!(h.handle(&json!({"op": "styles.delete", "name": "My Look"}))["removed"], true);
        assert_eq!(h.handle(&json!({"op": "styles.delete", "name": "../etc/passwd"}))["ok"], false);
    }

    #[test]
    fn models_listing_and_first_use_pin() {
        let (_g, dir) = sandbox();
        let h = Helper::new();
        let l = h.handle(&json!({"op": "models.list"}));
        assert_eq!(l["models"].as_array().unwrap().len(), 4);
        assert!(l["models"].as_array().unwrap().iter().all(|m| m["installed"] == false));
        // Pretend a model was downloaded: the first check remembers it, a changed file is refused.
        std::fs::create_dir_all(dir.join("models")).unwrap();
        let f = dir.join("models").join("ggml-tiny.bin");
        std::fs::write(&f, b"weights v1").unwrap();
        let v = h.handle(&json!({"op": "models.verify", "id": "whisper-tiny"}));
        assert_eq!(v["verification"], "trusted-on-first-use", "{v}");
        assert_eq!(h.handle(&json!({"op": "models.verify", "id": "whisper-tiny"}))["ok"], true);
        std::fs::write(&f, b"tampered").unwrap();
        let v = h.handle(&json!({"op": "models.verify", "id": "whisper-tiny"}));
        assert_eq!(v["ok"], false, "{v}");
        assert_eq!(h.handle(&json!({"op": "models.remove", "id": "whisper-tiny"}))["removed"], true);
        // Transcribing without an installed model says what to do.
        let wav = dir.join("t.wav");
        tone_wav(&wav);
        let a = h.handle(&json!({"op": "captions.transcribe", "path": wav.to_string_lossy(), "model": "whisper-tiny"}));
        assert!(a["error"].as_str().unwrap().contains("not installed"), "{a}");
    }

    #[test]
    fn sfx_install_writes_valid_wavs_and_scan_finds_user_sounds() {
        let (_g, dir) = sandbox();
        let h = Helper::default();
        let listed = h.handle(&json!({"op": "sfx.list"}));
        assert_eq!(listed["items"].as_array().map(Vec::len), Some(sfx::SFX.len()));
        assert_eq!(listed["items"][0]["installed"], false);
        let r = h.handle(&json!({"op": "sfx.install", "ids": ["pop", "whoosh"]}));
        assert_eq!(r["ok"], true, "{r}");
        assert_eq!(r["files"].as_array().map(Vec::len), Some(2));
        let bytes = std::fs::read(dir.join("sfx").join("pop.wav")).unwrap_or_default();
        let pcm = audio::parse_wav(&bytes).map(|p| p.rate).unwrap_or(0);
        assert_eq!(pcm, sfx::RATE);
        let all = h.handle(&json!({"op": "sfx.install"}));
        assert_eq!(all["files"].as_array().map(Vec::len), Some(sfx::SFX.len()));
        let mine = dir.join("mine");
        let _ = std::fs::create_dir_all(mine.join("sub"));
        let _ = std::fs::write(mine.join("Boom.MP3"), b"x");
        let _ = std::fs::write(mine.join("sub").join("a.wav"), b"x");
        let _ = std::fs::write(mine.join("notes.txt"), b"x");
        let scan = h.handle(&json!({"op": "sfx.scan", "folder": mine.to_string_lossy()}));
        assert_eq!(scan["items"].as_array().map(Vec::len), Some(2), "{scan}");
        let bad = h.handle(&json!({"op": "sfx.scan", "folder": dir.join("nope").to_string_lossy()}));
        assert_eq!(bad["ok"], false);
    }
}
