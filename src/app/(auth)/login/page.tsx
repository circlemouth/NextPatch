import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/server/auth/actions";
import { getAuthConfig } from "@/server/auth/config";
import { sanitizeNextPath } from "@/server/auth/redirects";
import { getAuthenticatedLocalContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login | NextPatch"
};

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
  const nextPath = sanitizeNextPath(Array.isArray(params?.next) ? params?.next[0] : params?.next);
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const config = getAuthConfig();

  return (
    <main className="auth-page">
      <div className="auth-box">
        <header className="page-header">
          <p className="eyebrow">Login</p>
          <h1>NextPatch にサインイン</h1>
          <p className="support">単一ユーザー向けのローカル認証です。保存先は HttpOnly cookie です。</p>
        </header>

        <section className="panel">
          {!config ? (
            <div className="banner banner--error" role="alert">
              <strong>認証設定がありません</strong>
              <p>
                `NEXTPATCH_LOGIN_PASSWORD` と `NEXTPATCH_SESSION_SECRET` を設定するとログインが有効になります。
              </p>
            </div>
          ) : null}

          {error === "invalid" ? (
            <div className="banner banner--error" role="alert">
              <strong>パスワードが違います</strong>
              <p>設定済みの `NEXTPATCH_LOGIN_PASSWORD` を入力してください。</p>
            </div>
          ) : null}

          {error === "disabled" ? (
            <div className="banner banner--error" role="alert">
              <strong>ログインは無効です</strong>
              <p>認証設定が未投入のため、セッションを発行できません。</p>
            </div>
          ) : null}

          <form action={loginAction} className="form-stack">
            <input name="next" type="hidden" value={nextPath} />
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <div className="button-row">
              <button className="button" type="submit">
                ログイン
              </button>
              <Link className="button button--secondary" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
