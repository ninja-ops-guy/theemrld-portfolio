import fs from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/check-lighthouse.mjs <report.json>');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score ?? 0]));
const budgets = {
  performance: 0.80,
  accessibility: 0.95,
  'best-practices': 0.90,
  seo: 0.90,
};
let failed = false;
for (const [category, minimum] of Object.entries(budgets)) {
  const score = scores[category] ?? 0;
  console.log(`${category}: ${Math.round(score * 100)} (budget ${Math.round(minimum * 100)})`);
  if (score < minimum) failed = true;
}
if (failed) process.exit(1);
