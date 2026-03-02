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

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);
  process.env.CI = "e2e";

  electronApp = await electron.launch({
    executablePath: appInfo.executable,
    args: [],
    env: {
      ...process.env,
      CI: "e2e",
    },
  });
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

  page = await electronApp.firstWindow();
  await page.waitForLoadState("domcontentloaded");
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test.afterEach(async () => {
  await page.unroute("https://nominatim.openstreetmap.org/**");
  await page.unroute("https://router.project-osrm.org/**");
});

test("renders home with update actions", async () => {
  await expect(page.getByTestId("home-card")).toBeVisible();
  await expect(page.getByTestId("home-title")).toBeVisible();
  await expect(page.getByTestId("check-updates-button")).toBeVisible();
});

test("searches assistance in same city and requests route", async () => {
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

  await page.route("https://router.project-osrm.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        routes: [
          {
            geometry: {
              coordinates: [
                [-48.84021, -26.25349],
                [-48.842, -26.2545],
              ],
            },
          },
        ],
      }),
    });
  });

  await page.getByTestId("nav-search-assistance").click();
  await expect(page.getByTestId("search-assistance-input")).toBeVisible();

  const routeRequestPromise = page.waitForRequest(
    /router\.project-osrm\.org\/route\/v1\/driving/,
  );

  await page.getByTestId("search-assistance-input").fill("Joinville, SC");
  await page.getByTestId("search-assistance-submit").click();

  await routeRequestPromise;
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

  let routeRequests = 0;
  await page.route("https://router.project-osrm.org/**", async (route) => {
    routeRequests += 1;
    await route.abort();
  });

  await page.getByTestId("nav-search-assistance").click();
  await page.getByTestId("search-assistance-input").fill(
    "Cidade Sem Assistencia",
  );
  await page.getByTestId("search-assistance-submit").click();

  await expect(page.getByTestId("nearest-assistance-card")).toBeVisible();
  await expect(page.getByTestId("search-no-city-results")).toBeVisible();
  expect(routeRequests).toBe(0);
});
