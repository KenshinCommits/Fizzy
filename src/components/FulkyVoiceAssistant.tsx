"use client";
import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import styles from "./FulkyVoiceAssistant.module.css";
import { AUTH_TOKEN_KEY } from "@/lib/auth";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export function FulkyVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");
  const client = useRef<RetellWebClient | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client.current?.stopCall();
    };
  }, []);

  async function end() {
    client.current?.stopCall();
    setStatus("ready");
  }

  async function start() {
    if (client.current) return;
    try {
      setError("");
      setStatus("connecting");

      // Fetch the access token from our backend (public endpoint, no auth needed)
      const res = await fetch(`${apiUrl}/retell/v3/create-web-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(window.localStorage.getItem(AUTH_TOKEN_KEY) ? { Authorization: `Bearer ${window.localStorage.getItem(AUTH_TOKEN_KEY)}` } : {}) },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const { access_token, call_id, transport, ice_servers } = data;
      if (!access_token) throw new Error("No access token returned from server.");

      const retell = new RetellWebClient();

      retell.on("call_started", () => setStatus("live"));
      retell.on("call_ended", () => {
        client.current = null;
        setStatus("ready");
      });
      retell.on("error", (msg: string) => {
        client.current = null;
        setStatus("error");
        setError(msg ?? "Fulky could not connect.");
      });

      client.current = retell;
      // Pass all fields from the server response so the SDK selects the
      // correct transport (gateway vs livekit) and uses the right ICE servers.
      await retell.startCall({
        accessToken: access_token,
        ...(transport && { transport }),
        ...(call_id && { callId: call_id }),
        ...(ice_servers && { iceServers: ice_servers }),
      });
    } catch (cause) {
      client.current = null;
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Fulky could not start the voice call.",
      );
    }
  }

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => {
          setOpen(true);
          void start();
        }}
      >
        Ask Fulky
      </button>

      {open && (
        <>
          <button
            className={styles.backdrop}
            aria-label="Close Fulky"
            onClick={() => {
              void end();
              setOpen(false);
            }}
          />
          <aside className={styles.drawer}>
            <header>
              <div className={styles.avatar}>••</div>
              <div>
                <b>FULKY</b>
                <p>Your personal Fizzi drink guide</p>
              </div>
              <button
                onClick={() => {
                  void end();
                  setOpen(false);
                }}
              >
                ×
              </button>
            </header>

            <div className={styles.status}>
              <i />
              Fulky is {status}
            </div>

            <main>
              <div
                className={`${styles.can} ${status === "live" ? styles.speaking : ""}`}
              >
                fizzi<small>FULKY</small>
              </div>
              <h2>{status === "live" ? "Fulky is listening…" : "Let's talk."}</h2>
              <p>Ask Fulky for a drink recommendation by voice.</p>
              <div className={styles.wave}>▁▃▆█▆▃▁</div>
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.call}
                onClick={
                  status === "ready" || status === "error"
                    ? () => void start()
                    : () => void end()
                }
              >
                {status === "ready" || status === "error"
                  ? "Start voice call"
                  : "End voice call"}
              </button>
            </main>
          </aside>
        </>
      )}
    </>
  );
}
