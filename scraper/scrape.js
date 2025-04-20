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
            // Get all links on the page
            const links = Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http')); // Filter out empty and non-http links
            
            // Remove duplicates
            const uniqueLinks = [...new Set(links)];
            
            return {
                title: document.title,
                url: window.location.href,
                metaDescription: document.querySelector('meta[name="description"]')?.content || 'No description found',
                timestamp: new Date().toISOString(),
                totalUrlsFound: uniqueLinks.length,
                // Get first 10 URLs (or fewer if less than 10 found)
                sampleUrls: uniqueLinks.slice(0, 10)
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