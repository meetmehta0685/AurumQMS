import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pptx.author = "QMS Team";
pptx.company = "QMS";
pptx.subject = "Queue Management System Project Presentation";
pptx.title = "QMS Project Presentation";
pptx.lang = "en-US";

const C = {
  bg: "F4F8FB",
  navy: "0B2D4D",
  orange: "0C7DA0",
  teal: "15B79E",
  gray: "5C738A",
  white: "FFFFFF",
  green: "2E8B57",
  panel: "12324D",
  soft: "EAF2F8",
  border: "C9D8E6",
  shadow: "A8BAC9",
  text: "1F3447",
  footer: "A7BBCD",
};

function addFrame(slide, sectionLabel, slideNo) {
  slide.background = { color: C.bg };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.35,
    fill: { color: C.orange },
    line: { color: C.orange },
  });

  slide.addText(sectionLabel.toUpperCase(), {
    x: 0.25,
    y: 0.05,
    w: 8,
    h: 0.2,
    fontFace: "Calibri",
    bold: true,
    color: C.white,
    fontSize: 11,
  });

  slide.addText("QMS - Hospital Queue + Hospitality Platform", {
    x: 0.25,
    y: 7.15,
    w: 10,
    h: 0.2,
    fontFace: "Calibri",
    color: C.gray,
    fontSize: 9,
  });

  slide.addText(String(slideNo).padStart(2, "0"), {
    x: 12.5,
    y: 7.12,
    w: 0.6,
    h: 0.25,
    align: "right",
    fontFace: "Calibri",
    bold: true,
    color: C.orange,
    fontSize: 11,
  });
}

function addTitle(slide, title, subtitle = "") {
  slide.addText(title, {
    x: 0.5,
    y: 0.7,
    w: 12.3,
    h: 0.55,
    fontFace: "Calibri",
    bold: true,
    color: C.navy,
    fontSize: 30,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 1.3,
      w: 12,
      h: 0.3,
      fontFace: "Calibri",
      italic: true,
      color: C.teal,
      fontSize: 14,
    });
  }
}

function addCard(slide, x, y, w, h, heading, points, accent = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    radius: 0.08,
    fill: { color: C.white },
    line: { color: C.border, pt: 1 },
    shadow: { type: "outer", color: C.shadow, blur: 2, angle: 45, distance: 1 },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.25,
    fill: { color: accent },
    line: { color: accent, pt: 1 },
  });

  slide.addText(heading, {
    x: x + 0.15,
    y: y + 0.31,
    w: w - 0.3,
    h: 0.3,
    fontFace: "Calibri",
    bold: true,
    color: C.navy,
    fontSize: 13,
  });

  slide.addText(points.map((p) => `• ${p}`).join("\n"), {
    x: x + 0.15,
    y: y + 0.68,
    w: w - 0.3,
    h: h - 0.85,
    fontFace: "Calibri",
    color: C.text,
    fontSize: 11,
    valign: "top",
  });
}

// Slide 1: Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: C.orange },
    line: { color: C.orange },
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.08,
    w: 0.08,
    h: 7.42,
    fill: { color: C.teal },
    line: { color: C.teal },
  });

  s.addShape(pptx.ShapeType.ellipse, {
    x: 0.65,
    y: 1.0,
    w: 1.2,
    h: 1.2,
    fill: { color: C.orange },
    line: { color: C.orange },
  });

  s.addText("Q", {
    x: 0.65,
    y: 1.03,
    w: 1.2,
    h: 1.05,
    align: "center",
    valign: "mid",
    bold: true,
    fontFace: "Calibri",
    color: "000000",
    fontSize: 44,
  });

  s.addText("Queue Management System", {
    x: 2.1,
    y: 1.1,
    w: 9.8,
    h: 0.8,
    bold: true,
    color: C.white,
    fontSize: 44,
    fontFace: "Calibri",
  });

  s.addText("Project Presentation", {
    x: 2.1,
    y: 2.0,
    w: 6,
    h: 0.4,
    bold: true,
    color: C.orange,
    fontSize: 22,
    fontFace: "Calibri",
  });

  s.addText(
    "Hybrid Next.js Platform for Hospital Queue Workflows + Hospitality Operations",
    {
      x: 2.1,
      y: 2.6,
      w: 10,
      h: 0.8,
      color: C.soft,
      fontSize: 16,
      fontFace: "Calibri",
    },
  );

  s.addShape(pptx.ShapeType.roundRect, {
    x: 2.1,
    y: 3.95,
    w: 8.8,
    h: 2.15,
    radius: 0.1,
    fill: { color: C.panel },
    line: { color: C.teal, pt: 1 },
  });
  s.addText("Team Members", {
    x: 2.35,
    y: 4.18,
    w: 3,
    h: 0.3,
    bold: true,
    color: C.teal,
    fontSize: 15,
  });
  s.addText(
    "• Mahimn Trivedi - 1AUA23BCS096\n• Bhavya Mehta - 1AUA23BCS021\n• Meet Mehta - 1AUA23BCS108\n• Om Manuwal - 1AUA23BCS133\n• Parth Madlani - 1AUA23BCS139",
    {
      x: 2.35,
      y: 4.52,
      w: 8.2,
      h: 1.45,
      color: C.white,
      fontSize: 12,
    },
  );

  s.addShape(pptx.ShapeType.roundRect, {
    x: 11.1,
    y: 3.95,
    w: 2.0,
    h: 2.15,
    radius: 0.1,
    fill: { color: C.orange },
    line: { color: C.orange, pt: 1 },
  });
  s.addText("Faculty", {
    x: 11.25,
    y: 4.22,
    w: 1.7,
    h: 0.25,
    bold: true,
    color: C.white,
    fontSize: 12,
    align: "center",
  });
  s.addText("Prof Himani\nPrajapati", {
    x: 11.25,
    y: 4.68,
    w: 1.7,
    h: 0.9,
    bold: true,
    color: C.white,
    fontSize: 12,
    align: "center",
  });
}

