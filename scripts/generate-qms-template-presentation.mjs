import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "QMS Team";
pptx.company = "QMS";
pptx.subject = "Final Project Presentation";
pptx.title = "QMS Final Project Presentation";
pptx.lang = "en-US";

const FONT_TITLE = "Trebuchet MS";
const FONT_BODY = "Verdana";

const C = {
  navy: "0B1220",
  teal: "22D3EE",
  sky: "D6F4FF",
  amber: "F97316",
  white: "FFFFFF",
  text: "DDE7F3",
  muted: "94A3B8",
  border: "334155",
  bg: "0F172A",
  mint: "0B5C73",
  rose: "2A1C2C",
  panel: "111D34",
};

function atmosphere(slide) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -1.2,
    y: -1.0,
    w: 4.2,
    h: 4.2,
    fill: { color: "123250", transparency: 35 },
    line: { color: "123250", transparency: 100 },
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 10.8,
    y: 4.7,
    w: 3.8,
    h: 3.8,
    fill: { color: "1E3A5F", transparency: 30 },
    line: { color: "1E3A5F", transparency: 100 },
  });
}

function frame(slide, section, slideNo) {
  slide.background = { color: C.bg };
  atmosphere(slide);

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.35,
    fill: { color: "0A1222" },
    line: { color: "0A1222" },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.35,
    w: 13.333,
    h: 0.03,
    fill: { color: C.teal },
    line: { color: C.teal },
  });

  slide.addText(section, {
    x: 0.28,
    y: 0.06,
    w: 8.2,
    h: 0.2,
    bold: true,
    color: C.white,
    fontFace: FONT_BODY,
    fontSize: 10,
    charSpace: 1,
  });

  slide.addText("QMS - Hospital Queue + Hospitality Platform", {
    x: 0.28,
    y: 7.1,
    w: 8.0,
    h: 0.25,
    color: C.muted,
    fontFace: FONT_BODY,
    fontSize: 9,
  });

  slide.addText(String(slideNo), {
    x: 12.55,
    y: 7.1,
    w: 0.5,
    h: 0.25,
    align: "right",
    bold: true,
    color: C.teal,
    fontFace: FONT_BODY,
    fontSize: 12,
  });
}

function heading(slide, title, subtitle = "") {
  slide.addText(title, {
    x: 0.55,
    y: 0.72,
    w: 12.2,
    h: 0.5,
    bold: true,
    color: C.white,
    fontFace: FONT_TITLE,
    fontSize: 31,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55,
      y: 1.26,
      w: 12.0,
      h: 0.3,
      italic: true,
      color: C.teal,
      fontFace: FONT_BODY,
      fontSize: 14,
    });
  }
}

function card(slide, x, y, w, h, title, points, accent = C.teal) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    radius: 0.08,
    fill: { color: C.panel },
    line: { color: C.border, pt: 1.2 },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.18,
    fill: { color: accent },
    line: { color: accent },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.12,
    y: y + 0.3,
    w: 0.06,
    h: 0.26,
    fill: { color: accent },
    line: { color: accent },
  });

  slide.addText(title, {
    x: x + 0.23,
    y: y + 0.28,
    w: w - 0.38,
    h: 0.28,
    bold: true,
    color: C.white,
    fontFace: FONT_TITLE,
    fontSize: 14,
  });

  slide.addText(points.map((p) => `• ${p}`).join("\n"), {
    x: x + 0.16,
    y: y + 0.64,
    w: w - 0.32,
    h: h - 0.78,
    color: C.text,
    fontFace: FONT_BODY,
    fontSize: 11,
    valign: "top",
  });
}

