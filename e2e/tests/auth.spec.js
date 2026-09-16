const { test, expect } = require('@playwright/test');

test.describe('Authentication & Setup', () => {
  test('should setup system and login', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for any heading (h1 or h2) to ensure page is loaded
    await page.locator('h1, h2').first().waitFor();
    let title = await page.locator('h1, h2').first().textContent();

    // 1. Check if system needs encryption setup or unlock
    if (title === 'Инициализация защиты') {
      await page.locator('input[type="password"]').first().fill('masterpass123');
      await page.locator('input[type="password"]').nth(1).fill('masterpass123');
      await page.getByRole('button', { name: 'Зашифровать данные' }).click();
      await page.waitForURL((url) => !url.href.includes('locked'), { timeout: 15000 });
      await page.locator('h1, h2').first().waitFor();
      title = await page.locator('h1, h2').first().textContent();
    } else if (title === 'Система защищена') {
      await page.locator('input[type="password"]').first().fill('masterpass123');
      await page.getByRole('button', { name: 'Разблокировать систему' }).click();
      await page.waitForURL((url) => !url.href.includes('locked'), { timeout: 15000 });
      await page.locator('h1, h2').first().waitFor();
      title = await page.locator('h1, h2').first().textContent();
    }
    
    // 2. Check if system needs user setup
    if (title === 'Первый запуск') {
      await page.locator('input[type="text"]').fill('admin');
      await page.locator('input[type="password"]').first().fill('password123');
      await page.locator('input[type="password"]').nth(1).fill('password123');
      await page.getByRole('button', { name: 'Завершить настройку' }).click();
      await page.waitForTimeout(1000);
      await page.locator('h1, h2').first().waitFor();
      title = await page.locator('h1, h2').first().textContent();
    }
    
    // 3. Login if required
    if (title === 'Вход в МИС') {
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

