const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', {waitUntil: 'networkidle0'});
  const html = await page.content();
  console.log(html.includes('Bienvenido a Nexxo'));
  await browser.close();
})();