// 1) Title
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  atmosphere(s);

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.1,
    fill: { color: C.teal },
    line: { color: C.teal },
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.1,
    w: 13.333,
    h: 0.06,
    fill: { color: C.amber },
    line: { color: C.amber },
  });

  s.addText("Queue Management System", {
    x: 0.9,
    y: 1.0,
    w: 11.8,
    h: 0.8,
    bold: true,
    color: C.white,
    fontFace: FONT_TITLE,
    fontSize: 48,
    align: "center",
  });

  s.addText("Final Project Presentation", {
    x: 0.9,
    y: 1.95,
    w: 11.8,
    h: 0.4,
    bold: true,
    color: C.teal,
    fontFace: FONT_BODY,
    fontSize: 24,
    align: "center",
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 3.0,
    w: 10.9,
    h: 3.2,
    radius: 0.1,
    fill: { color: C.panel },
    line: { color: C.border, pt: 1 },
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.45,
    y: 3.35,
    w: 0.08,
    h: 2.45,
    radius: 0.03,
    fill: { color: C.amber },
    line: { color: C.amber },
  });

  s.addText(
    "Team Members\n• Mahimn Trivedi (1AUA23BCS096)\n• Bhavya Mehta (1AUA23BCS021)\n• Meet Mehta (1AUA23BCS108)\n• Om Manuwal (1AUA23BCS133)\n• Parth Madlani (1AUA23BCS139)",
    {
      x: 1.6,
      y: 3.45,
      w: 6.6,
      h: 2.3,
      color: C.white,
      fontFace: FONT_BODY,
      fontSize: 13,
    },
  );

  s.addText("Guide\nProf. Himani Prajapati", {
    x: 8.5,
    y: 3.6,
    w: 2.9,
    h: 1.0,
    color: C.teal,
    fontFace: FONT_TITLE,
    fontSize: 13,
    align: "center",
    bold: true,
  });

  s.addText("Institute: AUA\nDate: 22 April 2026", {
    x: 8.5,
    y: 4.85,
    w: 2.9,
    h: 0.85,
    color: C.sky,
    fontFace: FONT_BODY,
    fontSize: 11,
    align: "center",
  });
}

// 2) Team
{
  const s = pptx.addSlide();
  frame(s, "2. Team", 2);
  heading(
    s,
    "Team, Roles, Strengths & Vision",
    "Aligned ownership for faster delivery",
  );

  card(
    s,
    0.5,
    1.9,
    4.0,
    4.9,
    "Roles",
    [
      "Frontend & UX: responsive dashboards and flows",
      "Backend & DB: Supabase schema and API",
      "Security: middleware, role checks, RLS",
      "QA & Docs: testing matrix and deployment notes",
    ],
    C.amber,
  );

  card(
    s,
    4.75,
    1.9,
    4.0,
    4.9,
    "Strengths / Weaknesses",
    [
      "Strengths: modular structure, clear ownership",
      "Strengths: quick iteration with Next.js + TS",
      "Weaknesses: limited real production traffic data",
      "Weaknesses: dependency on accurate seed data",
    ],
    C.teal,
  );

  card(
    s,
    9.0,
    1.9,
    3.3,
    4.9,
    "Vision + Logo",
    [
      "Vision: zero-friction patient journey",
      "Real-time, secure, role-aware operations",
      "Scalable across departments and branches",
      "Q logo emphasizes queue clarity",
    ],
    "2F855A",
  );
}

// 3) Overview
{
  const s = pptx.addSlide();
  frame(s, "3. Overview", 3);
  heading(
    s,
    "Domain, Product, Problem & Solution",
    "Healthcare operations with queue-first intelligence",
  );

  card(
    s,
    0.5,
    1.9,
    6.2,
    4.9,
    "Overview",
    [
      "Domain: hospital operations + hospitality workflows",
      "Product: hybrid platform for patient, doctor, admin, lab, pharma",
      "Problem: manual queues and disconnected handoffs",
      "Solution: unified role-based workflows in one system",
      "Justification: reduces wait time and coordination overhead",
    ],
    C.amber,
  );

  card(
    s,
    7.0,
    1.9,
    5.8,
    4.9,
    "What Makes QMS Useful",
    [
      "Clear role ownership and path-level access",
      "Centralized queue status across departments",
      "Secure discharge and record handling",
      "Reusable UI + validation foundations",
    ],
    C.teal,
  );
}

