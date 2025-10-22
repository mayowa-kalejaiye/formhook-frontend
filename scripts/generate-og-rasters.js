// Lightweight script to generate PNG and JPEG variants of SVG OG images in /public
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(process.cwd(), 'public');
const svgs = ['og-image.svg', 'og-image-2.svg'];

async function generate() {
  try {
    for (const svg of svgs) {
      try {
        const svgPath = path.join(publicDir, svg);
        if (!fs.existsSync(svgPath)) {
          console.log(`Skipping ${svg} — not found`);
          continue;
        }

        const base = path.basename(svg, path.extname(svg));
        const pngPath = path.join(publicDir, `${base}.png`);
        const jpgPath = path.join(publicDir, `${base}.jpg`);

        const svgBuffer = fs.readFileSync(svgPath);

        // Generate a large PNG for social previews (1200x630 recommended)
        await sharp(svgBuffer)
          .resize(1200, 630, { fit: 'cover' })
          .png({ quality: 90 })
          .toFile(pngPath);
        console.log(`Wrote ${pngPath}`);

        // Generate a JPEG fallback
        await sharp(svgBuffer)
          .resize(1200, 630, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toFile(jpgPath);
        console.log(`Wrote ${jpgPath}`);
      } catch (fileErr) {
        console.error(`Failed to process ${svg}:`, fileErr && fileErr.message ? fileErr.message : fileErr);
        // continue to next file
      }
    }
    console.log('OG raster generation complete');
  } catch (err) {
    console.error('Error generating OG rasters:', err);
    process.exit(1);
  }
}

generate();
