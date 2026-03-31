const https = require('https');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'public', 'images');
const publicDir = path.join(__dirname, 'public');

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
            if (response.statusCode !== 200) {
               console.error('Failed to download', url, 'status:', response.statusCode);
               return reject(new Error('Status: ' + response.statusCode));
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

async function run() {
    console.log("Downloading hero bg...");
    await downloadFile('https://kapikapichirripo.com/wp-content/uploads/2021/04/KapiKapi_Header_Background.jpg', path.join(imgDir, 'hero_bg.jpg')).catch(console.error);
    
    console.log("Downloading food image...");
    await downloadFile('https://kapikapichirripo.com/wp-content/uploads/2021/11/baea93cff936537d139c95db8e275a0e.jpg', path.join(imgDir, 'real_1.jpg')).catch(console.error);

    console.log("Downloading menu PDF...");
    await downloadFile('https://kapikapichirripo.com/wp-content/uploads/2025/05/Kapi-Menu-Master-English-NEW-1.pdf', path.join(publicDir, 'menu.pdf')).catch(console.error);
    
    console.log("Done.");
}

run();
