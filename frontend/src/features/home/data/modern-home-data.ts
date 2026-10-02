export interface ModernProduct {
  id: string
  slug: string
  label: string
  title: string
  description: string
  href: string
}

export interface ModernAiCard {
  id: string
  slug: string
  number: string
  category: string
  title: string
  description: string
  status: 'active' | 'build'
  href: string
}

export interface ModernService {
  slug: string
  title: string
  description: string
  href: string
}

export interface ModernPrinciple {
  number: string
  title: string
}

export const MODERN_PRODUCTS: ModernProduct[] = [
  {
    id: 'keyho',
    slug: 'keyho',
    label: 'Product · PropTech · Production',
    title: 'Keyho',
    description:
      'Property operations platform connecting owners, managers and workers across apartments, tasks, services, communication and operational workflows.',
    href: '/products/keyho',
  },
  {
    id: 'telemetry-hub',
    slug: 'telemetry-hub',
    label: 'Product · Observability · Infrastructure',
    title: 'Telemetry Hub',
    description:
      'Reusable observability platform that unifies metrics, logs, traces and alerting for independent Docker Compose projects in one operational stack.',
    href: '/products/telemetry-hub',
  },
  {
    id: 'job-follow',
    slug: 'job-follow',
    label: 'Product · Market Intelligence · Automation',
    title: 'Job Follow',
    description:
      'News distribution, Telegram lead monitoring, IT job discovery and market intelligence connected through independent automated delivery pipelines.',
    href: '/products/job-follow',
  },
  {
    id: 'chpokai',
    slug: 'chpokai',
    label: 'Product · AI Security · Active',
    title: 'Chpokai',
    description:
      'Authorized AI-agent security and acceptance testing platform for controlled scans, behavioral validation and machine-readable security evidence.',
    href: '/products/chpokai',
  },
  {
    id: 'ai-execution-advisor',
    slug: 'ai-execution-advisor',
    label: 'Product · LLM Operations · Active',
    title: 'AI Execution Advisor',
    description:
      'Observes organization-scoped AI workloads, analyzes execution cost and quality, and produces evidence-based optimization recommendations with guarded experiments.',
    href: '/products/ai-execution-advisor',
  },
  {
    id: 'key-service',
    slug: 'key-service',
    label: 'Product · Licensing · Production',
    title: 'Key Service',
    description:
      'Go/PostgreSQL licensing infrastructure for product activation, device-bound verification, entitlements, lifecycle management and audited administration.',
    href: '/products/key-service',
  },
]

export const MODERN_AI_CARDS: ModernAiCard[] = [
  {
    id: 'activity-simulator',
    slug: 'activity-simulator',
    number: '01',
    category: 'Desktop AI · Automation',
    title: 'Activity Simulator',
    description:
      'Native desktop application orchestrating realistic mouse, keyboard, scrolling, window and scenario behavior through configurable profiles and schedules.',
    status: 'active',
    href: '/ai/activity-simulator',
  },
  {
    id: 'build-runner',
    slug: 'build-runner',
    number: '02',
    category: 'Desktop AI · Copilot',
    title: 'Build Runner',
    description:
      'Cross-platform desktop copilot combining real-time audio, screen context, stealth HUD overlay and flexible BYOK model routing.',
    status: 'active',
    href: '/ai/build-runner',
  },
  {
    id: 'agent-platform',
    slug: 'agent-platform',
    number: '03',
    category: 'AI Platform · Multi-Agent',
    title: 'Agent Platform',
    description:
      'Multi-tenant control plane for agents, conversations, runs, knowledge, tools, quotas and cross-runtime delegation across web, Telegram, voice and media channels.',
    status: 'active',
    href: '/ai/agent-platform',
  },
  {
    id: 'web-widget-ai',
    slug: 'web-widget-ai',
    number: '04',
    category: 'Web AI · Chatbot',
    title: 'Web Widget Support AI',
    description:
      'Embeddable intelligent website chat widget with streaming answers, documentation grounding, and automated lead capture.',
    status: 'active',
    href: '/ai/web-widget-ai',
  },
  {
    id: 'telegram-bot-ai',
    slug: 'telegram-bot-ai',
    number: '05',
    category: 'Telegram AI · Chatbot',
    title: 'Telegram Support AI',
    description:
      'Interactive conversational assistant for Telegram groups and private chats with custom tools, voice transcription, and CRM integration.',
    status: 'active',
    href: '/ai/telegram-bot-ai',
  },
  {
    id: 'voice-ai',
    slug: 'voice-ai',
    number: '06',
    category: 'Voice AI',
    title: 'Voice AI',
    description:
      'Realtime conversational agents for voice and telephony workflows, with controlled model execution and speech pipelines.',
    status: 'build',
    href: '/ai/voice-ai',
  },
  {
    id: 'video-ai',
    slug: 'video-ai',
    number: '07',
    category: 'Generative AI',
    title: 'Video AI',
    description:
      'Visual-media and synthetic presentation workflows for AI-driven video and avatar experiences.',
    status: 'build',
    href: '/ai/video-ai',
  },
  {
    id: 'telegram-ai',
    slug: 'telegram-ai',
    number: '08',
    category: 'Monitoring AI',
    title: 'Telegram AI',
    description:
      'Autonomous Telegram monitoring, classification and alert workflows for leads, signals and targeted information delivery.',
    status: 'active',
    href: '/ai/telegram-ai',
  },
]

