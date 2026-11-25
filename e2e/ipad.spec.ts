import { expect, test } from "@playwright/test";

/**
 * Emulates iPadOS Safari: no File System Access API and an iPad user agent,
 * so the app must fall back to an unfiltered <input type="file">.
 */
test.use({
  userAgent:
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  viewport: { width: 1024, height: 1366 },
  hasTouch: true,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Simulate a browser without the File System Access API.
    delete window.showOpenFilePicker;
    delete window.showSaveFilePicker;
  });
});

const SCRIPT = "Title: iPad Draft\n\nINT. CAFE - DAY\n\nANNA\nIt opened on my iPad.\n";

test("opens a .fountain file from the iPad file picker", async ({ page }) => {
  await page.goto("/");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Open script/ }).tap();
  const chooser = await chooserPromise;

  // No `accept` filter, otherwise iPadOS greys out .fountain files.
  expect(await chooser.element().getAttribute("accept")).toBeNull();

  await chooser.setFiles({ name: "ipad-draft.fountain", mimeType: "", buffer: Buffer.from(SCRIPT) });
  await expect(page).toHaveURL(/\/script\//);
  await expect(page.getByRole("heading", { name: "iPad Draft" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Script outline" }).getByText("INT. CAFE - DAY")).toBeVisible();
});

test("rejects files that are not Fountain scripts", async ({ page }) => {
  await page.goto("/");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Open script/ }).tap();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8]) });
  await expect(page.getByText(/is not a Fountain file/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
