import type { NextConfig } from "next";

// Розділи сайту, що живуть під [locale]. Англійська без префікса: /products показується з /en/products.
const LOCALIZED_ROOTS = [
  'products',
  'ai',
  'services',
  'agents',
  'success',
  'auth',
  'admin',
  'outreach',
  'dashboard',
  'account',
  'blog',
]

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/en' },
        ...LOCALIZED_ROOTS.map((root) => ({
          source: `/${root}/:path*`,
          destination: `/en/${root}/:path*`,
        })),
        ...LOCALIZED_ROOTS.map((root) => ({ source: `/${root}`, destination: `/en/${root}` })),
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async redirects() {
    return [
      // Англійська без префікса: /en/... веде на канонічну адресу.
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
      {
        source: '/about',
        destination: '/#about',
        permanent: false,
      },
      {
        source: '/agents',
        destination: '/ai',
        permanent: true,
      },
      // Moved items redirects
      {
        source: '/ai/chpokai',
        destination: '/products/chpokai',
        permanent: false,
      },
      {
        source: '/ai/ai-execution-advisor',
        destination: '/products/ai-execution-advisor',
        permanent: false,
      },
      {
        source: '/services/key-service',
        destination: '/products/key-service',
        permanent: false,
      },
      {
        source: '/agents/chpokai',
        destination: '/products/chpokai',
        permanent: false,
      },
      {
        source: '/agents/ai-execution-advisor',
        destination: '/products/ai-execution-advisor',
        permanent: false,
      },
      {
        source: '/ai/telegram-chatbot-ai',
        destination: '/ai/telegram-bot-ai',
        permanent: false,
      },
      {
        source: '/ai/web-chat-ai',
        destination: '/ai/web-widget-ai',
        permanent: false,
      },
      {
        source: '/ai/web-chatbot-ai',
        destination: '/ai/web-widget-ai',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
