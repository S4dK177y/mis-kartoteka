const { test, expect } = require('@playwright/test');

test.describe('Patients Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test. Assuming setup is already done by auth.spec.js or we do it if needed.
    await page.goto('/');
    
    await page.locator('h1, h2').first().waitFor({ timeout: 10000 }).catch(() => {});
    let title = (await page.locator('h1, h2').first().textContent().catch(() => '') || '').trim();

    if (title === 'Инициализация защиты') {
      await page.locator('input[type="password"]').first().fill('masterpass123');
      await page.locator('input[type="password"]').nth(1).fill('masterpass123');
      await page.getByRole('button', { name: 'Зашифровать данные' }).click();
      await page.waitForURL((url) => !url.href.includes('locked'), { timeout: 15000 }).catch(() => {});
      await page.locator('h1, h2').first().waitFor().catch(() => {});
      title = (await page.locator('h1, h2').first().textContent().catch(() => '') || '').trim();
    } else if (title === 'Система защищена') {
      await page.locator('input[type="password"]').first().fill('masterpass123');
      await page.getByRole('button', { name: 'Разблокировать систему' }).click();
      await page.waitForURL((url) => !url.href.includes('locked'), { timeout: 15000 }).catch(() => {});
      await page.locator('h1, h2').first().waitFor().catch(() => {});
      title = (await page.locator('h1, h2').first().textContent().catch(() => '') || '').trim();
    }
    
    if (title === 'Первый запуск') {
      await page.locator('input[type="text"]').fill('admin');
      await page.locator('input[type="password"]').first().fill('password123');
      await page.locator('input[type="password"]').nth(1).fill('password123');
      await page.getByRole('button', { name: 'Завершить настройку' }).click();
      await page.waitForTimeout(1000);
      await page.locator('h1, h2').first().waitFor().catch(() => {});
      title = (await page.locator('h1, h2').first().textContent().catch(() => '') || '').trim();
    }

    if (title === 'Вход в МИС') {
      await page.getByPlaceholder('Имя пользователя').fill('admin');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('button', { name: 'Войти' }).click();
      await page.waitForURL('**/').catch(() => {});
    }
  });

  test('should navigate to all patients list', async ({ page }) => {
    await page.goto('/');
    
    // Click on "Все пациенты" in navigation
    const patientsLink = page.getByRole('link', { name: 'Все пациенты' });
    await patientsLink.click();

    // Verify we are on persons page
    await expect(page).toHaveURL(/.*\/persons/);
  });
});
