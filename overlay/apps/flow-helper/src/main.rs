//! `effectcraft-flow-helper`: the part of Flow Studio that needs files, processes or the network.
//!
//! ```text
//! effectcraft-flow-helper serve [--port 9890]          loopback JSON-lines server for the Flow Studio panel
//! effectcraft-flow-helper request '{"op":"ping"}'      one request, answer on stdout (jobs are awaited)
//! effectcraft-flow-helper silence FILE [--db -35] [--min-silence 0.4] [--pad 0.1] [--engine adaptive|fixed]
//! effectcraft-flow-helper transcribe FILE [--model whisper-small] [--lang auto] [--out captions.srt]
//! effectcraft-flow-helper models                       list the open speech models and what is installed
//! effectcraft-flow-helper install MODEL                download and verify a model
//! ```
//!
//! The server listens on 127.0.0.1 only, answers one JSON object per line, and writes only inside
//! the Flow folder (`<EffectCraft settings>/FlowStudio`), which EffectCraft updates never touch.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic, clippy::unimplemented, clippy::todo, clippy::unreachable)]
#![forbid(unsafe_code)]

mod decode;
mod dirs;
mod ops;

use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::process::ExitCode;
use std::time::Duration;

use ops::Helper;
use serde_json::{Value, json};

const DEFAULT_PORT: u16 = 9890;
/// A request line longer than this is refused (caption text is the largest legitimate payload).
const MAX_LINE: u64 = 16 * 1024 * 1024;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

fn flag<'a>(args: &'a [String], name: &str) -> Option<&'a str> {
    args.iter().position(|a| a == name).and_then(|i| args.get(i + 1)).map(String::as_str)
}

fn num(args: &[String], name: &str) -> Result<Option<f64>, String> {
    flag(args, name).map(|v| v.parse::<f64>().map_err(|_| format!("{name} needs a number"))).transpose()
}

fn run(args: &[String]) -> Result<(), String> {
    let Some(cmd) = args.first().map(String::as_str) else { return Err(usage()) };
    let rest = args.get(1..).unwrap_or(&[]);
    let helper = Helper::new();
    match cmd {
        "serve" => {
            let port = flag(rest, "--port").map(|p| p.parse::<u16>().map_err(|_| "--port needs a number".to_string())).transpose()?.unwrap_or(DEFAULT_PORT);
            serve(&helper, port)
        }
        "request" => {
            let req: Value = serde_json::from_str(rest.first().ok_or("request needs a JSON argument")?).map_err(|e| format!("bad JSON: {e}"))?;
            print_json(&await_job(&helper, helper.handle(&req)))
        }
        "silence" => {
            let path = rest.first().ok_or("silence needs a media file")?;
            let mut p = json!({});
            if let Some(v) = num(rest, "--db")? {
                p["thresholdDb"] = v.into();
            }
            if let Some(v) = num(rest, "--min-silence")? {
                p["minSilence"] = v.into();
            }
            if let Some(v) = num(rest, "--pad")? {
                p["padBefore"] = v.into();
                p["padAfter"] = v.into();
            }
            if let Some(v) = flag(rest, "--engine") {
                p["engine"] = v.into();
            }
            print_json(&await_job(&helper, helper.handle(&json!({"op": "silence.analyze", "path": path, "params": p}))))
        }
        "transcribe" => {
            let path = rest.first().ok_or("transcribe needs a media file")?;
            let req = json!({"op": "captions.transcribe", "path": path, "model": flag(rest, "--model").unwrap_or("whisper-small"), "language": flag(rest, "--lang").unwrap_or("auto")});
            let done = await_job(&helper, helper.handle(&req));
            if let (Some(out), Some(srt)) = (flag(rest, "--out"), done.get("srt").and_then(Value::as_str)) {
                std::fs::write(out, srt).map_err(|e| format!("{out}: {e}"))?;
            }
            print_json(&done)
        }
        "models" => print_json(&helper.handle(&json!({"op": "models.list"}))),
        "install" => print_json(&await_job(&helper, helper.handle(&json!({"op": "models.install", "id": rest.first().ok_or("install needs a model id")?})))),
        "fixture-wav" => {
            let path = rest.first().ok_or("fixture-wav needs a destination file")?;
            let rate = 16_000u32;
            let mut samples = Vec::new();
            // 1.3s tone, 2.2s silence, 1.1s tone
            samples.extend(std::iter::repeat_n(0.3f32, 16000 * 13 / 10));
            samples.extend(std::iter::repeat_n(0.0f32, 16000 * 22 / 10));
            samples.extend(std::iter::repeat_n(0.3f32, 16000 * 11 / 10));
            let bytes = effectcraft_flow::audio::encode_wav_pcm16(&samples, rate);
            std::fs::write(path, bytes).map_err(|e| format!("{path}: {e}"))
        }
        _ => Err(usage()),
    }
}

fn usage() -> String {
    "usage: effectcraft-flow-helper <serve [--port N] | request JSON | silence FILE | transcribe FILE | models | install MODEL>".into()
}

fn print_json(v: &Value) -> Result<(), String> {
    println!("{}", serde_json::to_string_pretty(v).map_err(|e| e.to_string())?);
    if v["ok"] == false { Err("failed".into()) } else { Ok(()) }
}

/// For one-shot commands: when a request started a job, wait for it and return its result.
fn await_job(h: &Helper, started: Value) -> Value {
    let Some(id) = started.get("job").and_then(Value::as_u64) else { return started };
    loop {
        let s = h.handle(&json!({"op": "job.status", "job": id}));
        match s["state"].as_str() {
            Some("running") => std::thread::sleep(Duration::from_millis(200)),
            Some("done") => {
                let mut r = s["result"].clone();
                if let Some(o) = r.as_object_mut() {
                    o.insert("ok".into(), true.into());
                }
                return r;
            }
            Some("failed") => return ops::err(s["error"].as_str().unwrap_or("failed")),
            _ => return s,
        }
    }
}

fn serve(h: &Helper, port: u16) -> Result<(), String> {
    let listener = TcpListener::bind(("127.0.0.1", port)).map_err(|e| format!("can't listen on 127.0.0.1:{port}: {e}"))?;
    eprintln!("Flow helper listening on 127.0.0.1:{port} (data in {})", dirs::flow_dir().display());
    for stream in listener.incoming().flatten() {
        let h = h.clone();
        let _ = std::thread::Builder::new().name("flow-conn".into()).spawn(move || connection(&h, stream));
    }
    Ok(())
}

fn connection(h: &Helper, stream: TcpStream) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(300)));
    let Ok(mut out) = stream.try_clone() else { return };
    let mut reader = BufReader::new(std::io::Read::take(stream, MAX_LINE));
    let mut line = String::new();
    loop {
        line.clear();
        match reader.read_line(&mut line) {
            Ok(0) | Err(_) => return,
            Ok(_) => {}
        }
        let answer = match serde_json::from_str::<Value>(line.trim()) {
            Ok(req) => h.handle(&req),
            Err(e) => ops::err(format!("bad JSON: {e}")),
        };
        if writeln!(out, "{answer}").and_then(|()| out.flush()).is_err() {
            return;
        }
        reader.get_mut().set_limit(MAX_LINE);
    }
}
