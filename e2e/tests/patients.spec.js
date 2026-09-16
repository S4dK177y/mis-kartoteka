const { test, expect } = require('@playwright/test');

test.describe('Patients Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test. Assuming setup is already done by auth.spec.js or we do it if needed.
    // In Playwright it's better to use auth state, but for simplicity we login manually.
    await page.goto('/');
    
    // Wait for heading to ensure page is loaded
    // Depending on state, it could be setup, login, or dashboard (if session persists)
    await page.locator('h1').waitFor({ timeout: 10000 }).catch(() => {});
    
    const title = await page.locator('h1').textContent().catch(() => '');
    
    if (title === 'Первый запуск') {
      await page.locator('input[type="text"]').fill('admin');
      await page.locator('input[type="password"]').first().fill('password123');
      await page.locator('input[type="password"]').nth(1).fill('password123');
      await page.getByRole('button', { name: 'Завершить настройку' }).click();
      await page.locator('h1').waitFor();
    }

    const newTitle = await page.locator('h1').textContent().catch(() => '');

    if (newTitle === 'Вход в МИС') {
      await page.getByPlaceholder('Имя пользователя').fill('admin');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('button', { name: 'Войти' }).click();
      await page.waitForURL('**/');
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
