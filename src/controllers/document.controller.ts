import { Request, Response } from 'express';
import pdfService from '../services/pdf.service';
import { Document } from '../types';
import { v4 as uuidv4 } from 'uuid';

const documents = new Map<string, Document>();

export class DocumentController {
  async uploadDocument(req: Request, res: Response) {
    console.log(`\n📤 [Upload] New document upload request`);
    
    try {
      if (!req.file) {
        console.log(`❌ [Upload] No file provided`);
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log(`   Original name: ${req.file.originalname}`);
      console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);

      const text = await pdfService.extractText(req.file.path);
      
      const document: Document = {
        id: uuidv4(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        text,
        uploadedAt: new Date(),
        processed: false
      };

      documents.set(document.id, document);

      console.log(`✅ [Upload] Document uploaded successfully`);
      console.log(`   Document ID: ${document.id}`);
      console.log(`   Text extracted: ${text.length} characters\n`);

      res.json({
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        uploadedAt: document.uploadedAt,
        textLength: text.length
      });
    } catch (error) {
      console.error(`\n❌ [Upload] Failed!`);
      console.error('   Error:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  }

  async getDocument(req: Request, res: Response) {
    const { id } = req.params;
    const document = documents.get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  }

  async listDocuments(req: Request, res: Response) {
    const docs = Array.from(documents.values()).map(doc => ({
      id: doc.id,
      filename: doc.filename,
      originalName: doc.originalName,
      uploadedAt: doc.uploadedAt,
      processed: doc.processed
    }));

    res.json(docs);
  }

  async createFromTopic(req: Request, res: Response) {
    console.log(`\n📝 [Topic] New topic-based document request`);
    
    try {
      const { topic } = req.body;
      
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        console.log(`❌ [Topic] Invalid topic provided`);
        return res.status(400).json({ error: 'Topic is required' });
      }

      console.log(`   Topic: "${topic}"`);

      // Generate comprehensive content about the topic using AI
      const aiProvider = (await import('../services/ai-provider.service')).default;
      
      const prompt = `You are an expert educator. Provide a comprehensive, detailed explanation about the following topic. Include key concepts, definitions, examples, applications, and important facts. Write 800-1200 words.

Topic: ${topic}

Detailed explanation:`;

      console.log(`   Generating content with AI...`);
      const text = await aiProvider.generate(prompt);
      
      const document: Document = {
        id: uuidv4(),
        filename: `topic-${Date.now()}.txt`,
        originalName: `${topic}.txt`,
        text,
        uploadedAt: new Date(),
        processed: false
      };

      documents.set(document.id, document);

      console.log(`✅ [Topic] Document created successfully`);
      console.log(`   Document ID: ${document.id}`);
      console.log(`   Content length: ${text.length} characters\n`);

      res.json({
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        text: text,
        uploadedAt: document.uploadedAt,
        textLength: text.length
      });
    } catch (error) {
      console.error(`\n❌ [Topic] Failed!`);
      console.error('   Error:', error);
      res.status(500).json({ error: 'Failed to generate content from topic' });
    }
  }
}

export default new DocumentController();
