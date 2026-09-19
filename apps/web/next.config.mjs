/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared workspace package
  transpilePackages: ['@sahaj/shared'],

  // Strict mode for catching React issues early
  reactStrictMode: true,

  // Disable the X-Powered-By header
  poweredByHeader: false,

  // Custom headers for security
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },

  // Webpack: handle GLSL shader files for Three.js & resolve .js imports to .ts for TypeScript packages
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };

    config.module = config.module ?? { rules: [] };
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['three', 'motion'],
  },

  // Proxy /api/* to backend server (prevents cross-origin CORS & preflight blocking)
  async rewrites() {
    const rawUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://python-hackathon-web-service.onrender.com';
    const baseUrl = rawUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
