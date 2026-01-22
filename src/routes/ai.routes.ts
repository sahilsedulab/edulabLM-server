import { Router } from 'express';
import aiController from '../controllers/ai.controller';

const router = Router();

router.post('/process', aiController.processDocument);
router.get('/content/:documentId', aiController.getGeneratedContent);
router.post('/chat', aiController.chat);

export default router;
