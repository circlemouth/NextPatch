import { quickCapture } from "@/server/actions/capture";
import { requireLocalContext } from "@/server/auth/session";
import { listRepositories } from "@/server/db/queries/repositories";

export default async function CapturePage() {
  const { workspace } = await requireLocalContext();
  const repositories = await listRepositories(workspace.id);

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Quick Capture</p>
        <h1>クイック登録</h1>
        <p className="support">本文だけで保存できます。Repository 未選択なら未整理メモとしてローカル DB に保存します。</p>
      </header>
      <section className="panel">
        <form action={quickCapture} className="form-stack">
          <div className="field">
            <label htmlFor="body">本文<span className="required">※必須</span></label>
            <p className="support">ChatGPT の回答を貼り付ける場合も原文を保存します。JSON 解析に失敗しても本文は失われません。</p>
            <textarea id="body" name="body" />
          </div>
          <div className="field">
            <label htmlFor="repositoryId">Repository<span className="required">※任意</span></label>
            <select id="repositoryId" name="repositoryId" defaultValue="">
              <option value="">未確定</option>
              {repositories.map((repository) => (
                <option value={repository.id} key={repository.id}>{repository.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="type">種類<span className="required">※任意</span></label>
            <p className="support">迷う場合は auto のまま保存してください。</p>
            <select id="type" name="type" defaultValue="auto">
              <option value="auto">auto: 未整理メモ</option>
              <option value="task">task</option>
              <option value="bug">bug</option>
              <option value="idea">idea</option>
              <option value="implementation">implementation</option>
              <option value="future_feature">future_feature</option>
              <option value="memo">memo</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="title">タイトル<span className="required">※任意</span></label>
            <p className="support">未入力なら本文の先頭行を使います。</p>
            <input id="title" name="title" />
          </div>
          <div className="field">
            <label htmlFor="privacyLevel">機密度<span className="required">※必須</span></label>
            <select id="privacyLevel" name="privacyLevel" defaultValue="normal">
              <option value="normal">normal</option>
              <option value="confidential">confidential</option>
              <option value="secret">secret</option>
              <option value="no_ai">no_ai</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sourceType">入力元<span className="required">※必須</span></label>
            <select id="sourceType" name="sourceType" defaultValue="manual">
              <option value="manual">manual</option>
              <option value="chatgpt">chatgpt paste</option>
            </select>
          </div>
          <div className="field">
            <label>
              <input name="isPinned" type="checkbox" /> 今やる候補として固定する
            </label>
            <p className="support">固定すると Dashboard の Now で優先して見えます。</p>
          </div>
          <button className="button" type="submit">保存</button>
        </form>
      </section>
    </main>
  );
}