// Slide 2
{
  const s = pptx.addSlide();
  addFrame(s, "Project Overview", 2);
  addTitle(
    s,
    "Problem Statement",
    "Operational delays and fragmented hospital workflows",
  );

  addCard(s, 0.5, 1.9, 6.1, 4.9, "Current Operational Pain Points", [
    "Manual queues create long patient wait times",
    "Role-specific actions are spread across disconnected tools",
    "Doctor, lab, pharma, and discharge handoffs are delayed",
    "Limited real-time visibility for admin monitoring",
  ]);

  addCard(
    s,
    6.9,
    1.9,
    5.9,
    4.9,
    "Business Impact",
    [
      "Reduced patient satisfaction and trust",
      "Higher operational overhead for staff",
      "Missed optimization opportunities in resource planning",
      "Inconsistent discharge and follow-up execution",
    ],
    C.teal,
  );
}

// Slide 3
{
  const s = pptx.addSlide();
  addFrame(s, "Solution", 3);
  addTitle(
    s,
    "QMS Solution Overview",
    "One platform for queueing, clinical tasks, and hospitality operations",
  );

  addCard(s, 0.5, 1.9, 4.1, 4.9, "Hospital Workflows", [
    "Patient appointment and queue tracking",
    "Doctor schedule and consultation views",
    "Lab and pharma order handling",
    "Discharge completion with API-backed route",
  ]);

  addCard(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Hospitality Workflows",
    [
      "Dedicated landing, guest, and staff experiences",
      "Role-aware page access and route grouping",
      "Shared auth and profile infrastructure",
      "Reusable UI components and forms",
    ],
    C.green,
  );

  addCard(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Key Outcomes",
    [
      "Faster handoffs",
      "Clear role ownership",
      "Secure access",
      "Scalable architecture",
    ],
    C.teal,
  );
}

// Slide 4
{
  const s = pptx.addSlide();
  addFrame(s, "Architecture", 4);
  addTitle(
    s,
    "System Architecture & Tech Stack",
    "Modern full-stack web architecture with role-aware access",
  );

  addCard(s, 0.5, 1.9, 4.2, 4.9, "Frontend", [
    "Next.js 16 App Router",
    "React 19 + TypeScript",
    "Tailwind CSS v4 + shadcn/ui",
    "Role-specific dashboard route groups",
  ]);

  addCard(
    s,
    4.95,
    1.9,
    4.2,
    4.9,
    "Backend & Data",
    [
      "Supabase PostgreSQL + Auth + Realtime",
      "RLS-enforced security policies",
      "SQL schema and seed scripts",
      "API route for discharge workflow",
    ],
    C.teal,
  );

  addCard(
    s,
    9.4,
    1.9,
    3.4,
    4.9,
    "Ops",
    [
      "Env-driven setup",
      "Lint + build checks",
      "Vercel-ready deployment",
      "Security hardening scripts",
    ],
    C.green,
  );
}

