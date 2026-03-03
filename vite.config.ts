import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 엔진의 require('collections/sorted-set') → ESM import로 변환
// (engine 소스는 수정 금지 규칙이므로 빌드 단계에서 패치)
const fixEngineRequire: Plugin = {
  name: 'fix-engine-require',
  enforce: 'pre',
  transform(code: string, id: string) {
    if (!id.includes('engine/triples')) return;
    return (
      `import SortedSet from 'collections/sorted-set';\n` +
      code
        .replace(/declare var require: any;\s*\n?/g, '')
        .replace(/let SortedSet = require\(['"]collections\/sorted-set['"]\);\s*\n?/g, '')
    );
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fixEngineRequire],
})
