import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {workspaceFiles} from '../workspace-files.mjs';

export default defineConfig({
  publicDir: fileURLToPath(new URL('../../LLM-show-classic/ai-workspace/runtime', import.meta.url)),
  // Vite's public-file inventory can lag newly generated, ignored assets.
  // Resolve this controlled runtime directory dynamically during review.
  plugins: [workspaceFiles({runtimeRoot:fileURLToPath(new URL('../../LLM-show-classic/ai-workspace/runtime',import.meta.url)),extraRuntimePaths:['assets-classic']})],
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    fs: {allow: [fileURLToPath(new URL('../..', import.meta.url))]},
    watch: {ignored: ['**/ai-workspace/**', '**/results/**', '**/obsoleted/**']},
  },
  preview: {host:'127.0.0.1', port:4173},
});
