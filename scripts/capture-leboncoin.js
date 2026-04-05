import { runLeboncoinCapture } from '../server/utils/leboncoinCapture.js';

try {
  const capture = await runLeboncoinCapture();
  console.log(`Capture terminee: ${capture.id}`);
  console.log(`Segments: ${capture.items.length}`);
} catch (error) {
  console.error('Erreur lors de la capture Leboncoin:', error);
  process.exit(1);
}
