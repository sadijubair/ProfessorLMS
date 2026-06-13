/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/google/start',
        destination: '/api/auth/google-start',
      },
      {
        source: '/api/auth/google/callback',
        destination: '/api/auth/google-callback',
      },
    ];
  },
};

export default nextConfig
