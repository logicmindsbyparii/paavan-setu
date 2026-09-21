const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Intercept responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('.json') || url.includes('/api/')) {
      console.log('Intercepted response from:', url);
      try {
        const json = await response.json();
        console.log(JSON.stringify(json).substring(0, 500));
      } catch (e) {}
    }
  });

  await page.goto('https://www.paavansetu.com/test/commerce-script', { waitUntil: 'networkidle' });
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'screenshot1.png' });
  console.log('Saved screenshot1.png');

  // Fill in coupon if it's there
  try {
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} inputs`);
  } catch (e) {
    console.log(e);
  }

  await browser.close();
})();