// Slide 5
{
  const s = pptx.addSlide();
  addFrame(s, "Modules", 5);
  addTitle(
    s,
    "Role-Based Modules",
    "Purpose-built experiences for each user persona",
  );

  const y = 2.0;
  const h = 2.15;

  addCard(
    s,
    0.5,
    y,
    3.1,
    h,
    "Patient",
    ["Appointments", "Queue status", "Lab/Pharma", "Records"],
    C.orange,
  );
  addCard(
    s,
    3.8,
    y,
    3.1,
    h,
    "Doctor",
    ["Schedule", "Queue handling", "Discharge", "Lab/Pharma actions"],
    C.teal,
  );
  addCard(
    s,
    7.1,
    y,
    3.1,
    h,
    "Admin",
    ["Departments", "Doctors", "Reports", "Appointment governance"],
    C.green,
  );
  addCard(
    s,
    10.4,
    y,
    2.4,
    h,
    "Lab/Pharma",
    ["Dedicated queues", "Order processing", "Status updates"],
    C.orange,
  );

  addCard(
    s,
    0.5,
    4.45,
    6.3,
    2.25,
    "Access Control Layer",
    [
      "Path-to-role mapping in middleware",
      "Protected layouts for dashboard access",
      "Restricted self-signup policy",
      "Profile access scoped by RLS rules",
    ],
    C.navy,
  );

  addCard(
    s,
    7.1,
    4.45,
    5.7,
    2.25,
    "Shared UI & Validation",
    [
      "Reusable component library under components/ui",
      "Form handling via React Hook Form + Zod",
      "Typed utilities and centralized validations",
      "Theme provider and responsive dashboard patterns",
    ],
    C.teal,
  );
}

// Slide 6
{
  const s = pptx.addSlide();
  addFrame(s, "Workflow", 6);
  addTitle(
    s,
    "End-to-End Clinical Flow",
    "From booking to discharge with traceable handoffs",
  );

  const steps = [
    "Patient books appointment",
    "Queue token assigned",
    "Doctor consultation",
    "Lab/Pharma actions",
    "Discharge + report",
  ];

  steps.forEach((step, i) => {
    const x = 0.7 + i * 2.5;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.6,
      w: 2.1,
      h: 1.35,
      radius: 0.08,
      fill: { color: C.white },
      line: { color: C.border, pt: 1 },
      shadow: {
        type: "outer",
        color: C.shadow,
        blur: 1,
        angle: 45,
        distance: 1,
      },
    });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.78,
      y: 2.12,
      w: 0.55,
      h: 0.55,
      fill: { color: C.orange },
      line: { color: C.orange },
    });
    s.addText(String(i + 1), {
      x: x + 0.78,
      y: 2.12,
      w: 0.55,
      h: 0.55,
      align: "center",
      valign: "mid",
      bold: true,
      fontSize: 14,
      color: C.white,
    });
    s.addText(step, {
      x: x + 0.15,
      y: 2.9,
      w: 1.8,
      h: 0.8,
      align: "center",
      fontSize: 11,
      color: C.navy,
      bold: true,
    });

    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.chevron, {
        x: x + 2.12,
        y: 3.07,
        w: 0.25,
        h: 0.35,
        fill: { color: C.teal },
        line: { color: C.teal },
      });
    }
  });

  addCard(
    s,
    0.7,
    4.5,
    6.1,
    2.15,
    "Automation Highlights",
    [
      "Status transitions are role-scoped and validated",
      "Discharge API route supports finalization by appointment",
      "Realtime-ready architecture for live queue updates",
    ],
    C.teal,
  );

  addCard(
    s,
    6.95,
    4.5,
    5.65,
    2.15,
    "Operational Benefits",
    [
      "Lower wait times",
      "Reduced manual coordination overhead",
      "Higher traceability across clinical journey",
    ],
    C.green,
  );
}

// Slide 7
{
  const s = pptx.addSlide();
  addFrame(s, "Security", 7);
  addTitle(
    s,
    "Security & Compliance Controls",
    "Defense-in-depth across auth, routing, and data layers",
  );

  addCard(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Authentication",
    [
      "Supabase Auth with controlled role onboarding",
      "Self-signup restricted to patient/guest",
      "Profile-linked actor identity checks",
    ],
    C.orange,
  );

  addCard(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Authorization",
    [
      "Role-path enforcement in middleware",
      "Dashboard layouts wrapped by protected components",
      "Least-privilege route access model",
    ],
    C.teal,
  );

  addCard(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Data Security",
    [
      "RLS policies for profiles and audit logs",
      "Security hardening SQL scripts",
      "Scoped clinical data reads",
    ],
    C.green,
  );
}

// Slide 8
{
  const s = pptx.addSlide();
  addFrame(s, "Data & Deployment", 8);
  addTitle(
    s,
    "Database & Deployment Flow",
    "Predictable setup from local development to production",
  );

  addCard(
    s,
    0.5,
    1.9,
    6.2,
    4.9,
    "Supabase SQL Setup Order",
    [
      "1) schema.sql",
      "2) hospitality.sql",
      "3) optional seed scripts",
      "4) fix-profiles and security hardening scripts",
      "RLS policies activated as part of SQL setup",
    ],
    C.orange,
  );

  addCard(
    s,
    7.0,
    1.9,
    5.8,
    2.35,
    "CI Readiness",
    ["npm run lint", "npm run build", "Both pass before deployment"],
    C.teal,
  );

  addCard(
    s,
    7.0,
    4.45,
    5.8,
    2.35,
    "Deployment",
    [
      "Vercel deployment with env parity",
      "Supabase credentials managed via environment variables",
      "App Router routes available immediately post-deploy",
    ],
    C.green,
  );
}

