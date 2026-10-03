import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
