const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const assetsDir = path.join(__dirname, 'deck-assets');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Logging in as David Chen...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'david.chen@cognity.demo');
  await page.fill('#password', 'welcome123');
  await page.click('button[type="submit"]:has-text("Sign in")');
  await page.waitForURL('**/employee**');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(assetsDir, '06-employee-portal.png') });

  console.log('Capturing Results Review...');
  const feedbackLink = await page.$('a:has-text("View feedback")');
  if (feedbackLink) {
    await feedbackLink.click();
    await page.waitForURL('**/results/**');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetsDir, '07-result-review.png') });
  }

  console.log('Capturing Pending Assessment...');
  await page.goto('http://localhost:3000/employee', { waitUntil: 'networkidle' });
  const startBtn = await page.$('a:has-text("Start assessment")');
  if (startBtn) {
    await startBtn.click();
    await page.waitForURL('**/employee/take/**');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetsDir, '08-take-assessment.png') });
  }

  await browser.close();
  console.log('Done!');
}
run().catch(console.error);
