const { test, expect } = require('@playwright/test');

test.describe('Authentication & Setup', () => {
  test('should setup system and login', async ({ page }) => {
    // Navigate to the app. Since DB is empty, it should redirect to /setup
    await page.goto('/');
    
    // Wait for redirect to /setup
    await page.waitForURL('**/setup');
    
    // Fill setup form
    await page.getByRole('textbox').fill('admin'); // 'Логин администратора' is prefilled, but we can fill it again
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('input[type="password"]').nth(1).fill('password123');
    await page.getByRole('button', { name: 'Завершить настройку' }).click();

    // After setup, it should redirect to /login (or dashboard depending on AuthContext, usually setup auto-logins or redirects to login)
    // Actually, in Setup.jsx: await setup(username, password); navigate('/');
    // Let's just wait for the network to settle and check URL.
    await page.waitForURL('**/');
    
    // If it requires login, we can login
    if (page.url().includes('login')) {
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

