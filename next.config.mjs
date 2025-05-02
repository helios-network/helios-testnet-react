/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "src")],
  },
  output: process.env.NEXT_PUBLIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true, // Required for static export
  },
  // Remove trailing slashes for static builds
  trailingSlash: false,
};

export default nextConfig; 