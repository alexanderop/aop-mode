import { expect, test } from '@playwright/test';

test('visitor can install, inspect evidence, and find upstream credit', async ({ page }, testInfo) => {
  await page.goto('/aop-mode/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A deliberate workflow. On your terms.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('link', { name: 'Start with aop-mode' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting started');
  await expect(page.getByText('pnpm skills:install codex', { exact: false }).first()).toBeVisible();
  await page.goto('/aop-mode/');
  await page.getByRole('link', { name: 'Inspect the evidence' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Latest local evidence');
  await page.goto('/aop-mode/catalog/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Complete skill catalog');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(55);
  await page.getByRole('link', { name: 'runtime compatibility', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Runtime compatibility');
  await page.goto('/aop-mode/');
  await page.getByRole('link', { name: 'Read the credits' }).click();
  await expect(page.getByRole('link', { name: 'pstack', exact: true })).toHaveAttribute('href', 'https://github.com/cursor/plugins/tree/main/pstack');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('built search finds the task testing guide', async ({ page }) => {
  await page.goto('/aop-mode/');
  await page.getByRole('button', { name: /search/i }).click();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('pagination');
  await expect(page.getByRole('dialog').getByRole('link', { name: /End-to-end testing/i }).first()).toBeVisible();
});
