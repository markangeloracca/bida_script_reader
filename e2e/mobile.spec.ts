import { expect, test, type Page } from "@playwright/test";

/**
 * Emulates mobile browsers that lack the File System Access API, so the app
 * falls back to an unfiltered <input type="file"> and validates afterwards.
 */
const DEVICES = [
  {
    name: "iPad Safari",
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    viewport: { width: 1024, height: 1366 },
  },
  {
    name: "Android Chrome",
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    viewport: { width: 412, height: 915 },
  },
] as const;

const SCRIPT = "Title: Mobile Draft\n\nINT. CAFE - DAY\n\nANNA\nIt opened on my phone.\n";

async function chooseFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.goto("/");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Open script/ }).tap();
  const chooser = await chooserPromise;
  // No `accept` filter: mobile pickers would hide or grey out .fountain files.
  expect(await chooser.element().getAttribute("accept")).toBeNull();
  await chooser.setFiles(file);
}

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({ userAgent: device.userAgent, viewport: device.viewport, hasTouch: true, isMobile: false });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        // Simulate a browser without the File System Access API.
        delete window.showOpenFilePicker;
        delete window.showSaveFilePicker;
      });
    });

    test("opens a .fountain file from the system file picker", async ({ page }) => {
      // Android reports .fountain files as application/octet-stream.
      await chooseFile(page, { name: "draft.fountain", mimeType: "application/octet-stream", buffer: Buffer.from(SCRIPT) });
      await expect(page).toHaveURL(/\/script\//);
      await expect(page.getByRole("heading", { name: "Mobile Draft" })).toBeVisible();
      // iPad opens in split view, phones in the reading view: either way the script is shown.
      await expect(page.getByText("INT. CAFE - DAY").first()).toBeVisible();
    });

    test("opens a text file whose provider dropped the extension", async ({ page }) => {
      await chooseFile(page, { name: "Mobile Draft", mimeType: "", buffer: Buffer.from(SCRIPT) });
      await expect(page).toHaveURL(/\/script\//);
      // iPad opens in split view, phones in the reading view: either way the script is shown.
      await expect(page.getByText("INT. CAFE - DAY").first()).toBeVisible();
    });

    test("rejects files that are not Fountain scripts", async ({ page }) => {
      await chooseFile(page, { name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8]) });
      await expect(page.getByText(/is not a Fountain file/)).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
    });
  });
}

test.describe("Reading on a phone", () => {
  test.use({ userAgent: DEVICES[1].userAgent, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("opens in a readable, reflowed layout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try the sample" }).tap();
    await expect(page).toHaveURL(/\/script\//);

    // Phones open in Read view (split is not offered) with the continuous layout.
    const flow = page.locator("[data-layout=flow]");
    await expect(flow).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Screenplay editor" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Split view" })).toHaveCount(0);
    await expect(page.locator(".screenplay-page")).toHaveCount(0);

    // Comfortable type, no sideways scrolling, and page markers for reference.
    const fontSize = await flow.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(14);
    const overflows = await flow.evaluate((el) => {
      const scroller = el.closest(".overflow-auto") as HTMLElement;
      return scroller.scrollWidth > scroller.clientWidth || document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflows).toBe(false);
    await expect(page.getByRole("separator", { name: "Page 2" })).toBeAttached();

    // The status bar follows the reading position.
    await flow.getByRole("heading", { name: /LIGHTHOUSE GALLERY/ }).evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(page.getByText(/Scene 4: EXT\. LIGHTHOUSE GALLERY/)).toBeVisible();
  });

  test("outline jumps to a scene and edit view is one tap away", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try the sample" }).tap();
    await page.getByRole("button", { name: "Toggle outline" }).tap();
    await page.getByRole("navigation", { name: "Script outline" }).getByText("INT. LIGHTHOUSE - LAMP ROOM - NIGHT").tap();
    await expect(page.locator("[data-layout=flow]").getByRole("heading", { name: /LAMP ROOM/ })).toBeInViewport();

    await page.getByRole("button", { name: "Edit view" }).tap();
    await expect(page.getByRole("textbox", { name: "Screenplay editor" })).toBeVisible();
  });
});
