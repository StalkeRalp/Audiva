"use client";

import { useState } from "react";

function EyeIcon({ visible }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
      {!visible && <path d="m4 4 16 16" />}
    </svg>
  );
}

export default function AuthPasswordField({ label, name, autoComplete, placeholder, minLength, className = "", lineClassName = "" }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className={`block text-sm font-semibold ${className}`}>
      <span className="mb-1.5 block">{label}</span>
      <span className={`auth-input-line flex items-center gap-3 border-b border-white/25 px-0 py-2.5 text-[#a6f6ef] transition focus-within:border-[#72eee7] ${lineClassName}`}>
        <input required type={visible ? "text" : "password"} name={name} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
        <button
          type="button"
          className="auth-password-toggle grid h-8 w-8 shrink-0 place-items-center rounded-full text-current transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#72eee7]"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          onClick={() => setVisible(value => !value)}
        >
          <EyeIcon visible={visible} />
        </button>
      </span>
    </label>
  );
}
