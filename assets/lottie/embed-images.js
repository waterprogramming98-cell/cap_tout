const fs = require('fs');
const path = require('path');

const LOTTIE_FILE = 'logo-intro-external.json';
const IMAGES_DIR = 'images';

const animation = JSON.parse(fs.readFileSync(LOTTIE_FILE, 'utf8'));

animation.assets.forEach(asset => {
  if (asset.p && asset.e === 0) {
    const imagePath = path.join(IMAGES_DIR, asset.p);

    if (!fs.existsSync(imagePath)) {
      console.error('Image not found:', imagePath);
      return;
    }

    const ext = path.extname(imagePath).slice(1);
    const base64 = fs.readFileSync(imagePath).toString('base64');

    asset.p = `data:image/${ext};base64,${base64}`;
    asset.u = '';
    asset.e = 1;
  }
});

fs.writeFileSync(
  'logo-intro-external-embedded.json',
  JSON.stringify(animation, null, 2)
);

console.log('DONE');
