import { expect, test } from "@playwright/test";

test.describe("Bida Script Reader", () => {
  test("opens the sample, edits it, autosaves and lists it in recents", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No recent scripts yet")).toBeVisible();

    await page.getByRole("button", { name: "Try the sample" }).click();
    await expect(page).toHaveURL(/\/script\//);
    await expect(page.getByRole("heading", { name: "THE LAST LIGHTHOUSE" })).toBeVisible();

    // Preview renders the title page and numbered scene headings.
    await expect(page.getByRole("region", { name: "Title page" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Page 1" }).getByText("EXT. ROCKY COASTLINE - DAWN")).toBeVisible();

    // Outline lists scenes; clicking one moves the editor.
    const outline = page.getByRole("navigation", { name: "Script outline" });
    await expect(outline.getByText("INT. LIGHTHOUSE - LAMP ROOM - NIGHT")).toBeVisible();

    // Type at the end of the script and wait for autosave.
    const editor = page.getByRole("textbox", { name: "Screenplay editor" });
    await editor.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("\n\nINT. NEW ROOM - DAY\n\nSomething new happens.");
    await expect(page.getByText("All changes saved").or(page.getByText("Saved in browser"))).toBeVisible({ timeout: 5000 });
    await expect(outline.getByText("INT. NEW ROOM - DAY")).toBeVisible();

    // Reload keeps the edit (snapshot in IndexedDB).
    await page.reload();
    await expect(page.getByRole("navigation", { name: "Script outline" }).getByText("INT. NEW ROOM - DAY")).toBeVisible();

    // Recents shows the script.
    await page.getByRole("button", { name: "Back to home" }).click();
    await expect(page.getByRole("button", { name: "Open THE LAST LIGHTHOUSE" })).toBeVisible();
  });

  test("Tab cycles the element type of the current line", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New script" }).click();
    const editor = page.getByRole("textbox", { name: "Screenplay editor" });
    await editor.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("Mara");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab"); // action → scene heading
    await page.keyboard.press("Tab"); // scene heading → character
    await expect(page.locator(".cm-line.cm-fountain-character")).toHaveText("@Mara");
  });

  test("switches between light and dark mode and persists it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Change theme" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("read mode shows only the paginated script", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try the sample" }).click();
    await page
      .getByRole("radio", { name: "Read view" })
      .or(page.getByRole("button", { name: "Read view" }))
      .click();
    await expect(page.getByRole("textbox", { name: "Screenplay editor" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Page 2" })).toBeVisible();
  });
});
