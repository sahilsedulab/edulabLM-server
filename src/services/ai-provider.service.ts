import geminiService from './gemini.service';
import ollamaService from './ollama.service';

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

export class AIProviderService {
  async generate(prompt: string): Promise<string> {
    const provider = process.env.AI_PROVIDER || AI_PROVIDER;

    if (provider === 'ollama') {
      console.log(`\n🤖 [AI Provider] Using: OLLAMA (Qwen 2.5)`);
      return await ollamaService.generate(prompt);
    }

    console.log(`\n🤖 [AI Provider] Using: QWEN 2.5`);
    return await geminiService.generate(prompt);
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const provider = process.env.AI_PROVIDER || AI_PROVIDER;

    if (provider === 'ollama') {
      console.log(`\n💬 [AI Provider] Using: OLLAMA (Qwen 2.5)`);
      return await ollamaService.chat(messages);
    }

    console.log(`\n💬 [AI Provider] Using: QWEN 2.5`);
    return await geminiService.chat(messages);
  }

  getProviderInfo(): { provider: string; model: string } {
    const provider = process.env.AI_PROVIDER || AI_PROVIDER;

    if (provider === 'gemini') {
      return {
        provider: 'Qwen 2.5',
        model: 'Qwen2.5-32B-Instruct'
      };
    } else {
      return {
        provider: 'Qwen 2.5 (Fast Mode)',
        model: 'Powered Qwen2.5'
      };
    }
  }
}

export default new AIProviderService();
