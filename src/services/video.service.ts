import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface VideoScene {
  title: string;
  content: string;
  duration: number;
}

export class VideoService {
  private outputDir = 'uploads/videos';

  constructor() {
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async generateVideo(script: string, documentId: string): Promise<string> {
    console.log(`\n🎬 [Video] Generating video for document ${documentId}...`);
    
    try {
      // Parse script into scenes
      const scenes = this.parseScript(script);
      console.log(`   Parsed ${scenes.length} scenes`);
      
      // Generate frames for each scene
      const frames: string[] = [];
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        console.log(`   Generating scene ${i + 1}/${scenes.length}: ${scene.title}`);
        const framePath = await this.generateFrame(scene, i, documentId);
        frames.push(framePath);
      }
      
      // For now, return the first frame as a preview
      // In production, you'd use ffmpeg to combine frames into video
      console.log(`✅ [Video] Generated ${frames.length} frames`);
      
      return frames[0];
    } catch (error: any) {
      console.error(`❌ [Video] Generation failed: ${error.message}`);
      throw error;
    }
  }

  private parseScript(script: string): VideoScene[] {
    const scenes: VideoScene[] = [];
    
    // Split by scene markers or paragraphs
    const lines = script.split('\n').filter(line => line.trim());
    
    let currentScene: VideoScene | null = null;
    
    for (const line of lines) {
      if (line.match(/^Scene \d+:/i) || line.match(/^Introduction:|^Main Content:|^Conclusion:/i)) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          title: line.replace(/^Scene \d+:\s*/i, '').trim(),
          content: '',
          duration: 5
        };
      } else if (currentScene) {
        currentScene.content += line + ' ';
      } else {
        // First line without scene marker
        currentScene = {
          title: 'Introduction',
          content: line + ' ',
          duration: 5
        };
      }
    }
    
    if (currentScene) {
      scenes.push(currentScene);
    }
    
    // If no scenes were parsed, create a single scene
    if (scenes.length === 0) {
      scenes.push({
        title: 'Overview',
        content: script,
        duration: 10
      });
    }
    
    return scenes;
  }

  private async generateFrame(scene: VideoScene, index: number, documentId: string): Promise<string> {
    const width = 1280;
    const height = 720;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const colors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140']
    ];
    const colorPair = colors[index % colors.length];
    gradient.addColorStop(0, colorPair[0]);
    gradient.addColorStop(1, colorPair[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.8, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Scene number badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(100, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colorPair[0];
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, 100, 100);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const titleY = height * 0.3;
    this.wrapText(ctx, scene.title, width / 2, titleY, width - 200, 70);
    
    // Content
    ctx.font = '32px Arial';
    ctx.shadowBlur = 5;
    const contentY = height * 0.5;
    const wrappedContent = scene.content.substring(0, 200) + (scene.content.length > 200 ? '...' : '');
    this.wrapText(ctx, wrappedContent, width / 2, contentY, width - 300, 45);
    
    // Footer
    ctx.shadowBlur = 0;
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('AI Generated Educational Content', width / 2, height - 50);
    
    // Save frame
    const filename = `video-${documentId}-frame-${index}.png`;
    const filepath = path.join(this.outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    await writeFile(filepath, buffer);
    
    return filepath;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  getVideoUrl(filepath: string): string {
    return filepath.replace('uploads/', '/uploads/');
  }
}

export default new VideoService();
