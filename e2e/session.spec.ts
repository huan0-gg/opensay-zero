import { expect, test, type Page } from '@playwright/test';

async function say(page: Page, text: string) {
  const input = page.getByLabel('也可以打字');
  await expect(input).toBeEnabled({ timeout: 10_000 });
  await input.fill(text);
  await page.getByRole('button', { name: '发送' }).click();
}

async function runCoffeeDayOne(page: Page) {
  await say(page, 'how much is this');
  await expect(page.getByText(/It's four fifty for a medium/)).toBeVisible({ timeout: 10_000 });

  await say(page, "i'll take this one");
  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'size');

  await say(page, 'medium');
  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'here-or-go');

  await say(page, 'to go');
  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'pay');

  await say(page, 'card please');
  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'close');

  await say(page, 'thank you');
  await expect(page.getByText(/今天说对了 4 句/)).toBeVisible({ timeout: 10_000 });
}

async function openCoffeeDayOne(page: Page) {
  await page.goto('/?e2e=1');
  await page.getByRole('link', { name: /开始/ }).click();
  await page.getByRole('button', { name: /跳过/ }).click();
  await expect(page.getByRole('heading', { name: '今天，先开口' })).toBeVisible();
  await page.getByRole('link', { name: /开始今天的 10 分钟/ }).click();
  await expect(page.getByText('第 1 天')).toBeVisible();
}

test('a beginner finishes coffee day one and keeps progress after reload', async ({ page }) => {
  await openCoffeeDayOne(page);
  await runCoffeeDayOne(page);

  await page.getByRole('button', { name: /完成，回到今天/ }).click();
  await expect(page.getByText('今天已完成')).toBeVisible();

  await page.reload();
  await expect(page.getByText('今天已完成')).toBeVisible();
});

test('dialogue offers fallback sentences after a pause', async ({ page }) => {
  await openCoffeeDayOne(page);
  await expect(page.getByRole('button', { name: /How much is this/ })).toBeVisible({
    timeout: 10_000,
  });
});

test('an extra practice run does not skip the next scheduled day', async ({ page }) => {
  await openCoffeeDayOne(page);
  await runCoffeeDayOne(page);
  await page.getByRole('button', { name: /完成，回到今天/ }).click();

  await page.getByRole('link', { name: /再练一次今天的场景/ }).click();
  await runCoffeeDayOne(page);
  await page.getByRole('button', { name: /完成，回到今天/ }).click();

  await expect(page.getByText('第 2 / 20 次')).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

test('leaving mid-dialogue resumes at the same node', async ({ page }) => {
  await openCoffeeDayOne(page);
  await say(page, 'how much is this');
  await say(page, "i'll take this one");
  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'size');

  await page.getByRole('button', { name: /先到这里，保存进度/ }).click();
  await page.getByRole('link', { name: /开始今天的 10 分钟/ }).click();

  await expect(page.locator('.dialogue')).toHaveAttribute('data-node-id', 'size');
  await expect(page.getByText(/2 轮/)).toBeVisible();
});

test('day three swaps the price so the line cannot be memorised', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('opensay.e2e', '1');
    localStorage.setItem(
      'opensay.progress.v1',
      JSON.stringify({
        schemaVersion: 1,
        chunks: {},
        scenes: { coffee: { day: 3, completedDays: [1, 2], badge: false } },
        sessions: [],
        streak: { current: 2, longest: 2, freezesUsed: 0 },
        settings: { rate: 0.8, subtitles: 'en-zh', sound: true },
        planIndex: 2,
        active: null,
      }),
    );
  });

  await page.goto('/session/coffee?day=3&kind=scene');
  await expect(page.locator('.dialogue')).toBeVisible();
  await say(page, 'how much is this');
  await expect(
    page.getByText(/four eighty|five twenty|three ninety|five fifty/),
  ).toBeVisible();
});

test('bad local progress explains itself instead of failing silently', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('opensay.e2e', '1');
    localStorage.setItem('opensay.progress.v1', '{not valid json');
  });
  await page.goto('/home');
  await expect(page.getByText(/进度文件读不出来/)).toBeVisible();
  await page.getByRole('button', { name: '知道了' }).click();
  await expect(page.getByText(/进度文件读不出来/)).not.toBeVisible();
});
