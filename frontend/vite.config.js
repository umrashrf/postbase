import { defineConfig, transformWithEsbuild } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        preact({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
        tailwindcss(),
    ],
    optimizeDeps: {
        exclude: [],
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});