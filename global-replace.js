const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDirs = ['app', 'components', 'lib', 'contexts', 'hooks'];

targetDirs.forEach(dir => {
    const fullDir = path.join(__dirname, dir);
    if (fs.existsSync(fullDir)) {
        walkDir(fullDir, (filePath) => {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                let content = fs.readFileSync(filePath, 'utf8');
                let original = content;

                content = content.replace(/dealer_id/g, 'seller_id');
                content = content.replace(/dealerId/g, 'sellerId');
                content = content.replace(/DealerId/g, 'SellerId');
                content = content.replace(/isDealer/g, 'isSeller');
                content = content.replace(/listing\.dealer/g, 'listing.seller');
                content = content.replace(/dealer:/g, 'seller:');
                content = content.replace(/dealerData/g, 'sellerData');
                content = content.replace(/listings_dealer_id_fkey/g, 'listings_seller_id_fkey');

                if (content !== original) {
                    fs.writeFileSync(filePath, content);
                    console.log('Updated', filePath);
                }
            }
        });
    }
});
console.log('Global replace done.');
