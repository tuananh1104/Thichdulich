import { expect, Page, test } from '@playwright/test';

const accounts = {
  user: { email: 'user@demo.com', password: 'demo123' },
  provider: { email: 'provider@demo.com', password: 'demo123' },
  admin: { email: 'admin@demo.com', password: 'admin123' },
};

async function loginViaUi(page: Page, role: keyof typeof accounts) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(accounts[role].email);
  await page.locator('input[type="password"]').fill(accounts[role].password);
  await page.locator('button[type="submit"]').click();
}

async function clickFirstVisible(page: Page, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const locator = page.getByText(pattern).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      return;
    }

    const button = page.locator('button').filter({ hasText: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return;
    }

    const link = page.locator('a').filter({ hasText: pattern }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      return;
    }
  }

  throw new Error(`No visible element matched: ${patterns.map(item => item.source).join(', ')}`);
}

async function clickAdminNav(page: Page, index: number) {
  await page.locator('nav button').nth(index).click();
}

test.describe('role UI navigation', () => {
  test('user can login, search, open tours and bookings pages', async ({ page }) => {
    await loginViaUi(page, 'user');
    await expect(page).toHaveURL(/\/$/);

    const searchInput = page.locator('form input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Sapa');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toContainText(/Kết quả tìm kiếm|Tour tương tự|Sapa/i);

    await page.goto('/my-bookings');
    await expect(page).toHaveURL(/\/my-bookings/);
    await expect(page.locator('body')).toContainText(/Tour|Đặt|Booking|Chưa|Không/i);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('body')).toContainText(/Hồ sơ|Profile|Email/i);
  });

  test('provider goes directly to dashboard and can open core sections', async ({ page }) => {
    await loginViaUi(page, 'provider');
    await expect(page).toHaveURL(/\/provider/);

    await clickFirstVisible(page, [/Danh sách tour/i, /tour/i]);
    await expect(page.locator('body')).toContainText(/Tour|Tạo|Duyệt|Sửa/i);

    await clickFirstVisible(page, [/Đơn đặt tour/i, /Booking/i]);
    await expect(page.locator('body')).toContainText(/Đơn|Booking|Khách/i);

    await clickFirstVisible(page, [/Phản hồi đánh giá/i, /Đánh giá/i]);
    await expect(page.locator('body')).toContainText(/Phản hồi|Đánh giá|Chưa có/i);

    await clickFirstVisible(page, [/Trao đổi Admin/i, /Trao đổi/i]);
    await expect(page.locator('body')).toContainText(/Admin|Tin nhắn|Trao đổi/i);
  });

  test('admin goes directly to dashboard and can open core sections', async ({ page }) => {
    await loginViaUi(page, 'admin');
    await expect(page).toHaveURL(/\/admin/);

    await clickAdminNav(page, 1);
    await expect(page.locator('body')).toContainText(/Duyệt|Tour|Chờ/i);

    await clickAdminNav(page, 4);
    await expect(page.locator('body')).toContainText(/user@demo\.com|Email|User|Kh/i);

    await clickAdminNav(page, 5);
    await expect(page.locator('body')).toContainText(/provider@demo\.com|Provider|Công/i);

    await clickAdminNav(page, 6);
    await expect(page.locator('body')).toContainText(/Rating|Tour|Ch/i);

    await clickAdminNav(page, 8);
    await expect(page.locator('body')).toContainText(/Tour|report|Không|báo/i);

    await clickAdminNav(page, 7);
    await expect(page.locator('body')).toContainText(/Provider|Admin|message|Tin/i);

    await clickAdminNav(page, 9);
    await expect(page.locator('body')).toContainText(/Email|Contact|Kh/i);
  });
});
