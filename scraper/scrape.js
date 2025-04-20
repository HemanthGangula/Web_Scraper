const puppeteer = require('puppeteer');
const fs = require('fs');

const url = process.env.SCRAPE_URL || 'https://exactspace.co/';

async function scrape() {
    console.log(`Starting to scrape: ${url}`);
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        headless: 'new'
    });

    try {
        const page = await browser.newPage();
        console.log('Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('Extracting data...');
        const data = await page.evaluate(() => {
            return {
                title: document.title,
                heading: document.querySelector('h1')?.innerText || 'No h1 found',
                url: window.location.href,
                timestamp: new Date().toISOString(),
                metaDescription: document.querySelector('meta[name="description"]')?.content || 'No description found'
            };
        });
        console.log('Saving data...');
        fs.writeFileSync('/app/scraped_data.json', JSON.stringify(data, null, 2));
        console.log('Scraping complete');
    } catch (error) {
        console.error('Error during scraping:', error);
        fs.writeFileSync('/app/scraped_data.json', JSON.stringify({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            url: url
        }, null, 2));
    } finally {
        await browser.close();
    }
}

scrape();
