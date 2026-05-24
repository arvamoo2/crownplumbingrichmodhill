// Screenshot driver — index.html polish pass
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:5500';
const OUT = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const W = 1440, H = 900;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shoot(page, name) {
  await page.evaluate(() => {
    document.querySelectorAll(
      '.hero-image, .hero-panel, .statement-image, .programmes-head-media, .feature-image, .feature-pair .ba-half, .gallery-item, .service-row-media, .casebook-media, .ba-half, .reveal, .word'
    ).forEach(el => el.classList.add('in'));
  });
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => { img.onload = img.onerror = res; setTimeout(res, 3500); });
    }));
  });
  await sleep(500);
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  const sy = await page.evaluate(() => window.scrollY);
  console.log('  ✓ ' + name + ' (scrollY=' + sy + ')');
}

async function scrollToSelector(page, selector, offset = -40) {
  const y = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, selector);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, y + offset));
  await sleep(900);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1.5 });
    await page.evaluateOnNewDocument(() => {
      window.__noLenis = true;
      try { sessionStorage.setItem('seen-intro', '1'); } catch (e) {}
    });

    console.log('INDEX');
    await page.goto(BASE + '/index.html?cb=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2200);

    // 1. Hero
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(700);
    await shoot(page, '01-index-hero');

    // 2. Statement
    await scrollToSelector(page, '.statement', -60);
    await shoot(page, '02-index-statement');

    // 3. Programmes (header + first 2 programmes, with hover preview)
    await scrollToSelector(page, '.programme-list', -120);
    await sleep(400);
    const prog = await page.$('.programme-list > .programme:nth-child(2)');
    if (prog) {
      const box = await prog.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 220, box.y + box.height / 2, { steps: 14 });
        await sleep(800);
      }
    }
    await shoot(page, '03-index-programmes');
    await page.mouse.move(10, 10);
    await sleep(300);

    // 4. Work feature
    await scrollToSelector(page, '.feature-pair', -80);
    await shoot(page, '04-index-work');

    // 5. Stats
    await scrollToSelector(page, '.stats-promises', -120);
    await shoot(page, '05-index-stats');

    // 6. CTA
    await scrollToSelector(page, '.cta-band', -60);
    await shoot(page, '06-index-cta');

    // 7. Divider visible mid-frame (between work feature and stats)
    const dividerY = await page.evaluate(() => {
      const dividers = document.querySelectorAll('.divider');
      // Pick the divider before the stats section
      const stats = document.querySelector('.section-stats');
      if (!stats) return 0;
      let target = null;
      dividers.forEach(d => { if (d.getBoundingClientRect().top + window.scrollY < stats.getBoundingClientRect().top + window.scrollY) target = d; });
      return target ? target.getBoundingClientRect().top + window.scrollY : 0;
    });
    await page.evaluate((y) => window.scrollTo({ top: y - 350, behavior: 'instant' }), dividerY);
    await sleep(900);
    await shoot(page, '07-index-divider');

    console.log('SERVICES');
    await page.goto(BASE + '/services.html?cb=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // 07-services-hero
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(700);
    await shoot(page, '07-services-hero');

    // 08-services-row-i-ii — rows I & II in viewport
    await scrollToSelector(page, '#inspection', -120);
    await shoot(page, '08-services-row-i-ii');

    // 09-services-row-iv — Restoration focal
    await scrollToSelector(page, '#restoration', -80);
    await shoot(page, '09-services-row-iv');

    // 10-services-row-vi — Estate
    await scrollToSelector(page, '#estate', -80);
    await shoot(page, '10-services-row-vi');

    // 11-services-cta
    await scrollToSelector(page, '.cta-band', -60);
    await shoot(page, '11-services-cta');

    console.log('GALLERY');
    await page.goto(BASE + '/gallery.html?cb=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // 12-gallery-hero
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(700);
    await shoot(page, '12-gallery-hero');

    // 13-gallery-case-i
    await scrollToSelector(page, '#case-i', -100);
    await shoot(page, '13-gallery-case-i');

    // 14-gallery-case-iv
    await scrollToSelector(page, '#case-iv', -100);
    await shoot(page, '14-gallery-case-iv');

    // 15-gallery-case-vi
    await scrollToSelector(page, '#case-vi', -100);
    await shoot(page, '15-gallery-case-vi');

    // 16-gallery-closing
    await scrollToSelector(page, '.cta-band', -60);
    await shoot(page, '16-gallery-closing');

    console.log('BOOK');
    await page.goto(BASE + '/book.html?cb=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // 17-book-hero
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(700);
    await shoot(page, '17-book-hero');

    // 18-book-form-top — top of form + sidebar
    await scrollToSelector(page, '.book-form-headline', -120);
    await shoot(page, '18-book-form-top');

    // 19-book-form-bottom — submit button + bottom of sidebar
    await scrollToSelector(page, '.form-submit', -560);
    await shoot(page, '19-book-form-bottom');

    // 20-book-closing
    await scrollToSelector(page, '.closing-strip', -60);
    await shoot(page, '20-book-closing');

    console.log('Done.');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
