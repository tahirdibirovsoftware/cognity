const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function base64Image(filename) {
  const filePath = path.join(__dirname, 'deck-assets', filename);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateDeck() {
  console.log('Loading screenshots as base64...');
  const imgLogin = base64Image('01-login.png');
  const imgManager = base64Image('02-manager-overview.png');
  const imgDocs = base64Image('03-document-generation.png');
  const imgReview = base64Image('04-assessment-review.png');
  const imgEmployees = base64Image('05-employee-directory.png');
  const imgEmployeePortal = base64Image('06-employee-portal.png');
  const imgResult = base64Image('07-result-review.png');
  const imgTake = base64Image('08-take-assessment.png');

  console.log('Constructing pitch deck HTML with shadcn design system...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cognity - Enterprise AI Compliance Pitch Deck</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #09090b;
    color: #f4f4f5;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }

  @page {
    size: 1920px 1080px;
    margin: 0;
  }

  .slide {
    width: 1920px;
    height: 1080px;
    page-break-after: always;
    position: relative;
    padding: 72px 96px;
    background-color: #09090b;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Subtle background grid pattern */
  .slide::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 64px 64px;
    pointer-events: none;
    z-index: 0;
  }

  .slide-content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Header bar */
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 16px;
    box-shadow: 0 0 20px rgba(37, 99, 235, 0.35);
  }

  .brand-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #ffffff;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid #27272a;
    background-color: rgba(24, 24, 27, 0.6);
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .badge-emerald {
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.3);
    background-color: rgba(16, 185, 129, 0.08);
  }

  .badge-blue {
    color: #60a5fa;
    border-color: rgba(37, 99, 235, 0.3);
    background-color: rgba(37, 99, 235, 0.08);
  }

  .slide-title-area {
    margin-bottom: 28px;
  }

  .category-pill {
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #3b82f6;
    margin-bottom: 8px;
    display: block;
  }

  .slide-title {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -0.035em;
    color: #ffffff;
    line-height: 1.15;
  }

  .slide-subtitle {
    font-size: 18px;
    color: #a1a1aa;
    margin-top: 10px;
    line-height: 1.5;
    max-width: 900px;
  }

  /* shadcn-style cards */
  .card {
    background-color: rgba(18, 18, 22, 0.85);
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }

  .card-header {
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #f4f4f5;
  }

  .card-desc {
    font-size: 14px;
    color: #a1a1aa;
    margin-top: 6px;
    line-height: 1.5;
  }

  /* Window mockup container */
  .mockup-window {
    border-radius: 14px;
    border: 1px solid #27272a;
    background-color: #121216;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
  }

  .mockup-header {
    height: 36px;
    background-color: #18181b;
    border-bottom: 1px solid #27272a;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot-red { background-color: #ef4444; opacity: 0.8; }
  .dot-yellow { background-color: #eab308; opacity: 0.8; }
  .dot-green { background-color: #22c55e; opacity: 0.8; }

  .mockup-url {
    margin-left: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #71717a;
    background-color: #09090b;
    padding: 2px 12px;
    border-radius: 6px;
    border: 1px solid #27272a;
  }

  .mockup-body img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }

  /* Layout grids */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    align-items: center;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 28px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  /* Metric callouts */
  .metric-box {
    background-color: rgba(24, 24, 27, 0.5);
    border: 1px solid #27272a;
    border-radius: 14px;
    padding: 24px;
  }

  .metric-value {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #ffffff;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }

  .metric-label {
    font-size: 14px;
    font-weight: 600;
    color: #f4f4f5;
    margin-top: 8px;
  }

  .metric-sub {
    font-size: 12px;
    color: #71717a;
    margin-top: 4px;
    line-height: 1.4;
  }

  /* List items */
  .feature-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 15px;
    color: #d4d4d8;
    line-height: 1.5;
  }

  .feature-bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #3b82f6;
    margin-top: 8px;
    flex-shrink: 0;
  }

  /* Slide footer */
  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(39, 39, 42, 0.6);
    padding-top: 20px;
    margin-top: 24px;
  }

  .footer-meta {
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    color: #71717a;
  }

  .footer-page {
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    color: #a1a1aa;
    font-weight: 600;
  }
</style>
</head>
<body>

<!-- SLIDE 1: COVER -->
<section class="slide" style="justify-content: center; align-items: center; text-align: center;">
  <div class="slide-content" style="justify-content: center; align-items: center; width: 100%;">
    <div style="margin-bottom: 32px;">
      <span class="badge badge-blue">
        Enterprise Compliance Intelligence
      </span>
    </div>

    <div style="display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 24px;">
      <div class="brand-mark" style="width: 56px; height: 56px; font-size: 26px; border-radius: 14px;">C</div>
      <h1 style="font-size: 80px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff;">Cognity</h1>
    </div>

    <p style="font-size: 28px; font-weight: 400; color: #e4e4e7; max-width: 960px; line-height: 1.4; margin-bottom: 40px; letter-spacing: -0.02em;">
      Turn enterprise policies into auditable workforce compliance assessments in minutes.
    </p>

    <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 56px;">
      <div class="badge" style="padding: 10px 20px; font-size: 13px;">
        Grounded in Ground Truth Documents
      </div>
      <div class="badge badge-emerald" style="padding: 10px 20px; font-size: 13px;">
        100% Auditor Defensible
      </div>
      <div class="badge" style="padding: 10px 20px; font-size: 13px;">
        DeepSeek Reasoning Engine
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; width: 100%; max-width: 800px; border-top: 1px solid #27272a; padding-top: 24px;">
      <span class="footer-meta">Product Overview & Pitch Deck</span>
      <span class="footer-meta">SOC 2 · GDPR · ISO 27001 · HIPAA</span>
      <span class="footer-meta">Q4 2026 Edition</span>
    </div>
  </div>
</section>

<!-- SLIDE 2: THE PROBLEM -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge">The Problem</span>
    </div>

    <div class="slide-title-area">
      <span class="category-pill">Market Friction</span>
      <h2 class="slide-title">The Enterprise Compliance Bottleneck</h2>
      <p class="slide-subtitle">
        Every quarter, compliance, HR, and security teams face regulatory mandates to test employees on evolving policies. Today's workflow is broken.
      </p>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="badge" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.08); margin-bottom: 16px;">
          Pain Point 01
        </div>
        <h3 class="card-title">Superficial LMS Checkboxes</h3>
        <p class="card-desc">
          Legacy platforms rely on generic multiple-choice questions that employees guess through without reading the actual company policies. No actual risk mitigation occurs.
        </p>
      </div>

      <div class="card">
        <div class="badge" style="color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); background-color: rgba(245, 158, 11, 0.08); margin-bottom: 16px;">
          Pain Point 02
        </div>
        <h3 class="card-title">Manual Authoring Exhaustion</h3>
        <p class="card-desc">
          Drafting policy quizzes, formulating grading rubrics, and writing rationale takes 20+ hours of legal and HR team time whenever a policy is updated or an audit nears.
        </p>
      </div>

      <div class="card">
        <div class="badge" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.08); margin-bottom: 16px;">
          Pain Point 03
        </div>
        <h3 class="card-title">Zero Audit Defensibility</h3>
        <p class="card-desc">
          External auditors demand evidence that employees actually comprehend data protection controls. Completion timestamps no longer satisfy modern SOC 2 or ISO 27001 auditors.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Problem Definition</span>
      <span class="footer-page">02 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 3: THE SOLUTION -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge badge-emerald">The Solution</span>
    </div>

    <div class="slide-title-area">
      <span class="category-pill">Our Value Proposition</span>
      <h2 class="slide-title">End-to-End AI Compliance Platform</h2>
      <p class="slide-subtitle">
        Cognity automates the full policy-to-mastery lifecycle: from raw PDF documents to tailored question rubrics, employee testing, and auditor-ready audit logs.
      </p>
    </div>

    <div class="grid-4" style="margin-bottom: 24px;">
      <div class="metric-box">
        <div class="metric-value" style="color: #3b82f6;">11.4h</div>
        <div class="metric-label">Time Saved per Cycle</div>
        <div class="metric-sub">Eliminates manual question drafting and grading.</div>
      </div>
      <div class="metric-box">
        <div class="metric-value" style="color: #10b981;">94%</div>
        <div class="metric-label">First-Cycle Mastery</div>
        <div class="metric-sub">Deep comprehension driven by scenario questions.</div>
      </div>
      <div class="metric-box">
        <div class="metric-value" style="color: #a855f7;">50 MB</div>
        <div class="metric-label">Direct Document Ingestion</div>
        <div class="metric-sub">Stores policies in secure S3 object storage.</div>
      </div>
      <div class="metric-box">
        <div class="metric-value" style="color: #f59e0b;">100%</div>
        <div class="metric-label">Auditor Traceability</div>
        <div class="metric-sub">Every grade accompanied by exact policy citations.</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card" style="padding: 24px 28px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Automated Rubric Synthesis</h4>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          Our DeepSeek AI pipeline reads company documents, identifies testable regulatory obligations, and crafts questions with strict scoring criteria.
        </p>
      </div>
      <div class="card" style="padding: 24px 28px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Hybrid Real-Time Grading</h4>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          Multiple choice checks immediately. Free-form written answers are evaluated by AI against the ground-truth rubric in seconds, providing instant guidance.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Solution Architecture</span>
      <span class="footer-page">03 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 4: PRODUCT TOUR - INGESTION & GENERATION -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge">Product Tour · Ingestion</span>
    </div>

    <div class="grid-2" style="align-items: flex-start; height: 100%;">
      <div>
        <div class="slide-title-area">
          <span class="category-pill">Document Management</span>
          <h2 class="slide-title" style="font-size: 38px;">From PDF to Assessment in 30 Seconds</h2>
          <p class="slide-subtitle" style="font-size: 16px;">
            Managers simply upload existing policy manuals or paste raw text. Cognity securely stores the original document and synthesizes a tailored compliance quiz.
          </p>
        </div>

        <ul class="feature-list" style="margin-top: 24px;">
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">50 MB Object Storage:</strong> High-capacity PDF parsing and secure cloud storage with pre-signed retrieval URLs.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Zero Prompt Engineering:</strong> System automatically discovers policy obligations and generates balanced multiple-choice, true/false, and written scenarios.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Ground Truth Integrity:</strong> Strict boundary prompts guarantee questions never hallucinate details outside the source policy document.
            </div>
          </li>
        </ul>
      </div>

      <div class="mockup-window">
        <div class="mockup-header">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="mockup-url">cognity.app/manager/documents</span>
        </div>
        <div class="mockup-body">
          <img src="${imgDocs}" alt="Document Management and Generation Screen">
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Feature Tour 01</span>
      <span class="footer-page">04 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 5: PRODUCT TOUR - QUESTION REVIEW & AUDITABLE RUBRICS -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge badge-blue">Product Tour · Questions</span>
    </div>

    <div class="grid-2" style="align-items: flex-start; height: 100%;">
      <div class="mockup-window">
        <div class="mockup-header">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="mockup-url">cognity.app/manager/assessments</span>
        </div>
        <div class="mockup-body">
          <img src="${imgReview}" alt="Assessment Question and Rubric Review">
        </div>
      </div>

      <div>
        <div class="slide-title-area">
          <span class="category-pill">Auditable Intelligence</span>
          <h2 class="slide-title" style="font-size: 38px;">Granular Rubrics & AI Rationale</h2>
          <p class="slide-subtitle" style="font-size: 16px;">
            Every generated question includes a multi-paragraph model answer, grading rubric, and precise regulatory rationale.
          </p>
        </div>

        <ul class="feature-list" style="margin-top: 24px;">
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Auditor Defensible Rubrics:</strong> For every written question, AI drafts explicit point deduction rules and minimum required elements.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Manager Approval Workflow:</strong> Review, tune passing scores (e.g. 70%), and publish with 1 click to the entire company.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Multi-Format Testing:</strong> Combines fast-retrieval objective questions with deep real-world behavioral scenario evaluations.
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Feature Tour 02</span>
      <span class="footer-page">05 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 6: PRODUCT TOUR - EMPLOYEE MANAGEMENT & ONBOARDING -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge">Product Tour · Team</span>
    </div>

    <div class="grid-2" style="align-items: flex-start; height: 100%;">
      <div>
        <div class="slide-title-area">
          <span class="category-pill">Workforce Governance</span>
          <h2 class="slide-title" style="font-size: 38px;">Frictionless Team Onboarding & Assignment</h2>
          <p class="slide-subtitle" style="font-size: 16px;">
            A centralized directory to manage departments, assign specific training with deadlines, and oversee workforce readiness in real time.
          </p>
        </div>

        <ul class="feature-list" style="margin-top: 24px;">
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">1-Click Provisioning:</strong> Add team members and optionally assign their initial compliance training in a single dialog.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Self-Serve Credential Copy:</strong> Built-in one-click clipboard copying and instant password reset directly from each employee row.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Departmental Filtering:</strong> Sort by Engineering, Operations, Customer Success, or role to monitor completion rates.
            </div>
          </li>
        </ul>
      </div>

      <div class="mockup-window">
        <div class="mockup-header">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="mockup-url">cognity.app/manager/employees</span>
        </div>
        <div class="mockup-body">
          <img src="${imgEmployees}" alt="Employee Management Directory">
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Feature Tour 03</span>
      <span class="footer-page">06 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 7: PRODUCT TOUR - THE EMPLOYEE ASSESSMENT EXPERIENCE -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge badge-emerald">Product Tour · Learner</span>
    </div>

    <div class="grid-2" style="align-items: flex-start; height: 100%;">
      <div class="mockup-window">
        <div class="mockup-header">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="mockup-url">cognity.app/employee/take/534431...</span>
        </div>
        <div class="mockup-body">
          <img src="${imgTake}" alt="Employee Taking Assessment">
        </div>
      </div>

      <div>
        <div class="slide-title-area">
          <span class="category-pill">Employee Experience</span>
          <h2 class="slide-title" style="font-size: 38px;">Focused, Stress-Free Assessment Interface</h2>
          <p class="slide-subtitle" style="font-size: 16px;">
            Employees receive a clean, distraction-free environment that respects their time and encourages active engagement with company policies.
          </p>
        </div>

        <ul class="feature-list" style="margin-top: 24px;">
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Live Completion Tracker:</strong> Sticky progress bar displays answered status in real time to prevent accidental incomplete submissions.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Written Policy Application:</strong> Tests actual judgment in scenario questions rather than rote multiple-choice memorization.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Responsive & Accessible:</strong> Fully optimized for desktop, tablet, and mobile viewports with keyboard navigation.
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Feature Tour 04</span>
      <span class="footer-page">07 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 8: PRODUCT TOUR - REAL-TIME GRADING & AUDIT TRAIL -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge badge-emerald">Product Tour · Results</span>
    </div>

    <div class="grid-2" style="align-items: flex-start; height: 100%;">
      <div>
        <div class="slide-title-area">
          <span class="category-pill">Instant Feedback Loop</span>
          <h2 class="slide-title" style="font-size: 38px;">Real-Time AI Grading & Model Answers</h2>
          <p class="slide-subtitle" style="font-size: 16px;">
            Upon submission, written responses are evaluated in seconds. Employees immediately see where they scored, why, and how to improve.
          </p>
        </div>

        <ul class="feature-list" style="margin-top: 24px;">
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">High-Confidence AI Evaluation:</strong> Every score is anchored against the official rubric with transparent AI feedback and model comparisons.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Instant Pass/Fail Certification:</strong> Employees earn a formal completion timestamp, recorded in compliance databases for audit verification.
            </div>
          </li>
          <li class="feature-item">
            <span class="feature-bullet"></span>
            <div>
              <strong style="color: #ffffff;">Educational Rationale:</strong> Employees understand the "why" behind security controls, drastically decreasing real breach exposure.
            </div>
          </li>
        </ul>
      </div>

      <div class="mockup-window">
        <div class="mockup-header">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
          <span class="mockup-url">cognity.app/results/91-percent-passed</span>
        </div>
        <div class="mockup-body">
          <img src="${imgResult}" alt="Graded Results and AI Feedback">
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Feature Tour 05</span>
      <span class="footer-page">08 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 9: ARCHITECTURE & TECH STACK -->
