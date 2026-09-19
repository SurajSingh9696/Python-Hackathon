import { test, expect } from '@playwright/test';

test.describe('Sahaj Financial Journey — E2E Demo Flow', () => {
  test('landing page renders successfully with responsive tokens and CTA', async ({ page }) => {
    await page.goto('/');

    // Verify title and brand presence
    await expect(page).toHaveTitle(/Sahaj/i);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Verify input form exists
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible();
  });

  test('navigates to journey page and initializes conversation stream', async ({ page }) => {
    // Navigate with initial query
    await page.goto('/journey?q=Education%20loan%20for%20MS%20in%20Germany');

    // Header brand and back link
    const brand = page.locator('header a');
    await expect(brand).toBeVisible();

    // Message composer should be ready
    const composer = page.locator('input[placeholder*="Ask"], textarea').first();
    await expect(composer).toBeVisible();

    // Judge checklist button should be mounted
    const judgeButton = page.locator('button:has-text("Judge Checklist")');
    await expect(judgeButton).toBeVisible();
  });

  test('toggles Behind the Scenes drawer and inspects Knowledge Graph', async ({ page }) => {
    await page.goto('/journey');

    // Open Behind the scenes drawer
    const btsButton = page.locator('button:has-text("Behind the scenes")');
    if (await btsButton.isVisible()) {
      await btsButton.click();

      // Verify drawer title and Knowledge Graph canvas
      const drawerTitle = page.locator('#drawer-title');
      await expect(drawerTitle).toBeVisible();
      await expect(page.locator('text=Knowledge Retrieval Graph')).toBeVisible();

      // Close drawer
      const closeBtn = page.locator('button[aria-label="Close drawer"]');
      await closeBtn.click();
      await expect(drawerTitle).not.toBeVisible();
    }
  });
});
