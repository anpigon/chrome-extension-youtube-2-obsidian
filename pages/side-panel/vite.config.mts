import { resolve } from 'node:path';
import { withPageConfig } from '@extension/vite-config';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');
const packagesDir = resolve(rootDir, '..', '..', 'packages');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
      '@packages': packagesDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'side-panel'),
  },
});
