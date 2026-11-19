"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
const loginUri = `${apiUrl}/auth/google/callback`;

const signInErrors: Record<string, string> = {
  csrf: "Google sign-in could not be verified. Please try again.",
  configuration: "Google sign-in is not configured on the server yet.",
  account: "Google did not return a verified account. Try another account.",
  domain: "This Google account is not in the allowed organization.",
  verification: "Google sign-in failed. Please try again.",
};

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) setErrorMessage(signInErrors[error] ?? "Could not sign in. Please try again.");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-4 py-10">
      {clientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onError={() => setScriptFailed(true)} />}
      <section className="w-full max-w-[440px] rounded-2xl border border-[#e0e7e1] bg-white p-7 shadow-[0_18px_50px_rgba(27,54,36,0.08)] sm:p-9" aria-labelledby="login-title">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#236b52] font-[Manrope,sans-serif] text-xl font-extrabold text-white shadow-sm" aria-hidden="true">O</div>
          <div><div className="font-[Manrope,sans-serif] text-lg font-extrabold tracking-tight text-[#202625]">orchestrix</div><div className="text-[9px] font-bold tracking-[0.16em] text-[#8a958e]">ACADEMIC PLANNER</div></div>
        </div>

        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#39785a]">Welcome</p>
          <h1 id="login-title" className="font-[Manrope,sans-serif] text-2xl font-bold tracking-tight text-[#202625]">Sign in to Orchestrix</h1>
          <p className="mt-2 text-sm leading-6 text-[#68766d]">Use your Google account to access the academic scheduling workspace.</p>
        </div>

        {errorMessage && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">{errorMessage}</p>}

        {!clientId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
            Google sign-in needs a Web OAuth client ID. Set <code className="font-semibold">GOOGLE_CLIENT_ID</code> for the API and <code className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> for the frontend.
          </div>
        ) : scriptFailed ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">Google sign-in could not load. Check your connection and reload this page.</p>
        ) : (
          <>
            <div id="g_id_onload" data-client_id={clientId} data-login_uri={loginUri} data-auto_prompt="false" data-ux_mode="redirect" />
            <div className="flex min-h-11 justify-center" aria-label="Google sign in button">
              <div className="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="signin_with" data-size="large" data-width="340" data-logo_alignment="left" />
            </div>
          </>
        )}

        <div className="mt-7 flex items-center justify-center gap-2 border-t border-[#edf0ed] pt-5 text-xs text-[#7a867e]"><ShieldCheck size={15} aria-hidden="true" />Protected with Google sign-in</div>
      </section>
    </main>
  );
}
