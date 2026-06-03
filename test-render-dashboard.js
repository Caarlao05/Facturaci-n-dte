const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Set localStorage
  await page.goto('http://localhost:3000/login', {waitUntil: 'networkidle0'});
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'ADMIN' }));
  });
  
  // Go to dashboard
  await page.goto('http://localhost:3000/', {waitUntil: 'networkidle0'});
  console.log('Current URL:', page.url());
  await browser.close();
})();
