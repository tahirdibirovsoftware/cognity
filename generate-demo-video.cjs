const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function createDemoVideo() {
  const outputDir = path.join(__dirname, 'demo-artifacts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('Launching browser with video recording...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // Inject industrial-grade visible cursor with click ripples
  await page.addInitScript(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = `
      width: 24px;
      height: 24px;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999999;
      pointer-events: none;
      transform: translate(-100px, -100px);
      transition: transform 0.04s linear;
    `;

    // SVG cursor icon
    cursor.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div id="demo-ripple" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.5);
        opacity: 0;
        transform: scale(0.5);
        transition: transform 0.25s ease-out, opacity 0.25s ease-out;
      "></div>
    `;

    document.documentElement.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    window.addEventListener('mousedown', (e) => {
      const ripple = document.getElementById('demo-ripple');
      if (ripple) {
        ripple.style.opacity = '1';
        ripple.style.transform = 'scale(2.2)';
      }
    });

    window.addEventListener('mouseup', () => {
      const ripple = document.getElementById('demo-ripple');
      if (ripple) {
        ripple.style.opacity = '0';
        ripple.style.transform = 'scale(0.5)';
      }
    });
  });

  async function humanMove(selector) {
    const el = await page.waitForSelector(selector, { state: 'visible' });
    const box = await el.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await page.mouse.move(targetX, targetY, { steps: 18 });
    }
  }

  async function humanClick(selector, waitAfter = 500) {
    await humanMove(selector);
    await page.waitForTimeout(150);
    await page.click(selector);
    await page.waitForTimeout(waitAfter);
  }

  async function humanType(selector, text, delay = 35) {
    await humanMove(selector);
    await page.click(selector);
    await page.fill(selector, '');
    for (const char of text) {
      await page.type(selector, char, { delay: Math.floor(Math.random() * 20) + delay });
    }
    await page.waitForTimeout(300);
  }

  console.log('Scene 1: Manager Authentication...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Type manager email and password
  await humanType('#email', 'manager@cognity.demo', 25);
  await humanType('#password', 'demo1234', 25);
  await humanClick('button[type="submit"]:has-text("Sign in")', 1200);

  console.log('Scene 2: Landing on Manager Dashboard...');
  await page.waitForURL('**/manager**');
  await page.waitForTimeout(1800);

  // Smooth scroll down and up to show overview metrics
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(1000);

  console.log('Scene 3: Creating Assessment from Policy Document...');
  await humanClick('a[href="/manager/documents"]', 1200);
  await page.waitForURL('**/manager/documents');
  await page.waitForTimeout(1000);

  // Enter assessment title
  await humanType('#title', 'Cloud Security & ISO 27001 Compliance 2026', 20);

  // Click "Use sample policy" to fill policy content
  await humanClick('button:has-text("Use sample policy")', 800);
  await page.waitForTimeout(1000);

  // Scroll down document textarea slightly to review
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(800);

  // Click "Generate assessment"
  console.log('Generating assessment with AI...');
  await humanClick('button[value="generate"]:has-text("Generate assessment")', 1500);

  // Wait for redirect to /manager/assessments/[id]
  await page.waitForURL('**/manager/assessments/**', { timeout: 90000 });
  console.log('Assessment generated! Reviewing questions...');
  await page.waitForTimeout(2000);

  // Scroll through generated questions to showcase rubrics and points
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, -950);
  await page.waitForTimeout(1000);

  // Publish the assessment
  console.log('Publishing assessment...');
  await humanClick('button:has-text("Publish assessment")', 1500);
  await page.waitForTimeout(1500);

  console.log('Scene 4: Creating New Employee and Assigning Assessment...');
  await humanClick('a[href="/manager/employees"]', 1200);
  await page.waitForURL('**/manager/employees');
  await page.waitForTimeout(1200);

  // Open "Add employee" dialog
  await humanClick('button:has-text("Add employee")', 800);
  await page.waitForSelector('role=dialog');
  await page.waitForTimeout(600);

  // Fill in employee details
  await humanType('#emp-name', 'David Chen', 30);
  await humanType('#emp-email', 'david.chen@cognity.demo', 25);
  await humanType('#emp-dept', 'Security Operations', 25);

  // Select initial training dropdown if available
  const trainingSelect = await page.$('select[name="initialAssessmentId"]');
  if (trainingSelect) {
    await humanMove('select[name="initialAssessmentId"]');
    // Select the first available published training
    const options = await page.$$eval('select[name="initialAssessmentId"] option', opts => opts.map(o => o.value).filter(v => v !== ''));
    if (options.length > 0) {
      await page.selectOption('select[name="initialAssessmentId"]', options[0]);
      await page.waitForTimeout(600);
    }
  }

  // Click Create account
  console.log('Submitting new employee account...');
  await humanClick('button:has-text("Create account")', 1500);
  await page.waitForTimeout(2000);

  // Click "Copy credentials" button inside success banner
  const copyBtn = await page.$('button:has-text("Copy credentials")');
  if (copyBtn) {
    await humanClick('button:has-text("Copy credentials")', 1000);
  }

  // Close dialog via escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);

  console.log('Scene 5: Additional Assignment & Employee Management...');
  // Click "Assign training" for an existing team member
  const assignTrainingBtns = await page.$$('button:has-text("Assign training")');
  if (assignTrainingBtns.length > 0) {
    await assignTrainingBtns[0].click();
    await page.waitForTimeout(1000);

    const assignSelect = await page.$('select[name="assessmentId"]');
    if (assignSelect) {
      const opts = await page.$$eval('select[name="assessmentId"] option', o => o.map(x => x.value).filter(Boolean));
      if (opts.length > 0) {
        await page.selectOption('select[name="assessmentId"]', opts[0]);
        await page.waitForTimeout(600);
      }
    }
    await humanClick('button:has-text("Confirm assignment")', 1500);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  // Demonstrate Reset Password dialog on employee row
  const resetBtns = await page.$$('button[title*="Reset password"]');
  if (resetBtns.length > 0) {
    console.log('Demonstrating password reset & credential management...');
    await resetBtns[0].click();
    await page.waitForTimeout(1000);
    await humanClick('button:has-text("Update password")', 1500);
    await page.waitForTimeout(1200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  // Smooth scroll through employee directory
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(2000);

  console.log('Finishing recording...');
  await context.close();
  await browser.close();

  // Find the recorded webm file
  const videoFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No video file was created');
  }

  const rawVideoPath = path.join(outputDir, videoFiles[0]);
  const mp4Path = path.join(outputDir, 'cognity-manager-demo.mp4');
  const projectPublicMp4 = path.join(__dirname, 'public', 'cognity-manager-demo.mp4');
  const rootMp4 = path.join(__dirname, 'cognity-manager-demo.mp4');
  const artifactDir = '/home/tahirdibirov/.gemini/antigravity-cli/brain/fa663af3-af51-489d-b6fe-7a5fb470cd9c';
  const artifactMp4 = path.join(artifactDir, 'cognity-manager-demo.mp4');

  console.log('Converting raw video to high-quality MP4 via FFmpeg...');
  execSync(`ffmpeg -y -i "${rawVideoPath}" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`);

  fs.copyFileSync(mp4Path, projectPublicMp4);
  fs.copyFileSync(mp4Path, rootMp4);
  fs.copyFileSync(mp4Path, artifactMp4);

  console.log('Video recording completed successfully!');
  console.log('MP4 output locations:');
  console.log(' - ' + mp4Path);
  console.log(' - ' + projectPublicMp4);
  console.log(' - ' + rootMp4);
  console.log(' - ' + artifactMp4);
}

createDemoVideo().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
