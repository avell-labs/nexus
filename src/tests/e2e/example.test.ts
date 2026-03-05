import {
  test,
  expect,
  _electron as electron,
  ElectronApplication,
  Page,
} from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

/*
 * Using Playwright with Electron:
 * https://www.electronjs.org/pt/docs/latest/tutorial/automated-testing#using-playwright
 */

let electronApp: ElectronApplication;
let page: Page;

function getPackagedAppInfo() {
  try {
    const latestBuild = findLatestBuild();
    const appInfo = parseElectronApp(latestBuild);

    if (!appInfo.executable) {
      throw new Error("No executable path found in packaged build.");
    }

    return { latestBuild, appInfo };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to resolve packaged Electron build. Reason: ${reason}`,
    );
  }
}

test.beforeAll(async () => {
  const { latestBuild, appInfo } = getPackagedAppInfo();
  process.env.CI = "e2e";

  try {
    electronApp = await electron.launch({
      executablePath: appInfo.executable,
      args: [],
      env: {
        ...process.env,
        CI: "e2e",
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to launch packaged app. build="${latestBuild}" executable="${appInfo.executable}" reason="${reason}"`,
    );
  }

  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });

  try {
    page = await electronApp.firstWindow({ timeout: 60_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await electronApp.close();
    throw new Error(
      `Electron app launched but first window did not become ready. build="${latestBuild}" reason="${reason}"`,
    );
  }
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test.afterEach(async () => {
  await page.unroute("https://nominatim.openstreetmap.org/**");
});

test("renders authenticated shell navigation", async () => {
  await expect(page.locator('a[href="/search_assistance"]').first()).toBeVisible();
  await expect(page.locator('a[href="/trackingPage"]').first()).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: /toggle sidebar|alternar barra lateral/i })
      .first(),
  ).toBeVisible();
});

test("searches assistance in same city", async () => {
  await page.route("https://nominatim.openstreetmap.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          lat: "-26.25349",
          lon: "-48.84021",
          display_name: "Joinville, SC, Brasil",
          address: {
            city: "Joinville",
          },
        },
      ]),
    });
  });

  await page.locator('a[href="/search_assistance"]').first().click();
  await expect(page.getByTestId("search-assistance-input")).toBeVisible();

  await page.getByTestId("search-assistance-input").fill("Joinville, SC");
  await page.getByTestId("search-assistance-submit").click();

  await expect(page.getByTestId("nearest-assistance-card")).toBeVisible();
  await expect(page.getByText("Avell Joinville")).toBeVisible();
  await expect(page.getByTestId("search-no-city-results")).toHaveCount(0);
});

test("falls back to nearest assistance without route when city has no match", async () => {
  await page.route("https://nominatim.openstreetmap.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          lat: "-2.54318",
          lon: "-44.20844",
          display_name: "Cidade Sem Assistencia, BR",
          address: {
            city: "Cidade Sem Assistencia",
          },
        },
      ]),
    });
  });

  await page.locator('a[href="/search_assistance"]').first().click();
  await page.getByTestId("search-assistance-input").fill(
    "Cidade Sem Assistencia",
  );
  await page.getByTestId("search-assistance-submit").click();

  await expect(page.getByTestId("nearest-assistance-card")).toBeVisible();
  await expect(page.getByTestId("search-no-city-results")).toBeVisible();
});
