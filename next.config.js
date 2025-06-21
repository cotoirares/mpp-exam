/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ['ui-avatars.com'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
    ],
  },
  // WebSocket support configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure socket.io-client works in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        request: false,
      };
    }
    return config;
  },
  // Reduce build-time optimizations that might cause fetch aborts
  experimental: {
    turbo: {
      resolveAlias: {
        // Help with module resolution
      },
    },
  },
};

export default config;
