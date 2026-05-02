import { defineConfig, transformWithEsbuild } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    server: {
        port: 5174,
    },
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