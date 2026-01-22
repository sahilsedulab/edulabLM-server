import pdf from 'pdf-parse';
import fs from 'fs/promises';

export class PDFService {
  async extractText(filePath: string): Promise<string> {
    console.log(`\n📄 [PDF] Extracting text from: ${filePath}`);
    
    try {
      const startTime = Date.now();
      const dataBuffer = await fs.readFile(filePath);
      console.log(`   File size: ${(dataBuffer.length / 1024).toFixed(2)} KB`);
      
      const data = await pdf(dataBuffer);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ [PDF] Extraction completed in ${duration}s`);
      console.log(`   Pages: ${data.numpages}`);
      console.log(`   Text length: ${data.text.length} characters`);
      
      return data.text;
    } catch (error) {
      console.error(`\n❌ [PDF] Extraction failed!`);
      console.error(`   Error:`, error);
      throw new Error('Failed to extract text from PDF');
    }
  }
}

export default new PDFService();
