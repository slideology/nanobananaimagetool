import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('Starting Playwright scraper for more prompts...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to https://nanobananaimg.com/prompts ...');
    await page.goto('https://nanobananaimg.com/prompts', { waitUntil: 'networkidle', timeout: 60000 });

    console.log('Scrolling to load more images...');

    // Scroll multiple times to trigger infinite loading
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500); // 1.5 seconds wait between scrolls
    }

    console.log('Extracting image data...');
    const scrapedData = await page.evaluate(() => {
        // Collect all valid images in the grid
        const items = Array.from(document.querySelectorAll('img')).filter(img =>
            !img.src.includes('logo') &&
            !img.src.includes('avatar') &&
            img.src.startsWith('http') &&
            img.alt &&
            img.alt.length > 10
        );

        const dataMap = new Map();
        items.forEach(img => {
            // Use clean image URL as key to prevent duplicates
            const cleanUrl = img.src.split('?')[0];
            dataMap.set(cleanUrl, {
                src: cleanUrl,
                alt: img.alt.trim(),
                model: "nano-banana-pro", // default fallback
                type: "text-to-image", // default
                ratio: "1:1", // default
                resolution: "2K" // default
            });
        });

        return Array.from(dataMap.values());
    });

    console.log(`Scraped ${scrapedData.length} unique items.`);

    // Save to a temporary JSON file to inspect
    fs.writeFileSync('scraped_prompts_more.json', JSON.stringify(scrapedData, null, 2));
    console.log('Saved data to scraped_prompts_more.json');

    await browser.close();
}

main().catch(console.error);
