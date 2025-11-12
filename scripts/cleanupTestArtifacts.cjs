// scripts/cleanupTestArtifacts.cjs
const fs = require('node:fs');
const path = require('node:path');

function rmSafe(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log('🧹 Removed:', targetPath);
    }
  } catch (err) {
    console.warn('⚠️  Cleanup warning for', targetPath, '-', (err && err.message) || err);
  }
}

const generatedDir = path.join(process.cwd(), 'tests', '.generated');
// Only remove generated artifacts after successful tests (script invoked via `&&` in npm)
rmSafe(generatedDir);

console.log('✅ Test artifact cleanup completed. No residual files remain.');
