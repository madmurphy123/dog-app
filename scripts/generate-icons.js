/* Generate the app's PWA / favicon / iOS icons from the 1024px master.
 * Run with: npm run generate-icons
 * The outputs are committed, so CI never needs image tooling. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, '.claude/app-icons/AppIcon.appiconset/icon-1024.png');
const OUT = path.join(ROOT, 'src/assets/icons');

// Sizes the manifest references.
const MANIFEST_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  if (!fs.existsSync(MASTER)) {
    throw new Error('Master icon not found: ' + MASTER);
  }
  fs.mkdirSync(OUT, { recursive: true });

  for (const size of MANIFEST_SIZES) {
    await sharp(MASTER)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(OUT, `icon-${size}x${size}.png`));
  }

  // iOS home-screen icon.
  await sharp(MASTER)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT, 'apple-touch-icon.png'));

  // PNG favicon for modern browsers.
  await sharp(MASTER)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT, 'favicon-32.png'));

  // Multi-size favicon.ico for the /favicon.ico convention.
  const icoBuffers = await Promise.all(
    [16, 32, 48].map((s) => sharp(MASTER).resize(s, s, { fit: 'cover' }).png().toBuffer())
  );
  const ico = await pngToIco(icoBuffers);
  fs.writeFileSync(path.join(ROOT, 'src/favicon.ico'), ico);

  console.log(`Generated ${MANIFEST_SIZES.length} PWA icons + apple-touch + favicon from ${path.basename(MASTER)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
