// scripts/runExtractor.js
import { extractFixtureInfo } from '../src/utils/fixtureExtractor.js';

const source = process.argv[2];
if (!source) {
  console.error('Please provide a source (image path or Instagram URL)');
  process.exit(1);
}

extractFixtureInfo(source).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error extracting fixture:', err);
  process.exit(1);
});
