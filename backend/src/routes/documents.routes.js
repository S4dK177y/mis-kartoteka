const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documents.controller');
const { authenticateToken } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// patientId is passed from patient routes in index.js usually, but let's mount it correctly
router.post('/patients/:patientId/documents', authenticateToken, upload.single('file'), documentsController.upload);
router.post('/consultations/:consultationId/documents', authenticateToken, upload.single('file'), documentsController.upload);
router.post('/consultations/:consultationId/vvk-document', authenticateToken, upload.single('file'), documentsController.uploadVvk);
router.get('/documents/:id', documentsController.download);
router.delete('/documents/:id', authenticateToken, documentsController.remove);

module.exports = router;
