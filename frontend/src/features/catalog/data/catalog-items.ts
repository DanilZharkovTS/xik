import type { Locale } from '@/src/shared/i18n/i18n-store'
import { SERVICE_TRANSLATIONS } from './service-translations'

export type CatalogItemType = 'product' | 'agent' | 'service'

export interface CatalogCapability {
  title: string
  description: string
}

export interface CatalogItem {
  id: string
  slug: string
  type: CatalogItemType
  typeLabel: string
  title: string
  subtitle: string
  category: string
  status: 'production' | 'active' | 'beta' | 'build'
  statusLabel: string
  description: string
  tagline: string
  highlights: string[]
  capabilities: CatalogCapability[]
  architecture: {
    stack: string[]
    runtime: string
    deployment: string
    latency: string
  }
  protocols: string[]
  demoUrl?: string
}

// Статичні тут лише послуги. Продукти й агенти живуть у БД (бекенд, Stripe) і читаються через API:
// див. catalog-api.ts і catalog-product.ts.
export const CATALOG_ITEMS: Record<string, CatalogItem> = {
  // --- SERVICES ---
  'ai-development': {
    id: 'ai-development',
    slug: 'ai-development',
    type: 'service',
    typeLabel: 'Engineering Service',
    title: 'AI Development',
    subtitle: 'Autonomous agents, RAG/KAG engines, and production-grade LLM architectures.',
    category: 'AI & Multi-Agent Systems',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'From experimental prompt to hardened, audited production AI systems.',
    description:
      'Full-cycle engineering of tailored autonomous agents, hybrid rule-based and LLM classification pipelines, vector search (PGVector / Qdrant), and cost-bounded model routing. We build deterministic AI workflows that operate with measurable business ROI.',
    highlights: ['Hybrid Rule + LLM', 'Cost & Token Budgeting', 'Multi-Model Routing'],
    capabilities: [
      {
        title: 'Multi-Agent Workflows',
        description: 'Orchestrated autonomous agent swarms with human-in-the-loop review queues and execution budgets.',
      },
      {
        title: 'Enterprise RAG & KAG',
        description: 'Hybrid retrieval with vector search, precise chunking, and strict grounded answer citations.',
      },
      {
        title: 'Multi-Model Routing & BYOK',
        description: 'Smart routing across Claude 3.7, Gemini 2.0, DeepSeek, and OpenAI to balance cost and latency.',
      },
      {
        title: 'Structured Output Pipelines',
        description: 'Deterministic JSON schema outputs with runtime validation and automated fallback retries.',
      },
    ],
    architecture: {
      stack: ['Python FastAPI', 'Go Microservices', 'PGVector / Qdrant', 'Temporal Orchestration', 'Redis Cache'],
      runtime: 'Isolated Container Fleet / Serverless GPU',
      deployment: 'Client VPC / Dedicated Cloud',
      latency: '<100ms first-token streaming',
    },
    protocols: ['OpenAI-compatible API', 'WebSocket Streaming', 'REST Webhooks'],
  },

  'ai-security-audit': {
    id: 'ai-security-audit',
    slug: 'ai-security-audit',
    type: 'service',
    typeLabel: 'Security Service',
    title: 'AI Security & Auditing',
    subtitle: 'Adversarial agent evaluation, prompt injection defense, and tool sandboxing.',
    category: 'AI Safety & Security',
    status: 'active',
    statusLabel: 'Available for Audits',
    tagline: 'Hardening autonomous AI agents against unauthorized actions and data leakage.',
    description:
      'Comprehensive security penetration testing and runtime guardrails for AI agents and LLM applications. We evaluate systems against prompt injections, unauthorized tool execution, cross-tenant data leakage, and unsafe side-effects before deployment.',
    highlights: ['Prompt Injection Defense', 'Tool Misuse Isolation', 'SARIF & JUnit Reports'],
    capabilities: [
      {
        title: 'Adversarial Prompt Pentesting',
        description: 'Automated injection scans, jailbreak attempts, and system prompt extraction diagnostics.',
      },
      {
        title: 'Tool & MCP Execution Sandboxing',
        description: 'Strict authorization checks, permission boundaries, and execution cancellation gates for agent tools.',
      },
      {
        title: 'Telemetry-Based Side-Effect Audits',
        description: 'Detects unsafe database writes or external API calls despite safe-looking natural language responses.',
      },
      {
        title: 'Compliance & Audit Deliverables',
        description: 'Machine-readable security evidence with SARIF reporting, risk matrices, and remediation roadmaps.',
      },
    ],
    architecture: {
      stack: ['Python Security Framework', 'Playwright', 'Temporal Workflows', 'SARIF Reporting Engine'],
      runtime: 'Sandboxed Ephemeral Containers',
      deployment: 'Private Client Network / Secure Runner',
      latency: 'Automated CI/CD Scans',
    },
    protocols: ['HTTP/2', 'MCP Protocol', 'SARIF / JUnit', 'CI/CD Actions'],
  },

  'fintech-escrow': {
    id: 'fintech-escrow',
    slug: 'fintech-escrow',
    type: 'service',
    typeLabel: 'FinTech Service',
    title: 'FinTech & Escrow Systems',
    subtitle: 'Escrow engines, double-entry internal ledgers, wallet holds, and anti-fraud rules.',
    category: 'FinTech & Payments',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'Mission-critical financial infrastructure with mathematical ledger integrity.',
    description:
      'Architecture and delivery of production FinTech platforms, escrow engines, multi-tenant digital wallets, and double-entry internal ledgers. Built with immutable audit trails, tiered KYC/AML verification, rule-based fraud detection, and automated dispute resolution.',
    highlights: ['Double-Entry Ledgers', 'Tiered KYC/AML Checks', 'Zero-Loss Escrow Engine'],
    capabilities: [
      {
        title: 'Escrow & Transaction Holds',
        description: 'Conditional fund holding, milestone-based releases, multi-party payouts, and fee splitting.',
      },
      {
        title: 'Double-Entry Internal Ledgers',
        description: 'Strict immutable journal entries guaranteeing wallet balances always balance across accounts.',
      },
      {
        title: 'Tiered KYC/AML & Fraud Guards',
        description: 'Automated risk scoring, rule-based transaction limits, suspicious activity flags, and identity verification.',
      },
      {
        title: 'Dispute & Notary Governance',
        description: 'Admin dispute resolution modules, contract logic simulations, and immutable audit logs.',
      },
    ],
    architecture: {
      stack: ['Go', 'Laravel PHP 8.4', 'PostgreSQL (Acid)', 'Redis', 'RabbitMQ', 'Stripe API'],
      runtime: 'High-availability Isolated Cluster',
      deployment: 'PCI-DSS Compliant Infrastructure / AWS',
      latency: '<15ms transaction commit',
    },
    protocols: ['REST Financial API', 'Idempotent Webhooks', 'mTLS Secure Bridge'],
  },

  'backend-engineering': {
    id: 'backend-engineering',
    slug: 'backend-engineering',
    type: 'service',
    typeLabel: 'Engineering Service',
    title: 'Backend Engineering',
    subtitle: 'Distributed systems, high-concurrency Go worker fleets, and resilient event queues.',
    category: 'Distributed Systems',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'Resilient, high-throughput systems designed to scale without drama.',
    description:
      'Industrial-strength backend engineering using Go, Laravel, PostgreSQL, and RabbitMQ. We design transactional outbox architectures, deduplicated event queues, and high-concurrency worker fleets capable of processing millions of daily tasks.',
    highlights: ['Transactional Outbox', 'Go High-Concurrency Workers', 'Sub-5ms Execution'],
    capabilities: [
      {
        title: 'Transactional Outbox & Event Queues',
        description: 'Guaranteed at-least-once message delivery via RabbitMQ with deduplication and bounded retries.',
      },
      {
        title: 'High-Concurrency Go Daemons',
        description: 'Microservices with sub-5ms response times, minimal memory footprints, and multi-core parallelism.',
      },
      {
        title: 'Database Schema & Query Tuning',
        description: 'PostgreSQL partitioning, indexing strategies, and connection pooling for maximum read/write performance.',
      },
      {
        title: 'Domain-Driven Design (DDD)',
        description: 'Clean bounded contexts, modular monolith boundaries, and maintainable enterprise domain models.',
      },
    ],
    architecture: {
      stack: ['Go 1.24', 'Laravel / PHP 8.4', 'PostgreSQL', 'Redis', 'RabbitMQ'],
      runtime: 'Docker / Kubernetes',
      deployment: 'Any Cloud or Bare Metal',
      latency: 'Sub-5ms typical',
    },
    protocols: ['REST', 'gRPC', 'AMQP (RabbitMQ)', 'WebSocket'],
  },

  'identity-integrations': {
    id: 'identity-integrations',
    slug: 'identity-integrations',
    type: 'service',
    typeLabel: 'Security Service',
    title: 'Identity & Keycloak SSO',
    subtitle: 'Enterprise Keycloak SSO migrations, SAML 2.0, OIDC, and multi-system user provisioning.',
    category: 'Enterprise IAM',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'Frictionless, centralized authentication across all corporate and SaaS systems.',
    description:
      'Production deployment and zero-downtime migration to Keycloak Single Sign-On (SSO). We connect distributed applications (Laravel, Drupal, Node.js, mobile apps) with OpenID Connect (OIDC) and SAML 2.0, implement role-based access control (RBAC), and validate tokens via JWT/JWKS.',
    highlights: ['Keycloak OIDC & SAML 2.0', 'Zero-Downtime Migration', 'JWT / JWKS Token Gates'],
    capabilities: [
      {
        title: 'Keycloak SSO Deployment & Migration',
        description: 'User migration scripts, conflict resolution, custom Keycloak themes, and authenticator SPIs.',
      },
      {
        title: 'Multi-Platform Identity Sync',
        description: 'Synchronizes user identities, profiles, and permissions across disparate applications in real time.',
      },
      {
        title: 'SAML 2.0 & OpenID Connect Federation',
        description: 'Federated login with Google, Microsoft Entra ID, Okta, and enterprise corporate directories.',
      },
      {
        title: 'Granular RBAC & Token Verification',
        description: 'Tenant-scoped permissions, resource policies, and cryptographic JWT/JWKS token signature verification.',
      },
    ],
    architecture: {
      stack: ['Keycloak', 'Go', 'PHP / Laravel', 'PostgreSQL', 'OAuth 2.0 / OIDC / SAML 2.0'],
      runtime: 'Containerized Identity Cluster',
      deployment: 'Private VPC / On-Premise',
      latency: '<10ms token issue',
    },
    protocols: ['OAuth 2.0', 'OpenID Connect (OIDC)', 'SAML 2.0', 'JWKS / JWT'],
  },

  'observability-operations': {
    id: 'observability-operations',
    slug: 'observability-operations',
    type: 'service',
    typeLabel: 'Operations Service',
    title: 'Observability & OpenTelemetry',
    subtitle: 'Self-hosted LGTM stack (Loki, Grafana, Tempo, Prometheus, Alloy) replacing Datadog.',
    category: 'DevOps & SRE',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'Full-spectrum infrastructure visibility without prohibitive SaaS monitoring invoices.',
    description:
      'We replace costly monitoring services (Datadog, NewRelic) with a modern, self-hosted OpenTelemetry (OTLP) stack: Grafana, Prometheus, Loki, Tempo, and Grafana Alloy. Achieve unified metrics, structured logs, distributed traces, and proactive alerting with zero licensing bloat.',
    highlights: ['Full OTLP Telemetry', 'Zero SaaS Cost Inflation', 'Sub-second Trace Ingestion'],
    capabilities: [
      {
        title: 'Datadog to OTLP Migration',
        description: 'Smooth replacement of expensive SaaS APM with Grafana, Loki, Tempo, and Prometheus.',
      },
      {
        title: 'OpenTelemetry (OTLP) Instrumentation',
        description: 'End-to-end distributed tracing across microservices, databases, and background worker queues.',
      },
      {
        title: 'Grafana Alloy & Log Streaming',
        description: 'Unified lightweight collector streaming container logs, host stats, and custom application metrics.',
      },
      {
        title: 'Smart Alertmanager Rules',
        description: 'Noise-free incident alerting routed to Telegram, Slack, or PagerDuty with root-cause links.',
      },
    ],
    architecture: {
      stack: ['OpenTelemetry (OTLP)', 'Grafana Alloy', 'Prometheus', 'Loki', 'Tempo', 'Alertmanager'],
      runtime: 'Lightweight Docker Swarm / Standalone / K8s',
      deployment: 'Self-Hosted / Hybrid Cloud',
      latency: 'Sub-second log ingestion',
    },
    protocols: ['OpenTelemetry Protocol (OTLP)', 'PromQL', 'LogQL', 'TraceQL'],
  },

  'legacy-modernization': {
    id: 'legacy-modernization',
    slug: 'legacy-modernization',
    type: 'service',
    typeLabel: 'Modernization Service',
    title: 'Legacy Modernization',
    subtitle: 'Refactoring legacy PHP/Laravel codebases, cutting server costs by 50% without downtime.',
    category: 'Refactoring & Cloud Optimization',
    status: 'active',
    statusLabel: 'Available for Projects',
    tagline: 'Transform fragile legacy code into maintainable, high-leverage modern systems.',
    description:
      'Safe, incremental modernization of legacy codebases (CodeIgniter, old Laravel/PHP, monolithic architectures). We refactor code using SOLID and DRY principles, decouple critical paths into Go workers, eliminate technical debt, and reduce cloud infrastructure costs by up to 50%.',
    highlights: ['Up to 50% Cloud Cost Cut', 'Zero-Downtime Refactor', '+20% DB Speedup'],
    capabilities: [
      {
        title: 'Monolith to Modular Services',
        description: 'Extract high-load bottlenecks into independent Go/PHP services without halting active business development.',
      },
      {
        title: 'Framework & PHP Upgrades',
        description: 'Proven upgrades from legacy PHP/Laravel/CodeIgniter versions with 100% backward API compatibility.',
      },
      {
        title: 'Infrastructure & Cost Reduction',
        description: 'Right-sizing cloud instances, containerizing workloads, and cutting server expenditure by up to 50%.',
      },
      {
        title: 'Automated Operations & Workflows',
        description: 'Automating manual operational bottlenecks (proven track record saving $250K/year in support overhead).',
      },
    ],
    architecture: {
      stack: ['Laravel', 'Go', 'Docker Compose', 'MySQL / PostgreSQL', 'Redis'],
      runtime: 'Optimized Docker Containers',
      deployment: 'Zero-Downtime Blue/Green',
      latency: '20-60% latency reduction',
    },
    protocols: ['REST API', 'Database Migrations', 'Queues'],
  },

  'architecture-consulting': {
    id: 'architecture-consulting',
    slug: 'architecture-consulting',
    type: 'service',
    typeLabel: 'Consulting Service',
    title: 'Architecture & Consulting',
    subtitle: 'System design, scalability blueprints, ADR decision records, and engineering standards.',
    category: 'Technical Strategy',
    status: 'active',
    statusLabel: 'Available for Consulting',
    tagline: 'Strategic engineering decisions to build durable, scalable software.',
    description:
      'Deep architectural audits and high-leverage guidance for engineering leaders. We identify database locks, memory leaks, and scaling bottlenecks, produce Architecture Decision Records (ADRs), and establish world-class engineering standards.',
    highlights: ['Bottleneck Elimination', 'Architecture Decision Records', 'Scalability Roadmaps'],
    capabilities: [
      {
        title: 'Performance & Scalability Audits',
        description: 'Identify database query locks, memory leaks, concurrency limits, and latency spikes across codebases.',
      },
      {
        title: 'Architecture Decision Records (ADRs)',
        description: 'Formal architectural documentation defining tech selection rationale, trade-offs, and scaling roadmaps.',
      },
      {
        title: 'AI Technology Selection',
        description: 'Honest evaluation of whether RAG, fine-tuning, agent swarms, or traditional algorithms solve your problem best.',
      },
      {
        title: 'Team Engineering Standards',
        description: 'Establish code review standards, schema conventions, Playwright E2E testing baselines, and release checklists.',
      },
    ],
    architecture: {
      stack: ['System Diagrams', 'Architecture Decision Records (ADRs)', 'Benchmark Suites'],
      runtime: 'Consulting & Engineering Reviews',
      deployment: 'Direct Technical Advisory',
      latency: 'High-leverage engineering',
    },
    protocols: ['Technical Documentation', 'Architecture Sitemaps', 'Code Walkthroughs'],
  },
}

