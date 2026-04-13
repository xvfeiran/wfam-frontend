import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const routes = ['/return-orders', '/return-parts', '/analysis-orders'];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logConsole = (prefix, msg) => {
  const location = msg.location();
  const where = location && location.url ? ` @ ${location.url}:${location.lineNumber + 1}` : '';
  console.log(`[${prefix}] ${msg.type().toUpperCase()} ${msg.text()}${where}`);
};

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => logConsole('Console', msg));
  page.on('pageerror', (err) => console.log(`[PageError] ${err.message}`));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    console.log(`[RequestFailed] ${req.method()} ${req.url()} => ${failure?.errorText || 'unknown'}`);
  });

  const devEntry = `${baseUrl}/?dev=1`;
  console.log(`\n[Visit] ${devEntry}`);
  await page.goto(devEntry, { waitUntil: 'networkidle', timeout: 30000 });
  await delay(1200);

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    console.log(`\n[Visit] ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(2500);
    } catch (err) {
      console.log(`[VisitError] ${url} => ${err.message}`);
    }
  }

  await browser.close();
}

run().catch((err) => {
  console.error(`[Fatal] ${err.message}`);
  process.exit(1);
});
