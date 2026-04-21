import { signInWithEmail } from "@/server/actions/auth";

type LoginPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-box panel" aria-labelledby="login-title">
        <div className="page-header">
          <p className="eyebrow">Private local server</p>
          <h1 id="login-title">NextPatch にログイン</h1>
          <p className="support">ローカル運用では固定の local-user で利用します。</p>
        </div>
        {params.message ? <p className="banner">{params.message}</p> : null}
        <form action={signInWithEmail} className="form-stack">
          <div className="field">
            <label htmlFor="email">
              メールアドレス<span className="required">※必須</span>
            </label>
            <p className="support">現在はローカルユーザーとしてそのまま開始します。</p>
            <input id="email" name="email" type="email" autoComplete="email" />
          </div>
          <button className="button" type="submit">
            開始する
          </button>
        </form>
      </section>
    </main>
  );
}
