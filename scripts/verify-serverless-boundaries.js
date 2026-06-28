const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const browserGlobalPattern = /\b(document|window|localStorage|navigator|Notification)\b|\balert\s*\(|\blocation\./;
const serverDirs = ["api", "lib", "services"];
const allowedBrowserFile = path.join(root, "public", "app.js");
const forbiddenRootFiles = ["app.js", "app.cjs", "index.html", "styles.css", "server.js", "render.yaml"];
const requiredFiles = ["public/index.html", "public/app.js", "public/styles.css", "api/report.js", "vercel.json"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
}

const problems = [];

for (const file of forbiddenRootFiles) {
  if (fs.existsSync(path.join(root, file))) {
    problems.push(`Root file must not exist for Vercel 2.0: ${file}`);
  }
}

for (const dir of serverDirs) {
  for (const file of walk(path.join(root, dir))) {
    if (!/\.(js|cjs|mjs)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    if (browserGlobalPattern.test(source)) {
      problems.push(`Browser global found in serverless code: ${path.relative(root, file)}`);
    }
  }
}

if (!fs.existsSync(allowedBrowserFile)) {
  problems.push("Missing browser entry: public/app.js");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    problems.push(`Missing required Vercel file: ${file}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log("Serverless boundaries OK");
