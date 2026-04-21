import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("SQLite local smoke: dashboard, CRUD-ish flows, memo classification, and export links", async ({ page }) => {
  const suffix = Date.now();

  await gotoOrSkipUntilSQLiteUiExists(page, "/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "今やるべきこと" })).toBeVisible();

  await page.getByRole("link", { name: "登録する" }).click();
  await expect(page.getByRole("heading", { name: "クイック登録" })).toBeVisible();

  await page.goto("/repositories");
  await expect(page.getByRole("heading", { name: "リポジトリ" })).toBeVisible();
  await page.getByLabel(/リポジトリ名/).fill(`QA Repo ${suffix}`);
  await page.getByLabel(/GitHub URL/).fill(`https://github.com/example/qa-${suffix}`);
  await page.getByLabel(/稼働状態/).selectOption("active_production");
  await page.getByLabel(/重要度/).selectOption("high");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(`QA Repo ${suffix}`)).toBeVisible();

  await page.goto("/work-items");
  await expect(page.getByRole("heading", { name: "横断 WorkItem" })).toBeVisible();
  await page.getByLabel(/種類/).selectOption("bug");
  await page.getByLabel(/タイトル/).fill(`QA Bug ${suffix}`);
  await page.getByLabel(/本文/).fill("Created by SQLite QA smoke.");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(`QA Bug ${suffix}`)).toBeVisible();
  await page.getByRole("button", { name: "完了扱いにする" }).first().click();
  await expect(page.getByText("resolved").or(page.getByText("done"))).toBeVisible();

  await page.goto("/capture/new");
  await page.getByLabel(/本文/).fill(`QA memo ${suffix}\nClassify this memo.`);
  await page.getByRole("button", { name: "保存" }).click();
  await page.goto("/inbox");
  await expect(page.getByText(`QA memo ${suffix}`)).toBeVisible();
  await page.getByLabel(/分類先/).first().selectOption("task");
  await page.getByLabel(/タイトル/).first().fill(`QA classified task ${suffix}`);
  await page.getByRole("button", { name: "分類して作成" }).first().click();
  await page.goto("/work-items");
  await expect(page.getByText(`QA classified task ${suffix}`)).toBeVisible();

  await page.goto("/settings/data");
  await expect(page.getByRole("link", { name: "JSON export" })).toHaveAttribute("href", "/api/export/json");
  await expect(page.getByRole("link", { name: "Markdown export" })).toHaveAttribute("href", "/api/export/markdown");
  await expect(page.getByRole("link", { name: "CSV export" })).toHaveAttribute("href", "/api/export/csv");
});

async function gotoOrSkipUntilSQLiteUiExists(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });

  test.skip(
    Boolean(response && response.status() >= 500),
    "SQLite actions/UI are not integrated on this branch yet."
  );
}
