/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

const nextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  images: { unoptimized: true },
  ...(!isExport ? {
    async rewrites() {
      return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
    },
  } : {}),
};

module.exports = nextConfig;
