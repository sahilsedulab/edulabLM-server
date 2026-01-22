import aiProvider from './ai-provider.service';
import { MindMapNode, Flashcard, QuizQuestion } from '../types';

export class AIService {
  private isQwen(): boolean {
    return (process.env.AI_PROVIDER || 'gemini') === 'ollama';
  }

  async generateMindMap(text: string): Promise<MindMapNode> {
    console.log(`\n🧠 [AI] Generating Mind Map...`);
    
    const prompt = this.isQwen() 
      ? `Create mind map JSON from text. 2-3 levels, 8-12 nodes max.
Format: {"id":"root","label":"Topic","children":[{"id":"1","label":"Subtopic","children":[{"id":"1.1","label":"Detail"}]}]}

Text: ${text.substring(0, 1500)}

JSON:`
      : `You are an expert educational content creator. Analyze this document and create a comprehensive, hierarchical mind map.

TASK: Create a detailed mind map that captures ALL key concepts, topics, and relationships.

REQUIREMENTS:
✓ 3-4 levels of hierarchy (root → main topics → subtopics → details)
✓ 15-30 total nodes covering the entire document
✓ Clear, specific labels (avoid generic terms like "Introduction")
✓ Include facts, examples, definitions, and key points
✓ Logical grouping of related concepts
✓ Balanced tree structure

OUTPUT FORMAT: Valid JSON only, no markdown, no explanation
{
  "id": "root",
  "label": "[Main Topic/Title from document]",
  "children": [
    {
      "id": "1",
      "label": "[First Major Concept]",
      "children": [
        {
          "id": "1.1",
          "label": "[Specific subtopic or detail]",
          "children": [
            {"id": "1.1.1", "label": "[Concrete fact or example]"}
          ]
        }
      ]
    }
  ]
}

DOCUMENT CONTENT:
${text.substring(0, 4000)}

Generate the mind map JSON now:`;

    const response = await aiProvider.generate(prompt);
    const result = this.parseJSON(response, { id: 'root', label: 'Document', children: [] });
    console.log(`✅ [AI] Mind Map generated with ${this.countNodes(result)} nodes`);
    return result;
  }

  private countNodes(node: MindMapNode): number {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  async generateAudioOverview(text: string): Promise<string> {
    console.log(`\n🎙️ [AI] Generating Audio Overview...`);
    
    const prompt = this.isQwen()
      ? `Summarize in 2 sentences: ${text.substring(0, 800)}`
      : `You are a professional podcast narrator. Create an engaging 3-4 sentence audio overview of this document.

REQUIREMENTS:
✓ Conversational and engaging tone
✓ Highlight the most important points
✓ Easy to understand when spoken aloud
✓ 3-4 sentences maximum
✓ No special formatting or markdown

DOCUMENT:
${text.substring(0, 1500)}

Audio overview:`;

    const result = await aiProvider.generate(prompt);
    console.log(`✅ [AI] Audio Overview generated`);
    return result.trim();
  }

  async generateVideoOverview(text: string): Promise<string> {
    console.log(`\n🎬 [AI] Generating Video Overview...`);
    
    const prompt = this.isQwen()
      ? `Create 3 video scenes from text. Format: "Scene 1: Title. Description."

Text: ${text.substring(0, 800)}

Scenes:`
      : `You are a video script writer. Create an engaging video script with 3-5 scenes for this document.

REQUIREMENTS:
✓ Format: "Scene 1: [Title]. [Narration text]"
✓ Each scene should be 2-3 sentences
✓ Clear, engaging narration
✓ Logical flow from scene to scene
✓ Total 3-5 scenes

DOCUMENT:
${text.substring(0, 1500)}

Video script:`;

    const result = await aiProvider.generate(prompt);
    console.log(`✅ [AI] Video Overview generated`);
    return result.trim();
  }

  async generateFlashcards(text: string): Promise<Flashcard[]> {
    console.log(`\n📇 [AI] Generating Flashcards...`);
    
    const prompt = this.isQwen()
      ? `Create 5 flashcards JSON: [{"id":"1","question":"Q?","answer":"Short answer"}]

Text: ${text.substring(0, 1200)}

JSON:`
      : `You are an expert educator creating study flashcards. Generate 8-12 high-quality flashcards from this document.

REQUIREMENTS:
✓ Cover ALL major concepts and key facts
✓ Questions: Clear, specific, test understanding
✓ Answers: Detailed (2-4 sentences), informative
✓ Mix question types: definitions, explanations, applications, examples
✓ Progressive difficulty
✓ No duplicate concepts

OUTPUT FORMAT: Valid JSON array only, no markdown
[
  {
    "id": "1",
    "question": "What is [specific concept]?",
    "answer": "Detailed explanation with context and examples."
  }
]

DOCUMENT:
${text.substring(0, 3000)}

Generate flashcards JSON:`;

    const response = await aiProvider.generate(prompt);
    const result = this.parseJSON(response, []);
    console.log(`✅ [AI] Flashcards generated (${result.length} cards)`);
    return result;
  }

  async generateQuiz(text: string): Promise<QuizQuestion[]> {
    console.log(`\n✅ [AI] Generating Quiz...`);
    
    const prompt = this.isQwen()
      ? `Create 3 quiz questions JSON: [{"id":"1","question":"Q?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Why"}]

Text: ${text.substring(0, 1000)}

JSON:`
      : `You are an expert test creator. Generate 6-8 challenging multiple-choice questions from this document.

REQUIREMENTS:
✓ Test deep understanding, not just memorization
✓ 4 options per question (A, B, C, D)
✓ Plausible distractors (wrong answers that seem reasonable)
✓ Detailed explanations (2-3 sentences)
✓ Cover different topics from the document
✓ Mix difficulty levels (easy, medium, hard)

OUTPUT FORMAT: Valid JSON array only, no markdown
[
  {
    "id": "1",
    "question": "Specific question testing understanding?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this is correct and why others are wrong."
  }
]

DOCUMENT:
${text.substring(0, 2500)}

Generate quiz JSON:`;

    const response = await aiProvider.generate(prompt);
    const result = this.parseJSON(response, []);
    console.log(`✅ [AI] Quiz generated (${result.length} questions)`);
    return result;
  }

  async chatWithDocument(text: string, question: string, history: any[]): Promise<string> {
    console.log(`\n💬 [AI] Processing chat question: "${question.substring(0, 50)}..."`);

    const messages = this.isQwen()
      ? [
          {
            role: 'system',
            content: `Document: ${text.substring(0, 2000)}\n\nAnswer questions about this document briefly.`
          },
          ...history.slice(-2), // Only last 2 messages for Qwen
          {
            role: 'user',
            content: question
          }
        ]
      : [
          {
            role: 'system',
            content: `You are a knowledgeable teaching assistant helping students understand a document. Be clear, accurate, and helpful.

DOCUMENT CONTENT:
${text.substring(0, 5000)}

INSTRUCTIONS:
- Answer questions based on the document
- Provide clear, detailed explanations
- Use examples when helpful
- If information isn't in the document, say so
- Be encouraging and supportive`
          },
          ...history,
          {
            role: 'user',
            content: question
          }
        ];

    const result = await aiProvider.chat(messages);
    console.log(`✅ [AI] Chat response generated`);
    return result;
  }

  private parseJSON<T>(response: string, fallback: T): T {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Extract JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return fallback;
    } catch (error) {
      console.error('JSON parse error:', error);
      return fallback;
    }
  }

