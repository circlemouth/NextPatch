import { enterLocalApp } from "@/server/actions/auth";

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
          <p className="support">
            SQLite ローカル運用では固定のローカルユーザーで起動します。
          </p>
        </div>
        {params.message ? <p className="banner">{params.message}</p> : null}
        <form action={enterLocalApp} className="form-stack">
          <p className="support">外部認証は使いません。データはローカル SQLite runtime に保存する前提です。</p>
          <button className="button" type="submit">
            ローカルで開始
          </button>
        </form>
      </section>
    </main>
  );
}
