import express from 'express';
import aiProvider from '../services/ai-provider.service';

const router = express.Router();

// Get current AI provider
router.get('/provider', (req, res) => {
  const info = aiProvider.getProviderInfo();
  res.json({
    currentProvider: process.env.AI_PROVIDER || 'gemini',
    ...info
  });
});

// Set AI provider
router.post('/provider', (req, res) => {
  const { provider } = req.body;
  
  if (provider !== 'gemini' && provider !== 'ollama') {
    return res.status(400).json({ error: 'Invalid provider. Must be "gemini" or "ollama"' });
  }
  
  process.env.AI_PROVIDER = provider;
  const info = aiProvider.getProviderInfo();
  
  console.log(`\n🔄 [Settings] AI Provider switched to: ${provider.toUpperCase()}`);
  
  res.json({
    success: true,
    currentProvider: provider,
    ...info
  });
});

export default router;
