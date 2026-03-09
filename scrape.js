import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('https://nanobananaimg.com/prompts', { waitUntil: 'networkidle' });

    // Extract all images and their nearest text
    const items = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img')).map(img => {
            return {
                src: img.src,
                alt: img.alt || ''
            };
        });
        return images.filter(i => i.src && i.src.includes('http'));
    });

    console.log(JSON.stringify(items.slice(0, 50), null, 2));

    await browser.close();
})();
