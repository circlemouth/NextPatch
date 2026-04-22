"use client";

import { createRepositoryWithState, type RepositoryFormState } from "@/server/actions/repositories";
import { useActionState } from "react";

const initialState: RepositoryFormState = {
  error: null
};

export function RepositoryCreateForm() {
  const [state, formAction, isPending] = useActionState(createRepositoryWithState, initialState);

  return (
    <form action={formAction} className="form-stack">
      {state.error ? (
        <p className="error-text" id="repository-create-error">
          {state.error}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="name">
          リポジトリ名<span className="required">※必須</span>
        </label>
        <p className="support">一覧で見分けるための表示名です。</p>
        <input id="name" name="name" required aria-describedby={state.error ? "repository-create-error" : undefined} />
      </div>
      <div className="field">
        <label htmlFor="htmlUrl">
          GitHub URL<span className="required">※任意</span>
        </label>
        <p className="support">例: https://github.com/owner/repo。Issue/PR URL も owner/repo を抽出します。</p>
        <input id="htmlUrl" name="htmlUrl" type="url" />
      </div>
      <div className="field">
        <label htmlFor="currentFocus">
          現在の焦点<span className="required">※任意</span>
        </label>
        <p className="support">次に見るべきことを 1 つだけ書きます。</p>
        <textarea id="currentFocus" name="currentFocus" />
      </div>
      <div className="field field--subtle">
        <label htmlFor="productionStatus">
          稼働状態<span className="required">※必須</span>
        </label>
        <p className="support">通常は development のままで問題ありません。</p>
        <select id="productionStatus" name="productionStatus" defaultValue="development">
          <option value="planning">planning</option>
          <option value="development">development</option>
          <option value="active_production">active_production</option>
          <option value="maintenance">maintenance</option>
          <option value="paused">paused</option>
        </select>
      </div>
      <div className="field field--subtle">
        <label htmlFor="criticality">
          重要度<span className="required">※必須</span>
        </label>
        <p className="support">障害時の影響が大きいものほど high を選びます。</p>
        <select id="criticality" name="criticality" defaultValue="medium">
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "保存中" : "保存"}
      </button>
    </form>
  );
}