<section class="slide">
  <div class="slide-content">
    <div class="slide-header">
      <div class="brand-logo">
        <div class="brand-mark">C</div>
        <span class="brand-text">Cognity</span>
      </div>
      <span class="badge">Architecture</span>
    </div>

    <div class="slide-title-area">
      <span class="category-pill">Engineering Foundation</span>
      <h2 class="slide-title">Modern, Enterprise-Ready Tech Stack</h2>
      <p class="slide-subtitle">
        Architected with bleeding-edge web standards for reliability, high-concurrency compliance cycles, and enterprise data privacy.
      </p>
    </div>

    <div class="grid-4" style="margin-bottom: 28px;">
      <div class="card" style="padding: 24px;">
        <span class="badge badge-blue" style="margin-bottom: 12px;">Frontend</span>
        <h4 style="font-size: 17px; font-weight: 700; color: #fff;">Next.js 16 + React 19</h4>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px;">
          Turbopack-powered SSR & Server Actions. Tailwind CSS with shadcn/ui component architecture.
        </p>
      </div>

      <div class="card" style="padding: 24px;">
        <span class="badge badge-emerald" style="margin-bottom: 12px;">Database</span>
        <h4 style="font-size: 17px; font-weight: 700; color: #fff;">Neon Postgres</h4>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px;">
          Serverless PostgreSQL with instant branching, automated pooling, and Drizzle ORM schema validation.
        </p>
      </div>

      <div class="card" style="padding: 24px;">
        <span class="badge badge-blue" style="margin-bottom: 12px;">Storage</span>
        <h4 style="font-size: 17px; font-weight: 700; color: #fff;">Neon S3 Object Storage</h4>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px;">
          Branchable S3-compatible document storage supporting enterprise policy uploads up to 50 MB.
        </p>
      </div>

      <div class="card" style="padding: 24px;">
        <span class="badge" style="margin-bottom: 12px;">AI Engine</span>
        <h4 style="font-size: 17px; font-weight: 700; color: #fff;">DeepSeek Reasoner</h4>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px;">
          Advanced legal & policy reasoning engine for schema-constrained generation and rubric grading.
        </p>
      </div>
    </div>

    <div class="card" style="padding: 24px 32px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 16px; font-weight: 700; color: #fff;">Enterprise Security by Design</h4>
          <p style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">
            HS256 JWT sessions in HTTP-only cookies · Zero third-party ad telemetry · bcrypt password hashing with resilient normalizers.
          </p>
        </div>
        <span class="badge badge-emerald" style="font-size: 12px;">SOC 2 Ready</span>
      </div>
    </div>

    <div class="slide-footer">
      <span class="footer-meta">Cognity · Technical Specifications</span>
      <span class="footer-page">09 / 10</span>
    </div>
  </div>
