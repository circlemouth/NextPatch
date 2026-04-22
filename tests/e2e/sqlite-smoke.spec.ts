import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("SQLite local smoke: repositories home, repository detail, settings menu, and export links", async ({ page }, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const guards = installPageGuards(page);

  const unauthenticatedExportResponse = await page.request.get("/api/export/json");
  expect(unauthenticatedExportResponse.status()).toBe(401);

  await gotoAndAssertHealthy(page, guards, "/repositories", "repositories redirect");
  await expect(page).toHaveURL(/\/login\?next=%2Frepositories$/);
  await expect(page.getByRole("heading", { name: "LAN内利用向けの簡易ログイン" })).toBeVisible();
  await assertNoExternalAuthPrompts(page);
  await guards.assertHealthy("login page");

  await page.getByLabel(/ログインパスワード/).fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByText("＊パスワードが一致しません。管理者が設定したログインパスワードを入力してください。")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?next=%2Frepositories&error=invalid$/);
  await guards.assertHealthy("invalid login");

  await page.getByLabel(/ログインパスワード/).fill("   ");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByText("＊ログインパスワードを入力してください。")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?next=%2Frepositories&error=required$/);
  await guards.assertHealthy("required login");

  await page.getByLabel(/ログインパスワード/).fill("e2e-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/repositories$/);
  await expect(page.getByRole("heading", { name: "リポジトリ" })).toBeVisible();
  await assertNoExternalAuthPrompts(page);
  await guards.assertHealthy("authenticated repositories");

  await expect(page).toHaveURL(/\/repositories$/);
  await guards.assertHealthy("repositories home");

  await page.getByLabel(/リポジトリ名/).fill(`QA Repo ${suffix}`);
  await page.getByLabel(/GitHub URL/).fill(`https://github.com/example/qa-${suffix}`);
  await page.getByLabel(/現在の焦点/).fill(`Focus for ${suffix}`);
  await page.getByLabel(/稼働状態/).selectOption("active_production");
  await page.getByLabel(/重要度/).selectOption("high");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/repositories\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: `QA Repo ${suffix}` })).toBeVisible();
  await expect(page.getByText(`Focus for ${suffix}`)).toBeVisible();
  await guards.assertHealthy("repository create");

  await page.getByLabel(/現在の焦点/).fill(`Updated focus for ${suffix}`);
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/repositories\/[0-9a-f-]+$/);
  await expect(page.getByText(`Updated focus for ${suffix}`)).toBeVisible();
  await guards.assertHealthy("repository focus update");

  await page.getByLabel(/種類/).selectOption("task");
  await page.getByLabel(/内容/).fill(`QA task ${suffix}\nFollow-up line.`);
  await page.getByLabel(/タイトル/).fill("");
  await page.getByLabel(/優先度/).selectOption("p1");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page).toHaveURL(/\/repositories\/[0-9a-f-]+$/);
  await expect(page.getByText(`QA task ${suffix}`)).toBeVisible();
  await guards.assertHealthy("quick write create");

  const taskCard = page.locator("article").filter({ has: page.getByRole("heading", { name: `QA task ${suffix}` }) }).first();
  await taskCard.getByRole("button", { name: "着手" }).click();
  await expect(taskCard.getByText("doing")).toBeVisible();
  await guards.assertHealthy("task status update");

  await page.getByRole("button", { name: "メニュー" }).click();
  await page.getByRole("link", { name: "データ管理" }).click();
  await expect(page).toHaveURL(/\/settings\/data$/);
  await expect(page.getByRole("link", { name: "JSON export" })).toHaveAttribute("href", "/api/export/json");
  await expect(page.getByRole("link", { name: "Markdown export" })).toHaveAttribute("href", "/api/export/markdown");
  await expect(page.getByRole("link", { name: "CSV export" })).toHaveAttribute("href", "/api/export/csv");
  await assertExportRouteOk(page, "/api/export/json");
  await assertExportRouteOk(page, "/api/export/markdown");
  await assertExportRouteOk(page, "/api/export/csv");
  await guards.assertHealthy("export links");

  await page.getByRole("button", { name: "メニュー" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await gotoAndAssertHealthy(page, guards, "/repositories", "repositories after logout");
  await expect(page).toHaveURL(/\/login\?next=%2Frepositories$/);
  await expect(page.getByRole("heading", { name: "LAN内利用向けの簡易ログイン" })).toBeVisible();
  await guards.assertHealthy("logout redirects to login");
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