// Slide 9
{
  const s = pptx.addSlide();
  addFrame(s, "Current Status", 9);
  addTitle(
    s,
    "Implementation Status",
    "Production-oriented foundation is complete",
  );

  addCard(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Completed",
    [
      "Role-based route groups and dashboards",
      "Auth + middleware authorization",
      "Core clinical and hospitality pages",
      "Validation and UI component system",
    ],
    C.green,
  );

  addCard(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Stability",
    [
      "Build and lint passing",
      "Refined auth hook typing",
      "Route interception via proxy.ts",
      "Scoped RLS improvements applied",
    ],
    C.teal,
  );

  addCard(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Readiness",
    [
      "Vercel deployable",
      "Modular structure",
      "Extensible API layer",
      "Security-focused posture",
    ],
    C.orange,
  );
}

// Slide 10
{
  const s = pptx.addSlide();
  addFrame(s, "Roadmap", 10);
  addTitle(
    s,
    "Future Enhancements",
    "Scale, analytics, and user experience improvements",
  );

  addCard(
    s,
    0.5,
    1.9,
    4.1,
    4.9,
    "Clinical Intelligence",
    [
      "Wait-time prediction models",
      "Dynamic queue prioritization",
      "Automated follow-up reminders",
    ],
    C.orange,
  );

  addCard(
    s,
    4.85,
    1.9,
    4.1,
    4.9,
    "Operational Analytics",
    [
      "Advanced KPI dashboards",
      "Department performance heatmaps",
      "Export-ready reports",
    ],
    C.teal,
  );

  addCard(
    s,
    9.2,
    1.9,
    3.6,
    4.9,
    "Platform Expansion",
    [
      "Mobile-first PWA enhancements",
      "Notification channels (email/SMS)",
      "Multi-branch configuration",
    ],
    C.green,
  );
}

// Slide 11
{
  const s = pptx.addSlide();
  addFrame(s, "Risks & Mitigation", 11);
  addTitle(
    s,
    "Delivery Risks and Mitigation",
    "Proactive controls for safe rollout",
  );

  addCard(
    s,
    0.5,
    1.9,
    6.2,
    4.9,
    "Risk Register",
    [
      "Role misconfiguration can block operations",
      "Data access regression may expose sensitive records",
      "Incomplete seed data can degrade demo quality",
      "Environment mismatch can break auth/session behavior",
    ],
    C.orange,
  );

  addCard(
    s,
    7.0,
    1.9,
    5.8,
    4.9,
    "Mitigation Strategy",
    [
      "Policy validation in staging before release",
      "Route-role integration checks per module",
      "Scripted setup order and deployment checklist",
      "Continuous lint/build verification before publish",
    ],
    C.teal,
  );
}

// Slide 12
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: C.orange },
    line: { color: C.orange },
  });

  s.addText("Thank You", {
    x: 0.9,
    y: 1.0,
    w: 11.6,
    h: 0.8,
    fontFace: "Calibri",
    bold: true,
    color: C.white,
    fontSize: 54,
    align: "center",
  });

  s.addText("Queue Management System", {
    x: 0.9,
    y: 1.95,
    w: 11.6,
    h: 0.4,
    fontFace: "Calibri",
    bold: true,
    color: C.orange,
    fontSize: 22,
    align: "center",
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: 2.1,
    y: 3.0,
    w: 9.2,
    h: 2.6,
    radius: 0.1,
    fill: { color: C.panel },
    line: { color: C.teal, pt: 1 },
  });

  s.addText(
    "Built with Next.js, Supabase, and secure role-based workflows\nReady for demo, stakeholder review, and production deployment planning.",
    {
      x: 2.5,
      y: 3.6,
      w: 8.4,
      h: 1,
      align: "center",
      valign: "mid",
      fontFace: "Calibri",
      color: C.soft,
      fontSize: 16,
    },
  );

  s.addText("20 April 2026", {
    x: 0.3,
    y: 7.15,
    w: 4,
    h: 0.2,
    fontFace: "Calibri",
    color: C.footer,
    fontSize: 9,
  });
}

await pptx.writeFile({ fileName: "QMS_Project_Presentation.pptx" });
console.log("Generated QMS_Project_Presentation.pptx");
