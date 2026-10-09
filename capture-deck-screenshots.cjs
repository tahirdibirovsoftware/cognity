const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const assetsDir = path.join(__dirname, 'deck-assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

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

  console.log('1. Capturing Login Page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(assetsDir, '01-login.png') });

  console.log('2. Logging in as Manager...');
  await page.click('button:has-text("Sign in as Manager")');
  await page.waitForURL('**/manager**');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(assetsDir, '02-manager-overview.png') });

  console.log('3. Capturing Documents & Quiz Generation...');
  await page.goto('http://localhost:3000/manager/documents', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('#title', 'SOC 2 & Cloud Security Compliance 2026');
  await page.click('button:has-text("Use sample policy")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(assetsDir, '03-document-generation.png') });

  console.log('4. Capturing Assessment Review...');
  await page.goto('http://localhost:3000/manager/assessments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const firstAssessmentLink = await page.$('tbody tr a');
  if (firstAssessmentLink) {
    await firstAssessmentLink.click();
    await page.waitForURL('**/manager/assessments/**');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetsDir, '04-assessment-review.png') });
  }

  console.log('5. Capturing Employee Management...');
  await page.goto('http://localhost:3000/manager/employees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(assetsDir, '05-employee-directory.png') });

  console.log('6. Logging in as Employee David Chen...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'david.chen@cognity.demo');
  await page.fill('#password', 'welcome123');
  await page.click('button[type="submit"]:has-text("Sign in")');
  await page.waitForURL('**/employee**');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(assetsDir, '06-employee-portal.png') });

  console.log('7. Capturing Result Review...');
  const feedbackLink = await page.$('a:has-text("View feedback")');
  if (feedbackLink) {
    await feedbackLink.click();
    await page.waitForURL('**/results/**');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetsDir, '07-result-review.png') });
  }

  console.log('8. Capturing Take Assessment Page...');
  await page.goto('http://localhost:3000/employee', { waitUntil: 'networkidle' });
  const startBtn = await page.$('a:has-text("Start assessment")');
  if (startBtn) {
    await startBtn.click();
    await page.waitForURL('**/employee/take/**');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(assetsDir, '08-take-assessment.png') });
  }

  console.log('Screenshots captured successfully in deck-assets!');
  await context.close();
  await browser.close();
}

captureScreenshots().catch(console.error);
