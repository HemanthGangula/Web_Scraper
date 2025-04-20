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
        
        const extractedData = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'));
            
            const uniqueLinks = [...new Set(links)];
            
            return {
                title: document.title,
                metaDescription: document.querySelector('meta[name="description"]')?.content || 'No description found',
                url: window.location.href,
                timestamp: new Date().toISOString(),
                totalUrlsFound: uniqueLinks.length,
                sampleUrls: uniqueLinks.slice(0, 10)
            };
        });

        console.log('Saving data...');
        
        let manualJson = `{
  "title": ${JSON.stringify(extractedData.title)},
  "metaDescription": ${JSON.stringify(extractedData.metaDescription)},
  "url": ${JSON.stringify(extractedData.url)},
  "timestamp": ${JSON.stringify(extractedData.timestamp)},
  "totalUrlsFound": ${extractedData.totalUrlsFound},
  "sampleUrls": [
`;

        extractedData.sampleUrls.forEach((item, i) => {
            manualJson += `    ${JSON.stringify(item)}${i < extractedData.sampleUrls.length - 1 ? ',' : ''}\n`;
        });

        manualJson += `  ]
}`;
        
        fs.writeFileSync('/app/scraped_data.json', manualJson);
        console.log('Scraping complete');
    } catch (error) {
        console.error('Error during scraping:', error);
        
        const errorJson = `{
  "title": "Error",
  "metaDescription": ${JSON.stringify(error.message)},
  "url": ${JSON.stringify(url)},
  "timestamp": ${JSON.stringify(new Date().toISOString())},
  "totalUrlsFound": 0,
  "sampleUrls": []
}`;
        
        fs.writeFileSync('/app/scraped_data.json', errorJson);
    } finally {
        await browser.close();
    }
}

scrape();
