const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting puppeteer...');
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('pageerror', err => {
            console.error('PAGE ERROR ====================');
            console.error(err.toString());
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('CONSOLE ERROR =================');
                console.error(msg.text());
            }
        });

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        console.log('Wait 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
        console.log('Done.');
    } catch (err) {
        console.error('Script Failed:', err);
    }
})();
