import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("SQLite local smoke: dashboard, CRUD-ish flows, memo classification, and export links", async ({ page }, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const guards = installPageGuards(page);

  await gotoAndAssertHealthy(page, guards, "/dashboard", "dashboard redirect");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await assertNoExternalAuthPrompts(page);
  await guards.assertHealthy("login page");

  await page.getByLabel("パスワード").fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("alert")).toHaveText("パスワードが正しくありません。");
  await expect(page).toHaveURL(/\/login\?error=invalid_credentials/);
  await guards.assertHealthy("invalid login");

  await page.getByLabel("パスワード").fill("e2e-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "今やるべきこと" })).toBeVisible();
  await assertNoExternalAuthPrompts(page);
  await guards.assertHealthy("authenticated dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "今やるべきこと" })).toBeVisible();
  await guards.assertHealthy("dashboard");

  await page.getByRole("link", { name: "登録する" }).click();
  await expect(page.getByRole("heading", { name: "クイック登録" })).toBeVisible();
  await guards.assertHealthy("quick capture entry");

  await gotoAndAssertHealthy(page, guards, "/repositories", "repositories");
  await expect(page.getByRole("heading", { name: "リポジトリ" })).toBeVisible();
  await page.getByLabel(/リポジトリ名/).fill(`QA Repo ${suffix}`);
  await page.getByLabel(/GitHub URL/).fill(`https://github.com/example/qa-${suffix}`);
  await page.getByLabel(/稼働状態/).selectOption("active_production");
  await page.getByLabel(/重要度/).selectOption("high");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(`QA Repo ${suffix}`)).toBeVisible();
  await guards.assertHealthy("repository create");

  await gotoAndAssertHealthy(page, guards, "/work-items", "work items");
  await expect(page.getByRole("heading", { name: "横断 WorkItem" })).toBeVisible();
  await page.getByLabel(/種類/).selectOption("bug");
  await page.getByLabel(/タイトル/).fill(`QA Bug ${suffix}`);
  await page.getByLabel(/本文/).fill("Created by SQLite QA smoke.");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(`QA Bug ${suffix}`)).toBeVisible();
  await guards.assertHealthy("work item create");

  await gotoAndAssertHealthy(page, guards, "/work-items", "work items refresh");
  const workItemCard = page.locator("article").filter({ has: page.getByRole("heading", { name: `QA Bug ${suffix}` }) });
  await workItemCard.getByRole("button", { name: "確認済みにする" }).click();
  await expect(workItemCard.getByText("confirmed")).toBeVisible();
  await workItemCard.getByRole("button", { name: "修正済み・確認待ち" }).click();
  await expect(workItemCard.getByText("fixed_waiting")).toBeVisible();
  await workItemCard.getByRole("button", { name: "解決済みにする" }).click();
  await expect(workItemCard.getByText("resolved")).toBeVisible();
  await guards.assertHealthy("work item status update");

  await gotoAndAssertHealthy(page, guards, "/capture/new", "capture new");
  await page.getByLabel(/本文/).fill(`QA memo ${suffix}\nClassify this memo.`);
  await page.getByRole("button", { name: "保存" }).click();
  await guards.assertHealthy("capture memo create");

  await gotoAndAssertHealthy(page, guards, "/inbox", "inbox");
  await expect(page.getByRole("heading", { name: `QA memo ${suffix}` })).toBeVisible();
  const memoCard = page.locator("article").filter({ has: page.getByRole("heading", { name: `QA memo ${suffix}` }) });
  await memoCard.getByLabel(/分類先/).selectOption("task");
  await memoCard.getByLabel(/タイトル/).fill(`QA classified task ${suffix}`);
  await memoCard.getByRole("button", { name: "分類して作成" }).click();
  await guards.assertHealthy("memo classification");

  await gotoAndAssertHealthy(page, guards, "/work-items", "work items after classification");
  await expect(page.getByRole("heading", { name: `QA classified task ${suffix}` })).toBeVisible();
  await guards.assertHealthy("classified work item visible");

  await gotoAndAssertHealthy(page, guards, "/settings/data", "settings data");
  await expect(page.getByRole("link", { name: "JSON export" })).toHaveAttribute("href", "/api/export/json");
  await expect(page.getByRole("link", { name: "Markdown export" })).toHaveAttribute("href", "/api/export/markdown");
  await expect(page.getByRole("link", { name: "CSV export" })).toHaveAttribute("href", "/api/export/csv");
  await assertExportRouteOk(page, "/api/export/json");
  await assertExportRouteOk(page, "/api/export/markdown");
  await assertExportRouteOk(page, "/api/export/csv");
  await guards.assertHealthy("export links");
});

function installPageGuards(page: Page) {
  const failures: string[] = [];

  page.on("response", (response) => {
    if (response.status() >= 500) {
      failures.push(`${response.request().method()} ${response.url()} -> ${response.status()}`);
    }
  });

  page.on("pageerror", (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (isExpectedDevNoise(text)) {
        return;
      }
      failures.push(`console.error: ${text}`);
    }
  });

  return {
    async assertHealthy(context: string) {
      expect(failures, `${context} produced browser/runtime errors:\n${failures.join("\n")}`).toEqual([]);
    }
  };
}

function isExpectedDevNoise(text: string) {
  return /WebSocket connection to .*\/_next\/webpack-hmr/i.test(text) || /Blocked cross-origin request to Next\.js dev resource .*\/_next\/webpack-hmr/i.test(text);
}

async function gotoAndAssertHealthy(page: Page, guards: ReturnType<typeof installPageGuards>, path: string, context: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `${context} did not return an HTTP response`).not.toBeNull();
  expect(response?.status(), `${context} returned HTTP ${response?.status() ?? "unknown"}`).toBeLessThan(500);
  await guards.assertHealthy(context);
}

async function assertExportRouteOk(page: Page, route: string) {
  const response = await page.request.get(route);
  expect(response.status(), `${route} returned HTTP ${response.status()}`).toBe(200);
}

async function assertNoExternalAuthPrompts(page: Page) {
  await expect(page.getByText(new RegExp(["Supa", "base"].join(""), "i"))).toHaveCount(0);
  await expect(page.getByText(new RegExp(["magic", "link"].join("\\s+"), "i"))).toHaveCount(0);
  await expect(page.getByText(new RegExp(["signIn", "With", "Otp"].join(""), "i"))).toHaveCount(0);
  await expect(page.getByText(/oauth/i)).toHaveCount(0);
}
