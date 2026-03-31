const https = require('https');
const fs = require('fs');
const path = require('path');

const targetUrl = 'https://kapikapichirripo.com/';
const imgDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

function downloadFile(url, dest) {
    if (!url.startsWith('http')) return;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

https.get(targetUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
        const urlMatch = [...data.matchAll(/<img[^>]+src="([^">]+)"/g)].map(m => m[1]);
        
        let logoUrl = urlMatch.find(u => u.toLowerCase().includes('logo'));
        let otherImages = urlMatch.filter(u => !u.toLowerCase().includes('logo') && (u.endsWith('.jpg') || u.endsWith('.png')));
        
        console.log("Found logo:", logoUrl);
        console.log("Found other images:", otherImages.slice(0, 5));
        
        if (logoUrl) {
            await downloadFile(logoUrl, path.join(imgDir, 'logo.png'));
            console.log("Logo downloaded.");
        }
        
        if (otherImages.length > 0) {
             for (let i = 0; i < Math.min(3, otherImages.length); i++) {
                 await downloadFile(otherImages[i], path.join(imgDir, `real_${i}.jpg`));
                 console.log(`Image ${i} downloaded.`);
             }
        }
    });
});
