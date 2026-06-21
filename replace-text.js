const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
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

                content = content.replace(/dealers/g, 'sellers');
                content = content.replace(/Dealers/g, 'Sellers');
                content = content.replace(/dealer/g, 'seller');
                content = content.replace(/Dealer/g, 'Seller');

                if (content !== original) {
                    fs.writeFileSync(filePath, content);
                    console.log('Updated texts in', filePath);
                }
            }
        });
    }
});
