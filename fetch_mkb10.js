const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/ak4nv/mkb10/master/data/data.json';
const dest = path.join(__dirname, 'frontend', 'public', 'mkb10.json');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to fetch. Status code: ${res.statusCode}`);
    return;
  }
  
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Successfully downloaded mkb10.json');
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
