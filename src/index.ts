import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import documentRoutes from './routes/document.routes';
import aiRoutes from './routes/ai.routes';
import settingsRoutes from './routes/settings.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.listen(PORT, () => {
  const aiProvider = process.env.AI_PROVIDER || 'gemini';
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          NotebookLM Server Started Successfully          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Mode: ${aiProvider === 'gemini' ? 'LearnLM (Detailed)' : 'Qwen (Fast)'}`);
  console.log(`⚡ Powered by: Google Gemini 2.0 Flash`);
  console.log(`📚 Model: ${process.env.GEMINI_MODEL || 'LEARN LM'}`);
  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  
  console.log(`\n💡 Toggle between modes:`);
  console.log(`   - LearnLM: Detailed, comprehensive content`);
  console.log(`   - Qwen: Fast, concise responses`);
  console.log(`\n⏳ Waiting for requests...\n`);
});
