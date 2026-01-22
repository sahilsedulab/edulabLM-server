import axios from 'axios';

const getOllamaUrl = () => process.env.OLLAMA_URL || 'http://localhost:11434';
const getModel = () => process.env.OLLAMA_MODEL || 'qwen2.5:latest';

export class OllamaService {
  async generate(prompt: string): Promise<string> {
    const OLLAMA_URL = getOllamaUrl();
    const MODEL = getModel();
    
    console.log(`\n🤖 [Ollama] Generating content...`);
    console.log(`   Model: ${MODEL}`);
    console.log(`   Prompt length: ${prompt.length} characters`);
    console.log(`   Ollama URL: ${OLLAMA_URL}/api/generate`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 512, // Limit response length for speed
          }
        },
        {
          timeout: 300000, // 5 minute timeout for content generation
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [Ollama] Generation completed in ${duration}s`);
      console.log(`   Response length: ${response.data.response.length} characters`);
      
      return response.data.response;
    } catch (error: any) {
      console.error(`\n❌ [Ollama] Generation failed!`);
      if (error.code === 'ECONNREFUSED') {
        console.error(`   Error: Cannot connect to Ollama at ${OLLAMA_URL}`);
        console.error(`   Make sure Ollama is running: ollama serve`);
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.error(`   Error: Request timed out after 5 minutes`);
        console.error(`   Ollama may be overloaded or the model is too slow. Try again in a moment.`);
      } else if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
      }
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const OLLAMA_URL = getOllamaUrl();
    const MODEL = getModel();
    
    console.log(`\n💬 [Ollama] Chat request...`);
    console.log(`   Model: ${MODEL}`);
    console.log(`   Messages: ${messages.length}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        {
          model: MODEL,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 256, // Shorter responses for chat
          }
        },
        {
          timeout: 120000, // 2 minute timeout for chat
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [Ollama] Chat completed in ${duration}s`);
      
      return response.data.message.content;
    } catch (error: any) {
      console.error(`\n❌ [Ollama] Chat failed!`);
      if (error.code === 'ECONNREFUSED') {
        console.error(`   Error: Cannot connect to Ollama at ${OLLAMA_URL}`);
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.error(`   Error: Request timed out`);
      } else if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      throw new Error(`Failed to chat: ${error.message}`);
    }
  }
}

export default new OllamaService();
