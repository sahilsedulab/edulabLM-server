import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import documentController from '../controllers/document.controller';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.post('/topic', documentController.createFromTopic);
router.get('/:id', documentController.getDocument);
router.get('/', documentController.listDocuments);

export default router;
