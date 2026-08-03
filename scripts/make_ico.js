import fs from 'fs';
import path from 'path';

const png128Path = path.resolve('src-tauri/icons/128x128.png');
const png32Path = path.resolve('src-tauri/icons/32x32.png');

const png128Buf = fs.readFileSync(png128Path);
const png32Buf = fs.readFileSync(png32Path);

// Create multi-resolution valid Windows ICO file (128x128 and 32x32 entries)
const header = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // Type: ICO
  0x02, 0x00  // Image count: 2
]);

// Entry 1: 128x128
const entry1 = Buffer.alloc(16);
entry1.writeUInt8(128, 0); // Width
entry1.writeUInt8(128, 1); // Height
entry1.writeUInt8(0, 2);   // Color count
entry1.writeUInt8(0, 3);   // Reserved
entry1.writeUInt16LE(1, 4); // Color planes
entry1.writeUInt16LE(32, 6); // Bits per pixel
entry1.writeUInt32LE(png128Buf.length, 8); // Size
entry1.writeUInt32LE(6 + 16 + 16, 12); // Offset (22 + 16 = 38)

// Entry 2: 32x32
const entry2 = Buffer.alloc(16);
entry2.writeUInt8(32, 0);  // Width
entry2.writeUInt8(32, 1);  // Height
entry2.writeUInt8(0, 2);   // Color count
entry2.writeUInt8(0, 3);   // Reserved
entry2.writeUInt16LE(1, 4); // Color planes
entry2.writeUInt16LE(32, 6); // Bits per pixel
entry2.writeUInt32LE(png32Buf.length, 8); // Size
entry2.writeUInt32LE(6 + 16 + 16 + png128Buf.length, 12); // Offset

const icoBuf = Buffer.concat([header, entry1, entry2, png128Buf, png32Buf]);

fs.writeFileSync('src-tauri/icons/icon.ico', icoBuf);
console.log('Successfully wrote valid Windows ICO file (Length:', icoBuf.length, 'bytes)');
