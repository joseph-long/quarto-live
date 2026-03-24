import { execSync } from 'child_process';
import path from 'path';

export default function globalSetup() {
  const testSite = path.resolve(__dirname, 'tests', 'site');
  // Clean up quarto_ipynb files left from previous runs
  execSync(
    `find ${testSite} -name '*.quarto_ipynb*' -type f -delete 2>/dev/null || true`,
    { stdio: 'ignore' },
  );
}
