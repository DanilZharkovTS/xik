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