// 4) Stakeholders & Market
{
  const s = pptx.addSlide();
  frame(s, "4. Stakeholders & Market", 4);
  heading(
    s,
    "Users, Utility & Prospects",
    "Value for hospitals, staff, and patients",
  );

  card(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Primary Stakeholders",
    [
      "Patients and their families",
      "Doctors and nursing staff",
      "Lab and pharmacy operators",
      "Hospital administrators",
    ],
    C.amber,
  );

  card(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Utility",
    [
      "Shorter queues and better predictability",
      "Faster handoffs between clinical units",
      "Reduced manual paperwork dependencies",
      "Improved visibility of operational bottlenecks",
    ],
    C.teal,
  );

  card(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Market Prospects",
    [
      "Multi-department hospitals",
      "Private clinics and chains",
      "Upgrade path to analytics SaaS",
      "Future multi-branch deployments",
    ],
    "2F855A",
  );
}

// 5) Plan & Risks
{
  const s = pptx.addSlide();
  frame(s, "5. Plan & Risks", 5);
  heading(
    s,
    "Roadmap, SDLC & Mitigation",
    "Incremental delivery with security-first controls",
  );

  card(
    s,
    0.5,
    1.9,
    6.2,
    2.35,
    "Roadmap & SDLC",
    [
      "Phase 1: auth, roles, core schema",
      "Phase 2: patient-doctor queue flows",
      "Phase 3: lab/pharma/discharge and reports",
      "Agile iterations with weekly integration checks",
    ],
    C.amber,
  );

  card(
    s,
    0.5,
    4.45,
    6.2,
    2.35,
    "Key Risks",
    [
      "Role misconfiguration impacts access",
      "RLS gaps can risk data exposure",
      "Environment mismatches can break sessions",
    ],
    "C05621",
  );

  card(
    s,
    7.0,
    1.9,
    5.8,
    4.9,
    "Mitigation",
    [
      "Policy validation in staging",
      "Pre-deploy checklist for SQL and envs",
      "Route-role integration testing",
      "Mandatory lint/build gate before release",
    ],
    C.teal,
  );
}

// 6) Requirements & Design
{
  const s = pptx.addSlide();
  frame(s, "6. Requirements & Design", 6);
  heading(
    s,
    "Elicitation, SRS, Use Cases & Workflows",
    "Translating needs into dependable flows",
  );

  card(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Requirements",
    [
      "Interviews with student healthcare flow assumptions",
      "Functional needs per role dashboard",
      "Validation rules defined through Zod schemas",
      "Non-functional: security, scalability, maintainability",
    ],
    C.amber,
  );

  card(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Design Artifacts",
    [
      "Use cases for booking to discharge",
      "SRS-aligned route and module mapping",
      "Workflow steps for cross-role handoffs",
      "API route for discharge completion",
    ],
    C.teal,
  );

  card(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Architecture",
    [
      "Next.js App Router",
      "Supabase Auth + Postgres",
      "Middleware role enforcement",
      "Component-driven UI library",
    ],
    "2F855A",
  );
}

// 7) UI/UX
{
  const s = pptx.addSlide();
  frame(s, "7. UI/UX", 7);
  heading(
    s,
    "Screens, Navigation & Evaluation",
    "Clean task-focused interfaces per user role",
  );

  card(
    s,
    0.5,
    1.9,
    6.2,
    4.9,
    "UI/UX Summary",
    [
      "Dedicated dashboards: patient, doctor, admin, lab, pharma",
      "Consistent sidebar and route-group navigation",
      "Reusable shadcn-based components for speed",
      "Mobile responsive layouts for role screens",
      "Evaluation: fewer clicks for common workflows",
    ],
    C.amber,
  );

  card(
    s,
    7.0,
    1.9,
    5.8,
    4.9,
    "Key Screens to Demo",
    [
      "Patient queue and appointments",
      "Doctor schedule and queue handling",
      "Admin departments, reports, appointments",
      "Lab/Pharma processing pages",
    ],
    C.teal,
  );
}

