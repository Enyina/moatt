const fs = require('fs');
const path = require('path');

function createBMP(width, height, pixelGenerator) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = Buffer.alloc(fileSize);

  // BMP Header
  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(54, 10);

  // DIB Header
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(-height, 22); // top-down
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelArraySize, 34);
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);
  buffer.writeUInt32LE(0, 46);
  buffer.writeUInt32LE(0, 50);

  // Pixel Data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = 54 + (y * rowSize) + (x * 3);
      const [r, g, b] = pixelGenerator(x, y, width, height);
      buffer.writeUInt8(b, offset);
      buffer.writeUInt8(g, offset + 1);
      buffer.writeUInt8(r, offset + 2);
    }
  }

  return buffer;
}

const fabrics = [
  { name: 'cotton', frequency: 10, amplitude: 20 },
  { name: 'denim', frequency: 5, amplitude: 50 }, // Diagonal twill?
  { name: 'silk', frequency: 2, amplitude: 5 }, // Very smooth
  { name: 'leather', frequency: 3, amplitude: 40 }, // Voronoi-like leather?
  { name: 'nylon', frequency: 15, amplitude: 10 },
  { name: 'fleece', frequency: 8, amplitude: 60 }
];

const dir = path.join(__dirname, 'public', 'textures', 'fabrics');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fabrics.forEach(f => {
  // Normal Map (Base 128, 128, 255)
  const normalBuffer = createBMP(256, 256, (x, y) => {
    let noise = 0;
    if (f.name === 'denim') {
      noise = Math.sin((x + y) * f.frequency) * f.amplitude;
    } else if (f.name === 'leather') {
      noise = (Math.sin(x/5) * Math.cos(y/5)) * f.amplitude;
    } else {
      noise = (Math.random() - 0.5) * f.amplitude;
    }
    
    // Convert to normal vector
    const nx = Math.min(255, Math.max(0, 128 + noise));
    const ny = Math.min(255, Math.max(0, 128 + noise));
    const nz = 255;
    return [nx, ny, nz];
  });
  fs.writeFileSync(path.join(dir, `${f.name}_normal.bmp`), normalBuffer);

  // Roughness Map (Grayscale)
  const roughBuffer = createBMP(256, 256, (x, y) => {
    let noise = 0;
    if (f.name === 'denim') {
      noise = Math.sin((x + y) * f.frequency) * f.amplitude;
    } else {
      noise = (Math.random() - 0.5) * f.amplitude;
    }
    
    // Base roughness
    let base = 128;
    if (f.name === 'silk') base = 50; // Smooth
    if (f.name === 'fleece') base = 200; // Rough
    
    const val = Math.min(255, Math.max(0, base + noise));
    return [val, val, val];
  });
  fs.writeFileSync(path.join(dir, `${f.name}_roughness.bmp`), roughBuffer);
});

console.log('Generated placeholder fabric textures.');
