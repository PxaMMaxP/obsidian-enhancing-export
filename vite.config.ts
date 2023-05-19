import { defineConfig, loadEnv, Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { exec } from 'child_process';
import builtins from 'builtin-modules';
import path from 'path';
import * as fsp from 'fs/promises';



const banner =`
/*!
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository https://github.com/mokeyish/obsidian-enhancing-export .
*/
`;


export default defineConfig(async ({ mode }) => {
  const { resolve, normalize } = path;
  const { rm } = fsp;
  const prod = mode === 'production';

  let { OUT_DIR } = loadEnv(mode, process.cwd(), ['OUT_']);

  await rm('dist', { force: true, recursive: true });
  OUT_DIR = normalize(OUT_DIR);
  if (OUT_DIR != 'dist' && OUT_DIR != path.join(process.cwd(), 'dist')) {
    exec(process.platform === 'win32'? `mklink /J dist ${OUT_DIR}` : `ln -s ${OUT_DIR} dist`);
  }

  return {
    plugins: [
      viteStaticCopy({
        targets: [{
          src: 'manifest.json',
          dest: '.'
        }]
      }),
      loader({ '.lua': 'binary' }),
      prod ? undefined : inject(['src/hmr.ts']),
    ],
    resolve: {
      alias: {
        'lua': resolve(__dirname, './lua')
      },
    },
    build: {
      lib: {
        entry: 'src/main.ts',
        name: 'main',
        fileName: () => 'main.js',
        formats: ['cjs'],
      },
      minify: prod,
      sourcemap: prod ? false : 'inline',
      cssCodeSplit: false,
      // outDir: '',
      rollupOptions: {
        output: {
          exports: 'named',
          assetFileNames: (v) => v.name === 'style.css' ? 'styles.css' : v.name,
          banner,
        },
        external: [
          'obsidian',
          'electron',
          '@codemirror/autocomplete',
          '@codemirror/closebrackets',
          '@codemirror/collab',
          '@codemirror/commands',
          '@codemirror/comment',
          '@codemirror/fold',
          '@codemirror/gutter',
          '@codemirror/highlight',
          '@codemirror/history',
          '@codemirror/language',
          '@codemirror/lint',
          '@codemirror/matchbrackets',
          '@codemirror/panel',
          '@codemirror/rangeset',
          '@codemirror/rectangular-selection',
          '@codemirror/search',
          '@codemirror/state',
          '@codemirror/stream-parser',
          '@codemirror/text',
          '@codemirror/tooltip',
          '@codemirror/view',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/lr',
          ...builtins
        ],
      },
    }
  };
});


const loader = (config: { [extention: string]: 'binary' }): Plugin => {
  const { extname } = path;
  return {
    name: 'binary-boader',
    enforce: 'pre',
    async load(id) {
      const format = config[extname(id)];
      if (format) {
        if (format === 'binary') {
          const buffer = await fsp.readFile(id);
          return {
            code: `export default Uint8Array.from(atob('${buffer.toString('base64')}'), c => c.charCodeAt(0));`
          };
        }
      }
    },
  };
};


const inject = (files: string[]): Plugin => {
  if (files && files.length > 0) {
    return {
      name: 'inject-code',
      async load(this, id) {
        const info = this.getModuleInfo(id);
        if (info.isEntry) {
          const code = await fsp.readFile(id, 'utf-8');
          const { relative, dirname, basename, extname, join } = path;
          const dir = dirname(id);
          const inject_code = files
            .map(v => relative(dir, v))
            .map(p => join('./', basename(p, extname(p))))
            .map(p => `import './${p}'`).join(';');
          return `
          ${inject_code};
          ${code}
          `;
        }
      },
    };
  }
};