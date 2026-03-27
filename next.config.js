/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['covers.openlibrary.org', 'images-na.ssl-images-amazon.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['bcrypt'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        nock: false,
        'mock-aws-s3': false,
      };
    }
    return config;
  },
}

export default nextConfig
