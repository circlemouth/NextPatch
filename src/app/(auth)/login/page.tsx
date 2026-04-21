import { loginAction } from "@/server/auth/session";

export const dynamic = "force-dynamic";

const errorMessages = {
  invalid: "＊パスワードが一致しません。管理者が設定したログインパスワードを入力してください。",
  "missing-config":
    "＊ログイン設定が不足しています。.env の NEXTPATCH_LOGIN_PASSWORD と NEXTPATCH_SESSION_SECRET を設定してから再起動してください。"
} as const;

type LoginSearchParams = {
  error?: string | string[];
};

export default function LoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorKey && errorKey in errorMessages ? errorMessages[errorKey as keyof typeof errorMessages] : null;
  const supportId = "login-password-support";
  const errorId = errorMessage ? "login-password-error" : undefined;
  const describedBy = [supportId, errorId].filter(Boolean).join(" ");

  return (
    <main className="auth-page">
      <section className="auth-box panel auth-card" aria-labelledby="login-title">
        <div className="auth-hero">
          <p className="eyebrow">NextPatch</p>
          <h1 id="login-title">LAN内利用向けの簡易ログイン</h1>
          <p className="support">
            LAN内のNextPatchにアクセスするための共通パスワードを入力します。
          </p>
        </div>

        <form action={loginAction} className="form-stack auth-form">
          <div className="field">
            <label htmlFor="password">
              ログインパスワード <span className="required">※必須</span>
            </label>
            <p className="support" id={supportId}>
              LAN内のNextPatchにアクセスするための共通パスワードを入力します。
            </p>
            <input
              aria-describedby={describedBy || undefined}
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
