// Create simple placeholder textures using canvas
const { createCanvas } = require('canvas');
const fs = require('fs');

// Skin texture (dark skin tone)
const skinCanvas = createCanvas(512, 512);
const skinCtx = skinCanvas.getContext('2d');
skinCtx.fillStyle = '#8B5A3C';
skinCtx.fillRect(0, 0, 512, 512);
fs.writeFileSync('young_darkskinned_female_diffuse.png', skinCanvas.toBuffer('image/png'));

// Eye texture (brown)
const eyeCanvas = createCanvas(128, 128);
const eyeCtx = eyeCanvas.getContext('2d');
eyeCtx.fillStyle = '#4A3728';
eyeCtx.fillRect(0, 0, 128, 128);
fs.writeFileSync('brown_eye.png', eyeCanvas.toBuffer('image/png'));

console.log('Placeholder textures created');
