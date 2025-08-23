import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    domains: ['3.downloader.disk.yandex.ru'],
    // or if you're using newer Next.js versions (v12+), use:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '3.downloader.disk.yandex.ru',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;
