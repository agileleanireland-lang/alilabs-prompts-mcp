// The three ALI Labs prompt builders from alilabs.org, as MCP prompts.
// Templates live in data/alilabs-tools.json (copied from the live pages);
// the build functions below follow the same logic as each page's own script.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "alilabs-tools.json"), "utf8"));

const clean = (v) => (v || "").trim();
const ph = (v, placeholder) => clean(v) || `[${placeholder}]`;
const text = (s) => z.string().optional().describe(s);
const choice = (values, s) => z.enum(values).optional().describe(s);

// ---- 1. Career Intelligence (alilabs.org/career-intelligence/) -------------
const C = DATA.career;
const careerGoals = Object.keys(C.GOAL);

function buildCareer(a) {
  const g = C.GOAL[a.goal] ? a.goal : "full";
  let bg;
  if (clean(a.background).toLowerCase() === "cv") bg = "I will upload my CV in this chat.";
  else if (clean(a.background)) bg = clean(a.background);
  else bg = "I will describe it in the chat.";
  const about = [
    "- Current or most recent role: " + ph(a.role, "your current or most recent role"),
    "- Experience: " + ph(a.years, "years of experience"),
    "- What I want help with: " + C.GOAL[g][0],
    "- Location in Ireland: " + ph(a.location, "your preferred location"),
    "- Way of working: " + ph(a.way_of_working, "remote, hybrid or on-site"),
    "- Permanent or contract: " + ph(a.contract, "permanent, contract or either"),
    "- Timeline: " + ph(a.timeline, "how soon you want to move"),
    "- Roles I am curious about: " + ph(a.target_roles, "any roles you are curious about, or “not sure yet”"),
    "- Minimum salary or day rate: " + (clean(a.min_salary) || "Ask me only if it matters"),
    "- My background: " + bg,
  ].join("\n");
  const start = C.GOAL[g][1].replace(
    "{ADVERT}",
    ph(a.job_advert, "paste the job advert, or its title, employer and link")
  );
  return C.BASE.replace("{ABOUT}", about)
    .replace("{START}", start)
    .replace("{PDF}", C.PDF[g] + "\n\n" + C.PDFC);
}

// ---- 2. AI Job Application Helper (alilabs.org/ai-job-application-helper/) --
const J = DATA.job;
const jobModes = Object.keys(J.M);

function buildJob(a) {
  const mo = J.M[a.mode] ? a.mode : "full";
  const fq = clean(a.form_questions);
  const useF = !!fq && (mo === "full" || mo === "form");
  const keys = [];
  J.M[mo].forEach((k) => {
    if (k === "@f") { if (useF) keys.push("fp", "fa"); }
    else keys.push(k);
  });
  const stages = keys.map((k, i) => `${i + 1}. ${J.S[k]}`).join("\n");
  const ti = clean(a.job_title), wy = clean(a.why), wo = clean(a.worry), ne = clean(a.needs);
  return (
    J.HEAD + stages + J.TAIL +
    (ti ? "\n\nTHE ROLE: " + ti : "") +
    "\n\nTHE JOB ADVERT:\n" + ph(a.job_advert, "paste the job advert") +
    "\n\nMY CV:\n" + ph(a.cv, "paste your CV, with your address, phone, email, date of birth and PPS number removed") +
    (useF ? "\n\nAPPLICATION FORM QUESTIONS:\n" + fq : "") +
    (wy ? "\n\nWHY I WANT THIS JOB (my own words; build on this rather than replacing it): " + wy : "") +
    (wo ? "\n\nWHAT I’M WORRIED ABOUT: " + wo : "") +
    (ne ? "\n\nMY PRACTICAL NEEDS: " + ne : "")
  );
}

// ---- 3. AI for Small Business in Ireland (alilabs.org/ai-for-small-business-ireland/)
const B = DATA.smb;
const bizTypes = Object.keys(B.BIZ);
const bizGoals = Object.keys(B.GOAL);

function buildSmb(a) {
  const biz = B.BIZ[a.business_type] ? a.business_type : "other";
  const goal = B.GOAL[a.goal] ? a.goal : "admin";
  const key = `${biz}-${goal}`;
  const d = B.D[key];
  const base = a.version === "quick" && B.QK[key] ? B.QK[key] : d[1];
  let t = base + B.IRL + (B.GUARD[goal] || "") + (B.GK[key] || "");
  const details = clean(a.details);
  if (details) t += "\n\nDetails to fill in the [square brackets] above: " + details;
  return t;
}

const list = (o) => Object.entries(o).map(([k, v]) => `${k} = ${Array.isArray(v) ? v[0] : v}`).join("; ");

export const TOOL_PROMPTS = [
  {
    name: "career-intelligence",
    title: "ALI Labs Career Intelligence",
    description:
      "Career adviser prompt for Scrum Masters, Agile Coaches and Agile professionals looking for work in Ireland: evidence profile, verified Irish job research, fit decisions, application materials and a branded PDF report.",
    args: {
      goal: choice(careerGoals, "What you want help with: " + list(C.GOAL) + ". Default: full."),
      role: text("Current or most recent role, e.g. Scrum Master"),
      years: text("Years of experience"),
      location: text("Preferred location in Ireland"),
      way_of_working: text("Remote, hybrid or on-site"),
      contract: text("Permanent, contract or either"),
      timeline: text("How soon you want to move"),
      target_roles: text("Roles you are curious about, or 'not sure yet'"),
      min_salary: text("Minimum salary or day rate (optional)"),
      background: text("A short summary of your experience, or 'cv' if you will upload your CV in the chat"),
      job_advert: text("For goal 'apply': the job advert, or its title, employer and link"),
    },
    build: buildCareer,
  },
  {
    name: "job-application-helper",
    title: "AI Job Application Helper",
    description:
      "Turns the assistant into an honest career adviser for one job: assesses fit as advocate and tough recruiter, then builds the CV, cover letter or application form answers stage by stage. Remove personal contact details from the CV first.",
    args: {
      job_advert: z.string().describe("The full job advert"),
      cv: z.string().describe("Your CV text, with address, phone, email, date of birth and PPS number removed"),
      mode: choice(jobModes, "full = CV and cover letter; tailor = tailor my CV; review = review my CV; letter = cover letter only; form = application form answers. Default: full."),
      job_title: text("Job title and employer"),
      form_questions: text("Application form questions (for mode 'form' or 'full')"),
      why: text("Why you want this job, in your own words"),
      worry: text("What you're worried about"),
      needs: text("Practical needs, e.g. hybrid, start date"),
    },
    build: buildJob,
  },
  {
    name: "job-application-save-progress",
    title: "Save my job application progress",
    description: "Asks the assistant for a short summary of the job application chat to paste into a new conversation next time.",
    args: {},
    build: () => J.SAVE,
  },
  {
    name: "small-business-ai-helper",
    title: "AI for Small Business in Ireland",
    description:
      "Ready-to-use AI prompts for Irish small businesses, by business type and goal: admin, marketing, customer enquiries, planning, efficiency, your own AI assistant, and grants and funding. Irish context and safety guardrails included.",
    args: {
      business_type: choice(bizTypes, "Your business: " + list(B.BIZ) + ". Default: other."),
      goal: choice(bizGoals, "What you want help with: " + list(B.GOAL) + ". Default: admin."),
      version: choice(["full", "quick"], "full = the detailed prompt (default); quick = a one-line starter prompt"),
      details: text("Optional details for the [square brackets] in the prompt, e.g. your town, shop type, customers"),
    },
    build: buildSmb,
  },
];
