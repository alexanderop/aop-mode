import { expect, test } from '@playwright/test';

test('visitor can install, inspect evidence, and find upstream credit', async ({
  page,
}, testInfo) => {
  await page.goto('/aop-mode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Coding workflows you invoke explicitly',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.locator('[data-diagram] svg')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('link', { name: 'Install aop-mode', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install aop-mode');
  await expect(page.getByText('pnpm skills:install codex', { exact: false }).first()).toBeVisible();
  await page.goto('/aop-mode/');
  await page.getByRole('link', { name: 'Inspect the evidence' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Latest local evidence');
  await page.goto('/aop-mode/catalog/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Complete skill catalog');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(62);
  await page.getByRole('link', { name: 'runtime compatibility', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Runtime compatibility');
  await page.goto('/aop-mode/');
  await page.getByRole('link', { name: 'Read the credits' }).click();
  await expect(page.getByRole('link', { name: 'pstack', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/cursor/plugins/tree/main/pstack',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('built search finds the task testing guide', async ({ page }) => {
  await page.goto('/aop-mode/');
  await page.getByRole('button', { name: /search/i }).click();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('pagination');
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', { name: /End-to-end testing/i })
      .first(),
  ).toBeVisible();
});

test('reader follows the walkthrough and reads diagrams in both themes', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/aop-mode/');
  const diagram = page.getByRole('img', { name: 'From request to workflow', exact: true });
  await expect(diagram.locator('svg')).toBeVisible();
  await page.getByRole('link', { name: 'fix your first bug', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fix your first bug');
  await expect(
    page.getByRole('img', { name: 'Two separate checks', exact: true }).locator('svg'),
  ).toBeVisible();
  await expect(page.getByText('not a transcript of your run', { exact: false })).toBeVisible();
  for (const theme of ['light', 'dark']) {
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    if (testInfo.project.name === 'mobile') await menu.click();
    const oldTheme = await page.locator('html').getAttribute('data-theme');
    const oldDiagram = await page.locator('[data-diagram] svg').getAttribute('id');
    await page.getByRole('combobox', { name: 'Select theme' }).selectOption(theme);
    if (testInfo.project.name === 'mobile') await menu.click();
    if (oldTheme !== theme) {
      await expect(page.locator('[data-diagram] svg')).not.toHaveAttribute('id', oldDiagram ?? '');
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('[data-diagram] svg')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`walkthrough-${theme}.png`),
      fullPage: true,
    });
  }
  await page.getByText('Diagram text', { exact: true }).click();
  await expect(page.locator('[data-diagram] details pre')).toBeVisible();
  for (const path of ['workflow', 'architecture', 'testing']) {
    await page.goto(`/aop-mode/${path}/`);
    await expect(page.locator('[data-diagram] svg')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/aop-mode/workflow/');
  await page.getByRole('link', { name: 'Choose a workflow', exact: true }).last().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a workflow');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'workflow pilot evidence', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workflow pilot evidence');
  expect(errors).toEqual([]);
});
