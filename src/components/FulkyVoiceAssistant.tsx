"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import styles from "./FulkyVoiceAssistant.module.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export function FulkyVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"ready" | "connecting" | "listening" | "speaking" | "error">("ready");
  const [error, setError] = useState("");
  const socket = useRef<Socket | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const capture = useRef<ScriptProcessorNode | null>(null);
  const nextAudio = useRef(0);

  useEffect(() => () => stop(), []);
  function stop() { capture.current?.disconnect(); stream.current?.getTracks().forEach(t => t.stop()); socket.current?.emit("fulky:stop"); socket.current?.disconnect(); audio.current?.close(); socket.current = null; stream.current = null; capture.current = null; audio.current = null; setStatus("ready"); }
  function play(raw: ArrayBuffer) { const ctx = audio.current; if (!ctx) return; setStatus("speaking"); const pcm = new Int16Array(raw); const buffer = ctx.createBuffer(1, pcm.length, 16000); const output = buffer.getChannelData(0); for (let i = 0; i < pcm.length; i += 1) output[i] = pcm[i] / 32768; const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination); const at = Math.max(ctx.currentTime, nextAudio.current); source.start(at); nextAudio.current = at + buffer.duration; source.onended = () => { if (ctx.currentTime >= nextAudio.current - .02) setStatus("listening"); }; }
  async function start() { if (socket.current) return; try { setError(""); setStatus("connecting"); const token = localStorage.getItem(AUTH_TOKEN_KEY); if (!token) throw new Error("Please sign in before talking to Fulky."); const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); const ctx = new AudioContext({ sampleRate: 16000 }); const client = io(apiUrl.replace(/\/api$/, ""), { transports: ["websocket"] }); stream.current = mic; audio.current = ctx; socket.current = client; client.on("fulky:state", setStatus); client.on("fulky:error", (reason: string) => { setError(reason); stop(); setStatus("error"); }); client.on("fulky:audio", play); client.emit("fulky:start", { token }); const source = ctx.createMediaStreamSource(mic); const node = ctx.createScriptProcessor(2048, 1, 1); capture.current = node; node.onaudioprocess = e => { const input = e.inputBuffer.getChannelData(0); const pcm = new Int16Array(input.length); for (let i = 0; i < input.length; i += 1) pcm[i] = Math.max(-1, Math.min(1, input[i])) * 32767; client.emit("fulky:audio", pcm.buffer); }; source.connect(node); node.connect(ctx.destination); } catch (cause) { stop(); setStatus("error"); setError(cause instanceof Error ? cause.message : "Fulky needs microphone access."); } }
  return <><button className={styles.trigger} onClick={() => { setOpen(true); void start(); }}>Ask Fulky</button>{open && <><button className={styles.backdrop} aria-label="Close Fulky" onClick={() => { stop(); setOpen(false); }} /><aside className={styles.drawer}><header><div className={styles.avatar}>••</div><div><b>FULKY</b><p>Your personal Fizzi drink guide</p></div><button onClick={() => { stop(); setOpen(false); }}>×</button></header><div className={styles.status}><i /> Fulky is {status}</div><main><div className={`${styles.can} ${status === "speaking" ? styles.speaking : ""}`}>fizzi<small>FULKY</small></div><h2>{status === "speaking" ? "Fulky is speaking…" : status === "listening" ? "I’m listening…" : "Let’s talk."}</h2><p>Ask Fulky for a drink recommendation by voice.</p><div className={styles.wave}>▁▃▆█▆▃▁</div>{error && <p className={styles.error}>{error}</p>}<button className={styles.call} onClick={status === "ready" || status === "error" ? start : stop}>{status === "ready" || status === "error" ? "Start voice call" : "End voice call"}</button></main></aside></>}</>;
}
