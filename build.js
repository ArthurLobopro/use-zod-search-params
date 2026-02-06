const esbuild = require('esbuild');

const baseConfig = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2020'],
    tsconfig: 'tsconfig.json',
    external: ['react-router-dom', 'zod'],
};

async function build() {
    try {
        await esbuild.build({
            ...baseConfig,
            format: 'esm',
            outfile: 'dist/index.mjs',
        });

        await esbuild.build({
            ...baseConfig,
            format: 'cjs',
            outfile: 'dist/index.cjs',
        });

        console.log('✅ Build concluído com sucesso!');
    } catch (error) {
        console.error('❌ Falha no build:', error);
        process.exit(1);
    }
}

build();