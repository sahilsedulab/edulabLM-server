import { Request, Response } from 'express';
import aiService from '../services/ai.service';
import { GeneratedContent } from '../types';

const generatedContent = new Map<string, GeneratedContent>();
const documents = new Map<string, any>();

export class AIController {
  async processDocument(req: Request, res: Response) {
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║          AI PROCESSING STARTED                         ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    
    try {
      const { documentId, text } = req.body;

      if (!text) {
        console.log(`❌ [AI] No text provided`);
        return res.status(400).json({ error: 'No text provided' });
      }

      console.log(`   Document ID: ${documentId}`);
      console.log(`   Text length: ${text.length} characters`);
      console.log(`\n⚡ Generating content sequentially (reliable processing)...\n`);

      const startTime = Date.now();
      
      // Generate with smart fallbacks for reliability
      console.log(`   [1/5] Generating Mind Map...`);
      const mindMap = await aiService.generateMindMap(text).catch((err) => {
        console.log(`   ⚠️  Using fallback mind map`);
        return aiService.generateFallbackMindMap(text);
      });
      
      console.log(`   [2/5] Generating Audio Overview...`);
      const audioOverview = await aiService.generateAudioOverview(text).catch((err) => {
        console.log(`   ⚠️  Using fallback audio overview`);
        return aiService.generateFallbackAudio(text);
      });
      
      console.log(`   [3/5] Generating Video Overview...`);
      const videoOverview = await aiService.generateVideoOverview(text, documentId).catch((err) => {
        console.log(`   ⚠️  Using fallback video overview`);
        return aiService.generateFallbackVideo(text);
      });
      
      console.log(`   [4/5] Generating Flashcards...`);
      const flashcards = await aiService.generateFlashcards(text).catch((err) => {
        console.log(`   ⚠️  Using fallback flashcards`);
        return aiService.generateFallbackFlashcards(text);
      });
      
      console.log(`   [5/5] Generating Quiz...`);
      const quiz = await aiService.generateQuiz(text).catch((err) => {
        console.log(`   ⚠️  Using fallback quiz`);
        return aiService.generateFallbackQuiz(text);
      });

      const content: GeneratedContent = {
        documentId,
        mindMap,
        audioOverview,
        videoOverview,
        flashcards,
        quiz
      };

      generatedContent.set(documentId, content);
      documents.set(documentId, { text });

      const generationDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n✅ All content generated in ${generationDuration}s`);
      
      // Check if we're in Qwen mode (ollama provider)
      const provider = process.env.AI_PROVIDER || 'gemini';
      if (provider === 'ollama') {
        const elapsedTime = Date.now() - startTime;
        const twoMinutes = 120000; // 2 minutes in milliseconds
        const remainingTime = twoMinutes - elapsedTime;
        
        if (remainingTime > 0) {
          console.log(`\n⏳ [Qwen Mode] Content ready, waiting ${(remainingTime / 1000).toFixed(0)}s more to reach 2 minutes...`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
          console.log(`✅ [Qwen Mode] 2-minute delay complete`);
        }
      }
      
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n╔════════════════════════════════════════════════════════╗`);
      console.log(`║          AI PROCESSING COMPLETED                       ║`);
      console.log(`╚════════════════════════════════════════════════════════╝`);
      console.log(`   Total time: ${totalDuration}s`);
      console.log(`   Mind map: ✅`);
      console.log(`   Audio overview: ✅`);
      console.log(`   Video overview: ✅`);
      console.log(`   Flashcards: ✅ (${flashcards.length} cards)`);
      console.log(`   Quiz: ✅ (${quiz.length} questions)\n`);

      res.json(content);
    } catch (error) {
      console.error(`\n╔════════════════════════════════════════════════════════╗`);
      console.error(`║          AI PROCESSING FAILED                          ║`);
      console.error(`╚════════════════════════════════════════════════════════╝`);
      console.error('   Error:', error);
      res.status(500).json({ error: 'Failed to process document with AI' });
    }
  }

  async getGeneratedContent(req: Request, res: Response) {
    const { documentId } = req.params;
    const content = generatedContent.get(documentId);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  }

  async chat(req: Request, res: Response) {
    console.log(`\n💬 [Chat] New chat request`);
    
    try {
      const { documentId, question, history = [] } = req.body;

      console.log(`   Document ID: ${documentId}`);
      console.log(`   Question: "${question.substring(0, 100)}..."`);

      const doc = documents.get(documentId);
      if (!doc) {
        console.log(`❌ [Chat] Document not found`);
        return res.status(404).json({ error: 'Document not found' });
      }

      const answer = await aiService.chatWithDocument(doc.text, question, history);

      console.log(`✅ [Chat] Response sent\n`);
      res.json({ answer });
    } catch (error) {
      console.error(`\n❌ [Chat] Failed!`);
      console.error('   Error:', error);
      res.status(500).json({ error: 'Failed to process chat' });
    }
  }
}

export default new AIController();
