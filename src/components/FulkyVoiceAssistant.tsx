"use client";
import { useEffect, useRef, useState } from "react";
import { RetellClient } from "retell-client-js-sdk";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import styles from "./FulkyVoiceAssistant.module.css";
const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:5000/api";
export function FulkyVoiceAssistant(){
 const [open,setOpen]=useState(false),[status,setStatus]=useState("ready"),[error,setError]=useState("");const call=useRef<any>(null);
 useEffect(()=>()=>{void end();},[]);
 async function end(){if(call.current){await call.current.end();call.current=null;}setStatus("ready");}
 async function start(){if(call.current)return;try{setError("");setStatus("connecting");const token=localStorage.getItem(AUTH_TOKEN_KEY);if(!token)throw Error("Please sign in before talking to Fulky.");const client=new RetellClient({key:"server-proxy",fetch:(url:RequestInfo|URL,init?:RequestInit)=>{const path=new URL(String(url)).pathname;return fetch(`${apiUrl}/retell${path}`,{...init,headers:{...init?.headers,Authorization:`Bearer ${token}`}});}});const session=client.createWebCall({agent_id:"server-managed",hooks:{onStatus:(next:string)=>setStatus(next),onEnd:()=>{call.current=null;setStatus("ready");},onError:(cause:Error)=>{setError(cause.message);setStatus("error");}}});call.current=session;await session.ready;}catch(cause){call.current=null;setStatus("error");setError(cause instanceof Error?cause.message:"Fulky could not start the voice call.");}}
 return <><button className={styles.trigger} onClick={()=>{setOpen(true);void start();}}>Ask Fulky</button>{open&&<><button className={styles.backdrop} aria-label="Close Fulky" onClick={()=>{void end();setOpen(false)}}/><aside className={styles.drawer}><header><div className={styles.avatar}>••</div><div><b>FULKY</b><p>Your personal Fizzi drink guide</p></div><button onClick={()=>{void end();setOpen(false)}}>×</button></header><div className={styles.status}><i/>Fulky is {status}</div><main><div className={`${styles.can} ${status==="live"?styles.speaking:""}`}>fizzi<small>FULKY</small></div><h2>{status==="live"?"Fulky is listening…":"Let’s talk."}</h2><p>Ask Fulky for a drink recommendation by voice.</p><div className={styles.wave}>▁▃▆█▆▃▁</div>{error&&<p className={styles.error}>{error}</p>}<button className={styles.call} onClick={status==="ready"||status==="error"?()=>void start:()=>void end()}>{status==="ready"||status==="error"?"Start voice call":"End voice call"}</button></main></aside></>}</>;
}
