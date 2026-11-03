const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Helper to create a valid minimal PNG buffer of width x height with a background color
function createPngBuffer(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      crc = crc ^ byte;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    buf.writeInt32BE(crc ^ 0xffffffff, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(__dirname, "../public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Brand blue: #2563eb -> rgb(37, 99, 235)
const icon192 = createPngBuffer(192, 192, 37, 99, 235);
const icon512 = createPngBuffer(512, 512, 37, 99, 235);
const iconMaskable = createPngBuffer(512, 512, 30, 64, 175);

fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), icon192);
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), icon512);
fs.writeFileSync(path.join(iconsDir, "icon-maskable.png"), iconMaskable);

console.log("✓ Successfully generated PWA PNG icons in public/icons/");
