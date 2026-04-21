import { redirect } from "next/navigation";
import { loginWithPassword } from "@/server/auth/actions";
import { getAuthConfig, getOptionalLocalContext, safeNextPath } from "@/server/auth/session";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = safeNextPath(readQueryValue(params.next), "/dashboard");
  const error = readQueryValue(params.error);
  const context = await getOptionalLocalContext();
  if (context) {
    redirect(next);
  }

  let authConfigMissing = false;
  try {
    getAuthConfig();
  } catch {
    authConfigMissing = true;
  }

  const errorMessage =
    error === "invalid_credentials"
      ? "パスワードが正しくありません。"
      : error === "auth_config" || authConfigMissing
        ? "認証設定が不足しています。NEXTPATCH_LOGIN_PASSWORD と NEXTPATCH_SESSION_SECRET を設定してください。"
        : null;

  return (
    <main className="auth-page">
      <section className="panel auth-box" aria-labelledby="login-heading">
        <p className="eyebrow">Local access</p>
        <h1 id="login-heading">ログイン</h1>
        <p className="support">簡易パスワードでローカルアクセスを保護します。</p>

        {errorMessage ? (
          <p role="alert" className="banner banner--warning">
            {errorMessage}
          </p>
        ) : null}

        <form action={loginWithPassword} className="form-stack" style={{ marginTop: "var(--space-3)" }}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="password">パスワード</label>
            <input id="password" autoComplete="current-password" autoFocus name="password" required type="password" aria-describedby="login-help" />
          </div>
          <p className="support" id="login-help">
            LAN で使う場合は、信頼できる端末のみに公開してください。
          </p>
          <button className="button" type="submit">
            ログイン
          </button>
        </form>
      </section>
    </main>
  );
}

function readQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
