const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storageDir = path.join(__dirname, '..', '..', 'data', 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.patientId || 'unassigned';
    const patientDir = path.join(storageDir, patientId);
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
    }
    cb(null, patientDir);
  },
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitizedName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9.\-_ ]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

const upload = multer({ storage });
module.exports = { upload, storageDir };
