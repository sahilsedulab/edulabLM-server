import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiService {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate(prompt: string, retries = 3): Promise<string> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    
    console.log(`\n🤖 [Gemini] Generating content...`);
    console.log(`   Model: ${GEMINI_MODEL}`);
    console.log(`   Prompt length: ${prompt.length} characters`);
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await axios.post(
          `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          },
          {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        console.log(`✅ [Gemini] Generation completed in ${duration}s`);
        console.log(`   Response length: ${generatedText.length} characters`);
        
        return generatedText;
      } catch (error: any) {
        if (error.response?.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⚠️  [Gemini] Rate limit hit (429). Retrying in ${waitTime / 1000}s... (Attempt ${attempt}/${retries})`);
          await this.delay(waitTime);
          continue;
        }
        
        console.error(`\n❌ [Gemini] Generation failed!`);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Error: ${JSON.stringify(error.response.data)}`);
          
          if (error.response.status === 429) {
            console.error(`   💡 Tip: You've hit the API rate limit. Wait a minute or upgrade your API plan.`);
          }
        } else {
          console.error(`   Error: ${error.message}`);
        }
        throw new Error(`Failed to generate content: ${error.message}`);
      }
    }
    
    throw new Error('Failed to generate content after multiple retries');
  }

  async chat(messages: { role: string; content: string }[], retries = 3): Promise<string> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    
    console.log(`\n💬 [Gemini] Chat request...`);
    console.log(`   Model: ${GEMINI_MODEL}`);
    console.log(`   Messages: ${messages.length}`);
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
      
      // Convert messages to Gemini format
      const contents = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
      
      // Add system message as first user message if exists
      const systemMsg = messages.find(msg => msg.role === 'system');
      if (systemMsg) {
        contents.unshift({
          role: 'user',
          parts: [{ text: systemMsg.content }]
        });
      }
      
      const response = await axios.post(
        `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        console.log(`✅ [Gemini] Chat completed in ${duration}s`);
        
        return generatedText;
      } catch (error: any) {
        if (error.response?.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⚠️  [Gemini] Rate limit hit (429). Retrying in ${waitTime / 1000}s... (Attempt ${attempt}/${retries})`);
          await this.delay(waitTime);
          continue;
        }
        
        console.error(`\n❌ [Gemini] Chat failed!`);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Error: ${JSON.stringify(error.response.data)}`);
          
          if (error.response.status === 429) {
            console.error(`   💡 Tip: You've hit the API rate limit. Wait a minute or upgrade your API plan.`);
          }
        } else {
          console.error(`   Error: ${error.message}`);
        }
        throw new Error(`Failed to chat: ${error.message}`);
      }
    }
    
    throw new Error('Failed to chat after multiple retries');
  }
}

export default new GeminiService();