  // Fallback methods for when AI fails
  generateFallbackMindMap(text: string): MindMapNode {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = text.split(/\s+/);
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 4) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });
    
    const keyTerms = Object.entries(wordFreq)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
    
    return {
      id: 'root',
      label: 'Document Analysis',
      children: [
        {
          id: '1',
          label: 'Introduction & Overview',
          children: [
            { id: '1.1', label: sentences[0]?.substring(0, 60) || 'Opening statement' },
            { id: '1.2', label: sentences[1]?.substring(0, 60) || 'Context' }
          ]
        },
        {
          id: '2',
          label: 'Key Topics',
          children: keyTerms.slice(0, 4).map((term, i) => ({
            id: `2.${i + 1}`,
            label: term.charAt(0).toUpperCase() + term.slice(1),
            children: [
              { id: `2.${i + 1}.1`, label: `Details about ${term}` }
            ]
          }))
        },
        {
          id: '3',
          label: 'Main Content',
          children: sentences.slice(2, 5).map((sent, i) => ({
            id: `3.${i + 1}`,
            label: sent.substring(0, 60) + (sent.length > 60 ? '...' : '')
          }))
        },
        {
          id: '4',
          label: 'Additional Insights',
          children: keyTerms.slice(4, 8).map((term, i) => ({
            id: `4.${i + 1}`,
            label: term.charAt(0).toUpperCase() + term.slice(1)
          }))
        }
      ]
    };
  }

  generateFallbackAudio(text: string): string {
    const preview = text.substring(0, 200);
    return `This document discusses: ${preview}... The content covers various important topics and provides detailed information on the subject matter.`;
  }

  generateFallbackVideo(text: string): string {
    return `Scene 1: Opening - Introduction to the document topic.\nScene 2: Main content - Key points and details.\nScene 3: Conclusion - Summary and takeaways.`;
  }

  generateFallbackFlashcards(text: string): Flashcard[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 8);
    return sentences.map((sentence, i) => ({
      id: `${i + 1}`,
      question: `What does the document say about: ${sentence.substring(0, 50)}...?`,
      answer: sentence.trim()
    }));
  }

  generateFallbackQuiz(text: string): QuizQuestion[] {
    const words = text.split(/\s+/);
    return [
      {
        id: '1',
        question: 'What is the main topic of this document?',
        options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
        correctAnswer: 0,
        explanation: 'Based on the document content'
      },
      {
        id: '2',
        question: 'Which of the following is mentioned in the document?',
        options: [words[10] || 'Content', words[20] || 'Information', words[30] || 'Details', words[40] || 'Data'],
        correctAnswer: 0,
        explanation: 'This appears in the document text'
      }
    ];
  }
}

export default new AIService();