// 8) Testing
{
  const s = pptx.addSlide();
  frame(s, "8. Testing", 8);
  heading(
    s,
    "Strategy, Test Cases & Acceptance",
    "Quality checks across modules and integrations",
  );

  card(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Testing Strategy",
    [
      "Validation tests for forms and role paths",
      "Integration checks for queue transitions",
      "Auth flow checks for login/register",
      "Regression pass before each demo",
    ],
    C.amber,
  );

  card(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Sample Test Cases",
    [
      "Patient can view own queue only",
      "Doctor can process assigned queue",
      "Admin can access governance routes",
      "Unauthorized route redirects correctly",
    ],
    C.teal,
  );

  card(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Acceptance Criteria",
    [
      "No critical auth failures",
      "Role isolation enforced",
      "Discharge flow completes",
      "Build and lint pass",
    ],
    "2F855A",
  );
}

// 9) Deployment & Tech
{
  const s = pptx.addSlide();
  frame(s, "9. Deployment & Tech", 9);
  heading(
    s,
    "Architecture, Tools & Environment",
    "Production-minded setup and deployment flow",
  );

  card(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Tech Stack",
    [
      "Next.js 16 + React 19 + TypeScript",
      "Tailwind CSS v4 + shadcn/ui",
      "Supabase (Auth, Postgres, Realtime)",
      "React Hook Form + Zod",
    ],
    C.amber,
  );

  card(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Environment",
    [
      "Node.js 20+ and npm 10+",
      "Env vars for Supabase and notifications",
      "SQL setup order documented in README",
      "Security hardening scripts included",
    ],
    C.teal,
  );

  card(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Deployment",
    [
      "Lint + build preflight",
      "Vercel deployment ready",
      "Role middleware active post deploy",
      "Scalable App Router structure",
    ],
    "2F855A",
  );
}

// 10) Results
{
  const s = pptx.addSlide();
  frame(s, "10. Results", 10);
  heading(
    s,
    "Outputs and Demo Summary",
    "Core workflows are working end-to-end",
  );

  card(
    s,
    0.5,
    1.9,
    6.2,
    4.9,
    "Observed Results",
    [
      "Functional role-based dashboards across modules",
      "Queue lifecycle from booking to discharge demonstrated",
      "Stable auth and middleware-protected routes",
      "Modular codebase supporting easy enhancements",
    ],
    C.amber,
  );

  card(
    s,
    7.0,
    1.9,
    5.8,
    4.9,
    "Demo Highlights",
    [
      "Login/register with role-aware routing",
      "Doctor and patient queue interactions",
      "Admin controls and reporting pages",
      "Lab/pharma processing and discharge API",
    ],
    C.teal,
  );
}

// 11) Closure
{
  const s = pptx.addSlide();
  frame(s, "11. Closure", 11);
  heading(s, "Challenges, Future Work and Conclusion", "Q&A");

  card(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Challenges",
    [
      "Complex role mapping across many routes",
      "Maintaining secure data access with RLS",
      "Keeping flows simple while feature-rich",
    ],
    C.amber,
  );

  card(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Future Work",
    [
      "Realtime queue broadcasting",
      "Predictive wait-time analytics",
      "Multi-branch support and tenant model",
      "Expanded notifications (email/SMS)",
    ],
    C.teal,
  );

  card(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Conclusion",
    [
      "QMS improves coordination and patient flow",
      "Secure, scalable and deployment-ready",
      "References: README, schema, hardening SQL",
      "Thank you - Questions?",
    ],
    "2F855A",
  );
}

await pptx.writeFile({ fileName: "QMS_Final_Project_Presentation_2026.pptx" });
console.log("Generated QMS_Final_Project_Presentation_2026.pptx");