export function getCatalogItem(slug: string): CatalogItem | null {
  return CATALOG_ITEMS[slug] ?? null
}

export function getAllCatalogItems(): CatalogItem[] {
  return Object.values(CATALOG_ITEMS)
}

export function getItemsByType(type: CatalogItemType): CatalogItem[] {
  return Object.values(CATALOG_ITEMS).filter((item) => item.type === type)
}

// Послуга потрібною мовою; поля без перекладу лишаються англійськими.
export function localizeItem(item: CatalogItem, locale: Locale): CatalogItem {
  if (locale === 'en') return item

  const translated = SERVICE_TRANSLATIONS[item.slug]?.[locale]
  if (!translated) return item

  return {
    ...item,
    typeLabel: translated.typeLabel,
    title: translated.title,
    subtitle: translated.subtitle,
    category: translated.category,
    statusLabel: translated.statusLabel,
    tagline: translated.tagline,
    description: translated.description,
    highlights: translated.highlights,
    capabilities: translated.capabilities,
    architecture: {
      ...item.architecture,
      runtime: translated.runtime,
      deployment: translated.deployment,
      latency: translated.latency,
    },
  }
}

export function hasTranslation(slug: string, locale: Locale): boolean {
  return locale === 'en' || Boolean(SERVICE_TRANSLATIONS[slug]?.[locale])
}
