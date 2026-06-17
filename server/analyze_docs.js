import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function analyzeImage(imgPath) {
  const base64Image = fs.readFileSync(imgPath).toString('base64');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: 'Extract all text from this image exactly. Especially extract names, surnames, ID numbers, date of birth, nationality, etc.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]}
      ],
      temperature: 0,
      max_tokens: 1000,
    }),
  });
  const data = await response.json();
  console.log(`\n--- ${path.basename(imgPath)} ---`);
  console.log(data.choices?.[0]?.message?.content || data);
}

async function run() {
  const dir = '/Users/gaonemolefi/.gemini/antigravity-ide/brain/086d2923-c600-4955-a9aa-71e890deeb62/';
  await analyzeImage(path.join(dir, 'doc_buyer_Joshua.pdf.jpeg'));
  await analyzeImage(path.join(dir, 'doc_seller_Passport_Winfred.pdf.jpeg'));
}
run();
