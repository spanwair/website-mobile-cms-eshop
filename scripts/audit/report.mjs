#!/usr/bin/env node
import fs from "fs";
import path from "path";
const auditDir = ".audit";
const out = "_project_specs/todos/fleet-report-" + new Date().toISOString().slice(0,10) + ".md";
if (!fs.existsSync(auditDir)) { console.log("[report] no .audit dir, nothing to aggregate"); process.exit(0); }
const files = fs.readdirSync(auditDir).filter(f => f.startsWith("findings.") && f.endsWith(".json"));
let all = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(auditDir, f), "utf8"));
  const agent = data.agent || "unknown";
  const slice = data.slice || "unknown";
  for (const finding of (data.findings || [])) {
    all.push({ ...finding, agent: finding.agent || agent, slice: finding.slice || slice });
  }
}
const p0 = all.filter(x => x.severity === "P0");
const p1 = all.filter(x => x.severity === "P1");
const p2 = all.filter(x => x.severity === "P2");
let md = `# Fleet Audit Report ${new Date().toISOString().slice(0,10)}\n\n`;
md += `| Severity | Count |\n|----------|-------|\n| P0 | ${p0.length} |\n| P1 | ${p1.length} |\n| P2 | ${p2.length} |\n\n`;
for (const f of all) md += `- [${f.severity}] ${f.slice}/${f.agent}: ${f.title} - ${f.file || ""}\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`[report] wrote ${out} with ${all.length} findings`);