</section>

<!-- SLIDE 10: TRACTION & CALL TO ACTION -->
<section class="slide" style="justify-content: center; align-items: center; text-align: center;">
  <div class="slide-content" style="justify-content: center; align-items: center; width: 100%;">
    <div style="margin-bottom: 28px;">
      <span class="badge badge-emerald">Ready for Deployment</span>
    </div>

    <h2 style="font-size: 64px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff; margin-bottom: 20px;">
      Reinvent Compliance with Cognity
    </h2>

    <p style="font-size: 22px; color: #a1a1aa; max-width: 840px; line-height: 1.5; margin-bottom: 48px;">
      Ditch manual question drafting and unread policy manuals. Empower your workforce with grounded compliance assessments.
    </p>

    <div class="card" style="display: flex; gap: 48px; padding: 32px 56px; margin-bottom: 48px; background-color: rgba(24, 24, 27, 0.7); border-color: #3b82f6;">
      <div>
        <div style="font-size: 36px; font-weight: 800; color: #ffffff;">Live & Deployed</div>
        <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">cognity-five.vercel.app</div>
      </div>
      <div style="width: 1px; background-color: #27272a;"></div>
      <div>
        <div style="font-size: 36px; font-weight: 800; color: #10b981;">Zero Setup</div>
        <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">Instant Demo Accounts</div>
      </div>
      <div style="width: 1px; background-color: #27272a;"></div>
      <div>
        <div style="font-size: 36px; font-weight: 800; color: #3b82f6;">100% Tested</div>
        <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">Automated Test Suite</div>
      </div>
    </div>

    <div style="display: flex; gap: 16px; align-items: center;">
      <span class="badge" style="font-size: 14px; padding: 10px 24px;">
        Demo: manager@cognity.demo / demo1234
      </span>
      <span class="badge badge-blue" style="font-size: 14px; padding: 10px 24px;">
        Demo Video: cognity-five.vercel.app/cognity-full-demo.mp4
      </span>
    </div>

    <div class="slide-footer" style="width: 100%; margin-top: 56px;">
      <span class="footer-meta">Cognity · All Rights Reserved 2026</span>
      <span class="footer-page">10 / 10</span>
    </div>
  </div>
</section>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'deck-preview.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('HTML presentation written to:', htmlPath);

  console.log('Rendering PDF with Chromium via Playwright...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const pdfPublicPath = path.join(__dirname, 'public', 'Cognity-Pitch-Deck.pdf');
  const pdfRootPath = path.join(__dirname, 'Cognity-Pitch-Deck.pdf');
  const artifactDir = '/home/tahirdibirov/.gemini/antigravity-cli/brain/fa663af3-af51-489d-b6fe-7a5fb470cd9c';
  const pdfArtifactPath = path.join(artifactDir, 'Cognity-Pitch-Deck.pdf');

  await page.pdf({
    path: pdfPublicPath,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    preferCSSPageSize: true
  });

  fs.copyFileSync(pdfPublicPath, pdfRootPath);
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(pdfPublicPath, pdfArtifactPath);
  }

  await browser.close();

  console.log('Pitch deck PDF created successfully!');
  console.log('Outputs:');
  console.log(' - ' + pdfPublicPath);
  console.log(' - ' + pdfRootPath);
  console.log(' - ' + pdfArtifactPath);
}

generateDeck().catch((err) => {
  console.error('Deck generation error:', err);
  process.exit(1);
});
