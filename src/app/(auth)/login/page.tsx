import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/server/auth/actions";
import { getAuthConfig } from "@/server/auth/config";
import { sanitizeNextPath } from "@/server/auth/redirects";
import { getAuthenticatedLocalContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ログイン | NextPatch"
};

const errorMessages = {
  required: "＊ログインパスワードを入力してください。",
  invalid: "＊パスワードが一致しません。管理者が設定したログインパスワードを入力してください。",
  "missing-config":
    "＊ログイン設定が不足しています。.env の NEXTPATCH_LOGIN_PASSWORD と NEXTPATCH_SESSION_SECRET を設定してから再起動してください。"
} as const;

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getAuthenticatedLocalContext()) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const nextPath = sanitizeNextPath(Array.isArray(params?.next) ? params.next[0] : params?.next);
  const errorKey = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const config = getAuthConfig();
  const configError = config ? null : errorMessages["missing-config"];
  const actionError = errorKey && errorKey in errorMessages ? errorMessages[errorKey as keyof typeof errorMessages] : null;
  const errorMessage = configError ?? actionError;
  const supportId = "login-password-support";
  const errorId = errorMessage ? "login-password-error" : undefined;
  const describedBy = [supportId, errorId].filter(Boolean).join(" ");

  return (
    <main className="auth-page">
      <section className="auth-box panel auth-card" aria-labelledby="login-title">
        <div className="auth-hero">
          <p className="eyebrow">NextPatch</p>
          <h1 id="login-title">LAN内利用向けの簡易ログイン</h1>
          <p className="support">信頼できるLAN内のNextPatchにアクセスするための共通パスワードを入力します。</p>
        </div>

        <form action={loginAction} className="form-stack auth-form">
          <input name="next" type="hidden" value={nextPath} />
          <div className="field">
            <label htmlFor="password">
              ログインパスワード <span className="required">※必須</span>
            </label>
            <p className="support" id={supportId}>
              LAN内のNextPatchにアクセスするための共通パスワードを入力します。
            </p>
            <input
              aria-describedby={describedBy || undefined}
              aria-invalid={Boolean(errorMessage)}
              autoComplete="current-password"
              id="password"
              name="password"
              type="password"
            />
            {errorMessage ? (
              <p className="error-text" id={errorId}>
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="auth-actions">
            <button className="button" type="submit">
              ログイン
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
