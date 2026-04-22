"use client";

import { createWorkItemWithState, type WorkItemFormState } from "@/server/actions/work-items";
import { useActionState } from "react";

const initialState: WorkItemFormState = {
  error: null
};

type QuickWriteFormProps = {
  repositoryId: string;
};

export function QuickWriteForm({ repositoryId }: QuickWriteFormProps) {
  const [state, formAction, isPending] = useActionState(createWorkItemWithState, initialState);
  const errorId = "quick-write-body-error";

  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="repositoryId" value={repositoryId} />
      <div className="field">
        <label htmlFor="quickType">
          種類<span className="required">※必須</span>
        </label>
        <p className="support">メモ / タスク / バグ から選びます。</p>
        <select id="quickType" name="type" defaultValue="memo">
          <option value="memo">メモ</option>
          <option value="task">タスク</option>
          <option value="bug">バグ</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="quickBody">
          内容<span className="required">※必須</span>
        </label>
        <p className="support">まず内容を書きます。タイトル未入力なら内容の先頭行から作ります。</p>
        {state.error ? (
          <p className="error-text" id={errorId}>
            {state.error}
          </p>
        ) : null}
        <textarea id="quickBody" name="body" required aria-describedby={state.error ? errorId : undefined} />
      </div>
      <div className="field">
        <label htmlFor="quickTitle">
          タイトル<span className="required">※任意</span>
        </label>
        <p className="support">一覧で短く見分けたい場合だけ入力します。</p>
        <input id="quickTitle" name="title" />
      </div>
      <div className="field field--subtle">
        <label htmlFor="priority">
          優先度<span className="required">※必須</span>
        </label>
        <p className="support">通常は p2 のままで問題ありません。</p>
        <select id="priority" name="priority" defaultValue="p2">
          <option value="p0">p0</option>
          <option value="p1">p1</option>
          <option value="p2">p2</option>
          <option value="p3">p3</option>
          <option value="p4">p4</option>
        </select>
      </div>
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "保存中" : "保存"}
      </button>
    </form>
  );
}
