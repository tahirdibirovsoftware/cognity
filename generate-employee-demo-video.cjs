const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function createEmployeeDemoVideo() {
  const outputDir = path.join(__dirname, 'demo-employee-artifacts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('Launching browser for Employee Demo...');
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

    cursor.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div id="demo-ripple" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.5);
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
      await page.mouse.move(targetX, targetY, { steps: 16 });
    }
  }

  async function humanClick(selector, waitAfter = 500) {
    await humanMove(selector);
    await page.waitForTimeout(150);
    await page.click(selector);
    await page.waitForTimeout(waitAfter);
  }

  async function humanType(selector, text, delay = 25) {
    await humanMove(selector);
    await page.click(selector);
    await page.fill(selector, '');
    for (const char of text) {
      await page.type(selector, char, { delay: Math.floor(Math.random() * 15) + delay });
    }
    await page.waitForTimeout(250);
  }

  console.log('Scene 1: Employee Authentication...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Type employee email and initial password
  await humanType('#email', 'david.chen@cognity.demo', 22);
  await humanType('#password', 'welcome123', 22);

  // Toggle password visibility using the new eye toggle
  await humanClick('button[title*="password"]', 800);
  await page.waitForTimeout(600);
  await humanClick('button[title*="password"]', 600);

  // Submit sign in
  await humanClick('button[type="submit"]:has-text("Sign in")', 1500);

  console.log('Scene 2: Landing on Employee Training Dashboard...');
  await page.waitForURL('**/employee**');
  await page.waitForTimeout(1800);

  // Smooth scroll to inspect pending assignments
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(1200);
  await page.mouse.wheel(0, -250);
  await page.waitForTimeout(800);

  console.log('Scene 3: Starting Compliance Assessment...');
  // Click "Start assessment" for the newly created Data Protection assessment
  await humanClick('a[href*="/employee/take/53443172-8f9a-4d60-ad9a-fcb98094790d"]', 1500);
  await page.waitForURL('**/employee/take/**');
  await page.waitForTimeout(1500);

  // Review introduction banner
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(800);

  console.log('Answering Question 1 (Multiple Choice)...');
  await humanClick('label:has-text("Customer personal data, payment details, and authentication secrets")', 800);

  console.log('Answering Question 2 (Multiple Choice)...');
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(600);
  await humanClick('label:has-text("Quarterly")', 800);

  console.log('Answering Question 3 (Multiple Choice)...');
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(600);
  await humanClick('label:has-text("Within 1 hour")', 800);

  console.log('Answering Question 4 (True/False)...');
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(600);
  await humanClick('label:has-text("False")', 800);

  console.log('Answering Question 5 (Written Short Answer)...');
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(600);
  const textareas = await page.$$('textarea');
  if (textareas.length >= 1) {
    await textareas[0].scrollIntoViewIfNeeded();
    await textareas[0].click();
    await textareas[0].type(
      'Employees must report suspicious emails immediately to security@acme.example using the Report Phishing button. They should not click any links or open any attachments.',
      { delay: 12 }
    );
    await page.waitForTimeout(600);
  }

  console.log('Answering Question 6 (Written Short Answer)...');
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(600);
  if (textareas.length >= 2) {
    await textareas[1].scrollIntoViewIfNeeded();
    await textareas[1].click();
    await textareas[1].type(
      'Company laptops must have full-disk encryption enabled and connect via the approved VPN on public or untrusted Wi-Fi. Screens must be locked whenever stepping away from the workstation.',
      { delay: 12 }
    );
    await page.waitForTimeout(800);
  }

  console.log('Submitting completed assessment for AI grading...');
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(800);

  // Click Submit for grading
  await humanClick('button[type="submit"]:has-text("Submit for grading")', 1500);

  console.log('Scene 4: AI Grading in Progress...');
  // Wait for redirect to /results/[attemptId]
  await page.waitForURL('**/results/**', { timeout: 90000 });
  console.log('Grading completed! Reviewing results and feedback...');
  await page.waitForTimeout(2000);

  // Scroll through result card and detailed question breakdowns
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1400);
  await page.mouse.wheel(0, -1200);
  await page.waitForTimeout(1200);

  console.log('Scene 5: Returning to Employee Dashboard...');
  await humanClick('a:has-text("Back to my training")', 1500);
  await page.waitForURL('**/employee');
  await page.waitForTimeout(2000);

  // Showcase updated stat cards (Completed: 1, Average score) and Passed status badge
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, -250);
  await page.waitForTimeout(2500);

  console.log('Finishing recording...');
  await context.close();
  await browser.close();

  // Find recorded webm file
  const videoFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No video file was created');
  }

  const rawVideoPath = path.join(outputDir, videoFiles[0]);
  const mp4Path = path.join(outputDir, 'cognity-employee-demo.mp4');
  const projectPublicMp4 = path.join(__dirname, 'public', 'cognity-employee-demo.mp4');
  const rootMp4 = path.join(__dirname, 'cognity-employee-demo.mp4');
  const artifactDir = '/home/tahirdibirov/.gemini/antigravity-cli/brain/fa663af3-af51-489d-b6fe-7a5fb470cd9c';
  const artifactMp4 = path.join(artifactDir, 'cognity-employee-demo.mp4');

  console.log('Converting raw video to high-quality MP4 via FFmpeg...');
  execSync(`ffmpeg -y -i "${rawVideoPath}" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`);

  fs.copyFileSync(mp4Path, projectPublicMp4);
  fs.copyFileSync(mp4Path, rootMp4);
  fs.copyFileSync(mp4Path, artifactMp4);

  console.log('Employee demo video created successfully!');
  console.log('MP4 output locations:');
  console.log(' - ' + mp4Path);
  console.log(' - ' + projectPublicMp4);
  console.log(' - ' + rootMp4);
  console.log(' - ' + artifactMp4);
}

createEmployeeDemoVideo().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
