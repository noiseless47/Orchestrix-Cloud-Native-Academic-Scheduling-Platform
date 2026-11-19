/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
