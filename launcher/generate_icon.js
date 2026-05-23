const sharp = require('sharp');
sharp('build/icon.svg')
  .png()
  .toFile('build/icon.png')
  .then(() => console.log('Successfully generated build/icon.png'))
  .catch(err => console.error(err));
