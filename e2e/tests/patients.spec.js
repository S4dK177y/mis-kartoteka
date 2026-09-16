const { test, expect } = require('@playwright/test');

test.describe('Patients Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test. Assuming setup is already done by auth.spec.js or we do it if needed.
    // In Playwright it's better to use auth state, but for simplicity we login manually.
    await page.goto('/login');
    
    // Try to login. If it goes to setup, we handle it.
    if (page.url().includes('setup')) {
      await page.getByRole('textbox').fill('admin');
      await page.locator('input[type="password"]').first().fill('password123');
      await page.locator('input[type="password"]').nth(1).fill('password123');
      await page.getByRole('button', { name: 'Завершить настройку' }).click();
      await page.waitForURL('**/');
    }

    if (page.url().includes('login')) {
      await page.getByPlaceholder('Имя пользователя').fill('admin');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('button', { name: 'Войти' }).click();
      await page.waitForURL('/');
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
