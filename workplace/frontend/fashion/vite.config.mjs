import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {workspaceFiles} from '../workspace-files.mjs';

export default defineConfig({
  publicDir: fileURLToPath(new URL('../../LLM-show-fashion/ai-workspace/runtime', import.meta.url)),
  // Generated assets are served directly: Vite's public-file index does not
  // notice new frozen rounds while the large runtime tree is watch-ignored.
  plugins: [workspaceFiles({runtimeRoot:fileURLToPath(new URL('../../LLM-show-fashion/ai-workspace/runtime', import.meta.url))})],
  server: {
    host:'127.0.0.1', port:6187, strictPort:true,
    fs: {allow: [fileURLToPath(new URL('../..', import.meta.url))]},
    watch: {ignored: ['**/ai-workspace/**', '**/results/**', '**/obsoleted/**']},
  },
  build: {outDir:'dist', emptyOutDir:true},
});
