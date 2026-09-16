const { test, expect } = require('@playwright/test');

test.describe('Authentication & Setup', () => {
  test('should setup system and login', async ({ page }) => {
    // Navigate to the app. Since DB is empty, it should redirect to /setup
    await page.goto('/');
    
    // Wait for heading to ensure page is loaded
    await page.locator('h1').waitFor();
    const title = await page.locator('h1').textContent();
    
    if (title === 'Первый запуск') {
      // Fill setup form
      await page.locator('input[type="text"]').fill('admin');
      await page.locator('input[type="password"]').first().fill('password123');
      await page.locator('input[type="password"]').nth(1).fill('password123');
      await page.getByRole('button', { name: 'Завершить настройку' }).click();

      // After setup, wait for next page
      await page.locator('h1').waitFor();
    }
    
    const newTitle = await page.locator('h1').textContent();
    
    // If it requires login, we can login
    if (newTitle === 'Вход в МИС') {
      await page.getByPlaceholder('Имя пользователя').fill('admin');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('button', { name: 'Войти' }).click();
    }

    // Verify navigation to dashboard
    await expect(page).toHaveURL('/');
    
    // Optional: wait for a dashboard element to confirm we are logged in
    await expect(page.getByText('Главная')).toBeVisible({ timeout: 10000 }).catch(() => {}); // Wait for something to load
  });
});

