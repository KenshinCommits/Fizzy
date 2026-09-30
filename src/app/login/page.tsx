"use client";

import Link from "next/link";
import { FormEvent, InputHTMLAttributes, useState } from "react";

import styles from "./login.module.css";

type Mode = "login" | "signup";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const email = String(values.email ?? "").trim();
    const password = String(values.password ?? "");
    const firstName = String(values.firstName ?? "").trim();
    const lastName = String(values.lastName ?? "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("Enter a valid email address.");
    if (!password) return setMessage("Enter your password.");
    if (isSignup && (!firstName || !lastName)) return setMessage("Add your first and last name.");
    if (isSignup && password.length < 8) return setMessage("Use at least 8 characters for your password.");

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { email, password, firstName, lastName } : { email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We couldn't sign you in. Please try again.");
      if (data.token) localStorage.setItem("fizzi-auth-token", data.token);
      if (data.user) localStorage.setItem("fizzi-user", JSON.stringify(data.user));
      setSuccess(isSignup ? "Your Fizzi account is ready." : `Welcome back${data.user?.firstName ? `, ${data.user.firstName}` : ""}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setMessage("");
    setSuccess("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="Fizzi home">fizzi<span>✦</span></Link>
        <p className={styles.headerNote}><i /> GOOD DRINKS. BETTER COMPANY.</p>
        <button className={styles.headerAction} type="button" onClick={() => changeMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Already one of us?" : "New to the good stuff?"}<b>{isSignup ? "Log in" : "Join the club"} ↗</b>
        </button>
      </header>

      <div className={styles.layout}>
        <section className={styles.story} aria-labelledby="story-title">
          <div className={styles.grain} />
          <div className={styles.storyTop}><span>✳ A LITTLE MORE GOOD.</span><span>THE FIZZI FEELING / 001</span></div>
          <div className={styles.storyCopy}>
            <h1 id="story-title">Good things.<br /><em>Great company.</em></h1>
            <p>Your kind of people. Your kind of fizz.</p>
            <div className={styles.flavours}><span>● YUZU</span><span>● BERRY</span><span>● MANGO</span></div>
          </div>
          <div className={styles.sun} />
          <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
          <div className={styles.cans} aria-hidden="true">
            <img className={styles.canBack} src="/labels/FizzyLemonTexture.png" alt="" />
            <img className={styles.canFront} src="/labels/watermelon-crush.png" alt="" />
          </div>
          <div className={styles.bubble}>Oh, you look like good company.<i /></div>
          <p className={styles.storyFoot}><b />A little curious. A lot of personality.</p>
        </section>

        <section className={styles.auth} aria-labelledby="login-title">
          <div className={styles.authInner}>
            <p className={styles.eyebrow}>✳ YOUR DAILY DOSE OF GOOD</p>
            <div className={styles.tabs} role="tablist">
              <button type="button" onClick={() => changeMode("login")} aria-selected={!isSignup}>Log in</button>
              <button type="button" onClick={() => changeMode("signup")} aria-selected={isSignup}>Sign up</button>
            </div>
            <h2 id="login-title">{isSignup ? <>Welcome to <em>Fizzi.</em></> : <>Welcome <em>back.</em></>}</h2>
            <p className={styles.subtitle}>{isSignup ? "Fresh account. Fresh flavors. Let’s get started." : <>Good to see you again.<br />Let’s get you back to the good stuff.</>}</p>
            {success ? <div className={styles.success}><span>✓</span><h3>{success}</h3><p>Your next good thing is right this way.</p><Link href="/" className={styles.primary}>Back to Fizzi <b>→</b></Link></div> :
              <form onSubmit={submit} noValidate>
                {isSignup && <div className={styles.nameFields}><Field label="First name" name="firstName" autoComplete="given-name" /><Field label="Last name" name="lastName" autoComplete="family-name" /></div>}
                <Field label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Field label="Password" name="password" type="password" placeholder={isSignup ? "Make it a good one" : "Your secret goes here"} autoComplete={isSignup ? "new-password" : "current-password"} />
                {!isSignup && <div className={styles.extras}><span>⌑ Just between us.</span><button type="button">Forgot your password?</button></div>}
                {message && <p className={styles.message} role="alert">{message}</p>}
                <button className={styles.primary} type="submit" disabled={loading}>{loading ? "Just a moment…" : isSignup ? "Create account" : "Log in"}<b>→</b></button>
              </form>}
            {!success && <p className={styles.switch}>{isSignup ? "Already part of the good stuff?" : "First time here?"} <button type="button" onClick={() => changeMode(isSignup ? "login" : "signup")}>{isSignup ? "Log in" : "Make yourself at home"} ↗</button></p>}
            <div className={styles.authBottom}><span>✳</span><p>A little account.<br /><b>A lot to look forward to.</b></p><i>〰</i></div>
          </div>
        </section>
      </div>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} Fizzi. Keep it good.</span><span>LESS ORDINARY. MORE FIZZI.</span><span>Need a hand? ＋</span></footer>
    </div>
  );
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className={styles.field}>{label}<input name={name} type={type} required {...props} /></label>;
}