export const MODERN_SERVICES: ModernService[] = [
  {
    slug: 'ai-development',
    title: 'AI Development',
    description:
      'Autonomous agents, RAG/KAG retrieval engines, hybrid rule-based + LLM pipelines, and production multi-model routing.',
    href: '/services/ai-development',
  },
  {
    slug: 'ai-security-audit',
    title: 'AI Security & Auditing',
    description:
      'Adversarial agent evaluation, prompt injection defense, tool execution sandboxing, and telemetry-based side-effect audits.',
    href: '/services/ai-security-audit',
  },
  {
    slug: 'fintech-escrow',
    title: 'FinTech & Escrow Systems',
    description:
      'Escrow engines, double-entry internal ledgers, wallet holds, tiered KYC/AML, fraud checks, and dispute resolution workflows.',
    href: '/services/fintech-escrow',
  },
  {
    slug: 'backend-engineering',
    title: 'Backend Engineering',
    description:
      'High-concurrency Go worker fleets, Laravel modular monoliths, RabbitMQ transactional outbox, and resilient event architectures.',
    href: '/services/backend-engineering',
  },
  {
    slug: 'identity-integrations',
    title: 'Identity & Keycloak SSO',
    description:
      'Enterprise Keycloak SSO migrations, OIDC, SAML 2.0, multi-app identity synchronization, JWT/JWKS, and multi-tenant RBAC.',
    href: '/services/identity-integrations',
  },
  {
    slug: 'observability-operations',
    title: 'Observability & OpenTelemetry',
    description:
      'Full OTLP telemetry stack with Grafana, Prometheus, Loki, Tempo, and Alloy — eliminating expensive Datadog SaaS bills.',
    href: '/services/observability-operations',
  },
  {
    slug: 'legacy-modernization',
    title: 'Legacy Modernization',
    description:
      'Deconstructing legacy PHP/Laravel monoliths into modern services, cutting cloud costs by 50%, and automating support operations.',
    href: '/services/legacy-modernization',
  },
  {
    slug: 'architecture-consulting',
    title: 'Architecture & Consulting',
    description:
      'System design reviews, ADR blueprints, database query tuning (+20% throughput), bottleneck elimination, and engineering standards.',
    href: '/services/architecture-consulting',
  },
]

export const RESEARCH_PILLS = [
  'OpenTelemetry',
  'Keycloak SSO',
  'Escrow Ledgers',
  'RAG & KAG',
  'Go Workers',
  'Agent Security',
  'Prompt Defense',
  'RabbitMQ Outbox',
] as const

export const MODERN_PRINCIPLES: ModernPrinciple[] = [
  { number: '01', title: 'Start with the problem.' },
  { number: '02', title: "Engineer, don't improvise." },
  { number: '03', title: 'AI should work.' },
  { number: '04', title: 'Build once. Scale forever.' },
]
