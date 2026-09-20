// scripts/debugOcr.js
import { extractFromImage } from '../src/utils/fixtureExtractor.js';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Provide image path');
  process.exit(1);
}

extractFromImage(imagePath).then(result => {
  console.log('Parsed result:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err);
});

// Directly run OCR and output raw text for debugging
import { createWorker } from 'tesseract.js';
(async () => {
  const worker = await createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(imagePath);
  console.log('---RAW OCR TEXT---');
  console.log(text);
  await worker.terminate();
})();
