import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173/';
const artifactDir = path.resolve('artifacts/portfolio-audit');
await fs.mkdir(artifactDir, { recursive: true });

const targets = [
  { name: 'home-desktop', hash: '#/', viewport: { width: 1440, height: 900 } },
  { name: 'home-mobile', hash: '#/', viewport: { width: 390, height: 844 } },
  { name: 'residual-desktop', hash: '#/case-study/residual', viewport: { width: 1440, height: 900 } },
  { name: 'rac-mobile', hash: '#/case-study/adversarial-clothing', viewport: { width: 390, height: 844 } },
];

const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const target of targets) {
  const context = await browser.newContext({
    viewport: target.viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const url = base + target.hash;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForTimeout(500);

  const h1 = page.locator('h1').first();
  const h1Visible = await h1.isVisible().catch(() => false);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

  await page.screenshot({ path: path.join(artifactDir, target.name + '.png'), fullPage: true });

  const result = {
    target: target.name,
    url,
    status: response?.status() ?? null,
    h1Visible,
    horizontalOverflowPx: overflow,
    pageErrors,
    seriousAccessibilityViolations: serious.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      details: v.nodes.map(node => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    })),
  };
  report.push(result);

  if (!response || response.status() >= 400) failures.push(`${target.name}: HTTP ${response?.status() ?? 'no response'}`);
  if (!h1Visible) failures.push(`${target.name}: primary heading is not visible`);
  if (overflow > 2) failures.push(`${target.name}: horizontal overflow is ${overflow}px`);
  if (pageErrors.length) failures.push(`${target.name}: page errors: ${pageErrors.join(' | ')}`);
  if (serious.length) failures.push(`${target.name}: ${serious.length} serious/critical accessibility violation(s)`);

  await context.close();
}

await browser.close();
await fs.writeFile(path.join(artifactDir, 'report.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('\nPortfolio audit failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Portfolio audit passed across desktop/mobile flagship routes.');
