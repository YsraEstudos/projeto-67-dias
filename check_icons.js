
import fs from 'fs';
import path from 'path';

function inspectFile(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(24);
        fs.readSync(fd, buffer, 0, 24, 0);
        fs.closeSync(fd);

        const hex = buffer.toString('hex');
        console.log(`${filePath}: Header=${hex}`);

        if (hex.startsWith('89504e47')) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            console.log(`  -> PNG ${width}x${height}`);
        } else if (hex.startsWith('ffd8ff')) {
            console.log(`  -> Likely JPEG`);
            // JPEG dimension parsing is harder, but at least we know it's JPEG
        } else if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') {
            console.log(`  -> WEBP`);
        } else {
            console.log(`  -> Unknown format`);
        }
    } catch (e) {
        console.log(`${filePath}: Error - ${e.message}`);
    }
}

const icons = ['public/pwa-icon-192.png', 'public/pwa-icon-512.png', 'dist/pwa-icon-512.png'];
const root = process.cwd();

icons.forEach(icon => {
    inspectFile(path.join(root, icon));
});
