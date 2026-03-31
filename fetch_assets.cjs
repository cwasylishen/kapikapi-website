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
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                 return https.get(response.headers.location, (res) => {
                     res.pipe(file);
                     file.on('finish', () => { file.close(resolve); });
                 });
            }
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

const req = https.get(targetUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
        const urlMatch = [...data.matchAll(/<img[^>]+src="([^">]+)"/g)].map(m => m[1]);
        
        // Find logo based on URL path or file name
        let logoUrl = urlMatch.find(u => u.toLowerCase().includes('logo'));
        let otherImages = urlMatch.filter(u => 
             !u.toLowerCase().includes('logo') && 
             (u.endsWith('.jpg') || u.endsWith('.png') || u.endsWith('.jpeg')) &&
             !u.includes('wp-admin')
        );
        
        console.log("Found logo:", logoUrl);
        
        // Sometimes logos are not named 'logo'. In kapikapi, checking for a specific class or alt could be better,
        // but let's download whatever we find to see. If logoUrl is empty, take the first image that ends with png.
        if (!logoUrl) {
             logoUrl = urlMatch.find(u => u.toLowerCase().endsWith('.png'));
        }
        
        if (logoUrl) {
            await downloadFile(logoUrl, path.join(imgDir, 'logo.png'));
            console.log("Logo downloaded.");
        }
        
        // Let's grab specific image URLs if possible by passing them here or grab some generic ones.
        for (let i = 0; i < Math.min(5, otherImages.length); i++) {
             let dest = path.join(imgDir, `real_${i}.jpg`);
             try {
                await downloadFile(otherImages[i], dest);
                console.log(`Image ${i} downloaded: ${otherImages[i]}`);
             } catch(e) {}
        }
    });
});
req.on('error', console.error);
