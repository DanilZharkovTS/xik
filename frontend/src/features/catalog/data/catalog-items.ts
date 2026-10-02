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

export const CATALOG_ITEMS: Record<string, CatalogItem> = {
  // --- PRODUCTS ---
  keyho: {
    id: 'keyho',
    slug: 'keyho',
    type: 'product',
    typeLabel: 'Software Product',
    title: 'Keyho',
    subtitle: 'Property operations platform connecting owners, managers and workers.',
    category: 'PropTech · Operations',
    status: 'production',
    statusLabel: 'Production Ready',
    tagline: 'Streamline property workflows with zero operational latency.',
    description:
      'KEYHO is an integrated operations platform for multi-unit property portfolios. It bridges owners, property managers, on-site contractors and operational staff into a unified, synchronized dashboard for task assignment, status verification, and work auditing.',
    highlights: ['Multi-tenant Workspace', 'Realtime Task Queue', '<40ms Sync Latency'],
    capabilities: [
      {
        title: 'Task Dispatch & Assignment',
        description: 'Auto-allocate maintenance and operational tasks based on worker availability, proximity and specialty.',
      },
      {
        title: 'Apartment & Asset Tracking',
        description: 'Comprehensive unit-level history, inventory tracking and condition reporting with photographic logs.',
      },
      {
        title: 'Worker Communication Gateway',
        description: 'Direct mobile-friendly messaging and notification dispatch without third-party app installations.',
      },
      {
        title: 'Auditable Financial & Service Logs',
        description: 'Immutable operational records ready for accounting exports and owner transparent billing.',
      },
    ],
    architecture: {
      stack: ['Next.js 16', 'Go Microservices', 'PostgreSQL', 'RabbitMQ', 'Tailwind CSS v4'],
      runtime: 'Docker Compose / Kubernetes',
      deployment: 'Self-hosted or Managed Cloud',
      latency: '<40ms sync',
    },
    protocols: ['REST API', 'WebSocket Feeds', 'Push Notifications', 'Webhooks'],
  },

  'telemetry-hub': {
    id: 'telemetry-hub',
    slug: 'telemetry-hub',
    type: 'product',
    typeLabel: 'Infrastructure Product',
    title: 'Telemetry Hub',
    subtitle: 'Unified metrics, logs, traces and alerting for Docker Compose environments.',
    category: 'Observability · Infrastructure',
    status: 'production',
    statusLabel: 'Production Ready',
    tagline: 'Turn distributed container noise into actionable operational clarity.',
    description:
      'TELEMETRY HUB is an all-in-one observability platform designed specifically for self-hosted and independent Docker Compose architectures. It consolidates metrics collection, structured log streaming, trace aggregation, and smart alert rules into a single lean stack.',
    highlights: ['Zero-config Setup', 'Unified PromQL & LogQL', 'Sub-second Ingestion'],
    capabilities: [
      {
        title: 'Lightweight Log Streaming',
        description: 'Instant ingestion of container stdout/stderr with full-text search, regex filtering, and tag indexing.',
      },
      {
        title: 'Multi-service Metric Graphs',
        description: 'Auto-scrapes Prometheus endpoints and host resources (CPU, RAM, IOPS, Network) without heavy agents.',
      },
      {
        title: 'Smart Anomaly Alerting',
        description: 'Threshold and rate-of-change alerts dispatched to Telegram, Discord, Slack or custom webhooks.',
      },
      {
        title: 'Trace Propagation',
        description: 'Correlate user requests across microservices with distributed OpenTelemetry context propagation.',
      },
    ],
    architecture: {
      stack: ['Go Ingestion Engine', 'ClickHouse', 'Prometheus Agent', 'Next.js Frontend'],
      runtime: 'Single Docker Compose Container Suite',
      deployment: 'Edge Node or Dedicated Server',
      latency: '<15ms query',
    },
    protocols: ['OpenTelemetry', 'Prometheus Scrape', 'Syslog', 'Webhook Gateway'],
  },

  'job-follow': {
    id: 'job-follow',
    slug: 'job-follow',
    type: 'product',
    typeLabel: 'Automation Product',
    title: 'Job Follow',
    subtitle: 'Automated lead monitoring, news feeds and IT job discovery engine.',
    category: 'Market Intelligence · Automation',
    status: 'production',
    statusLabel: 'Production Ready',
    tagline: 'Continuous intelligence from high-velocity communication channels.',
    description:
      'JOB FOLLOW monitors Telegram channels, job boards, community forums and news distribution outlets in real time. It uses custom natural language classifiers to extract high-value leads, technical vacancies, and market signals, delivering them instantly to tailored feeds.',
    highlights: ['24/7 Channel Scraping', 'NLP Classification', 'Instant Telegram Alerts'],
    capabilities: [
      {
        title: 'Telegram Channel Ingestion',
        description: 'Connects multiple listener accounts to extract messages across public and restricted technical groups.',
      },
      {
        title: 'Contextual Lead Scoring',
        description: 'Applies neural classifiers to filter out spam and prioritize relevant job opportunities or business leads.',
      },
      {
        title: 'Structured Resume Matching',
        description: 'Cross-checks vacancy requirements against developer profiles to calculate precise qualification scores.',
      },
      {
        title: 'Multi-target Dispatch',
        description: 'Route scored opportunities into personal Telegram bots, Notion boards, or webhook endpoints.',
      },
    ],
    architecture: {
      stack: ['Python Telethon', 'FastAPI', 'PostgreSQL', 'Vector Embeddings', 'Redis'],
      runtime: 'Containerized Worker Fleet',
      deployment: 'Cloud VPS with Proxy Pools',
      latency: '<1s detection to alert',
    },
    protocols: ['MTProto (Telegram)', 'REST API', 'Redis Pub/Sub', 'Webhook Dispatches'],
  },

  // --- AI AGENTS ---
  chpokai: {
    id: 'chpokai',
    slug: 'chpokai',
    type: 'product',
    typeLabel: 'Security Product',
    title: 'Chpokai',
    subtitle: 'Authorized AI-agent security, pentesting and acceptance testing platform.',
    category: 'AI Product · Security & Testing',
    status: 'active',
    statusLabel: 'Active System',
    tagline: 'Autonomous adversarial verification with machine-readable evidence.',
    description:
      'CHPOKAI executes controlled, reproducible behavioral security assessments against web systems, APIs and AI agents. It identifies prompt injections, business logic bypasses, auth leakage, and API flaws, generating auditable proof-of-exploit reports.',
    highlights: ['Adversarial Simulation', 'Prompt Injection Probing', 'Compliance Audit Logs'],
    capabilities: [
      {
        title: 'Autonomous Attack Simulation',
        description: 'Generates non-destructive exploitation vectors testing for OWASP Top 10 for LLMs and web APIs.',
      },
      {
        title: 'Sandbox Execution Proofs',
        description: 'Isolates findings with step-by-step reproduction traces and verifiable network payloads.',
      },
      {
        title: 'Guardrail Regression Testing',
        description: 'Continuously asserts that system prompts and safety filters maintain their integrity across model updates.',
      },
      {
        title: 'Machine-Readable Audit Reports',
        description: 'Exports formal vulnerability logs in JSON, Markdown, and SARIF formats for CI/CD integration.',
      },
    ],
    architecture: {
      stack: ['Python Security Framework', 'Sandboxed Headless Chromium', 'Multi-LLM Swarm', 'Next.js UI'],
      runtime: 'Isolated Ephemeral Containers',
      deployment: 'Secure VPC',
      latency: 'Real-time telemetry',
    },
    protocols: ['HTTP/2', 'WebSocket', 'CLI Engine', 'CI/CD Action'],
  },

  'activity-simulator': {
    id: 'activity-simulator',
    slug: 'activity-simulator',
    type: 'agent',
    typeLabel: 'Desktop AI Agent',
    title: 'Activity Simulator',
    subtitle: 'Native desktop application orchestrating realistic mouse, keyboard and scenario behaviors.',
    category: 'Desktop AI · Automation',
    status: 'active',
    statusLabel: 'Native Desktop App',
    tagline: 'Natural desktop automation with realistic human-like dynamics and native OS hooks.',
    description:
      'Activity Simulator is a native cross-platform desktop application (macOS, Windows, Linux) that orchestrates desktop workflows with natural bezier mouse curves, randomized typing cadence, and adaptive window management. Built for stress testing, realistic activity generation, and autonomous scenario execution.',
    highlights: ['Native Desktop App (macOS/Win/Linux)', 'Human-grade Motion', 'Non-deterministic Curves', 'Profile Presets'],
    capabilities: [
      {
        title: 'Natural Bezier Pointer Curves',
        description: 'Simulates realistic cursor movement acceleration, deceleration, and micro-corrections.',
      },
      {
        title: 'Stochastic Typing Cadence',
        description: 'Dynamic character entry speeds with simulated fatigue, pauses, and typo-correction behavior.',
      },
      {
        title: 'Multi-window Application Flow',
        description: 'Intelligently manages browser tabs, code editors, and terminal focus across long-running sessions.',
      },
      {
        title: 'Profile & Scenario Presets',
        description: 'Save custom developer, researcher, or operator profiles with distinct daily schedule patterns.',
      },
    ],
    architecture: {
      stack: ['Go Native OS Bindings', 'Cross-platform Cocoa/Win32', 'Lightweight Agent Runtime'],
      runtime: 'Native Binary (macOS / Windows / Linux)',
      deployment: 'Local Desktop Execution',
      latency: '<1ms input dispatch',
    },
    protocols: ['Local IPC', 'WebSocket Control Plane', 'CLI'],
  },

  'build-runner': {
    id: 'build-runner',
    slug: 'build-runner',
    type: 'agent',
    typeLabel: 'Desktop AI Agent',
    title: 'Build Runner',
    subtitle: 'Real-time cross-platform desktop interview and engineering copilot.',
    category: 'Desktop AI · Copilot',
    status: 'active',
    statusLabel: 'Native Desktop App',
    tagline: 'Realtime multimodal desktop copilot combining voice, screen context, and stealth HUD overlay.',
    description:
      'BUILD RUNNER is a native cross-platform desktop application (macOS & Windows) that listens to audio discussions and analyzes screen context simultaneously. It operates as a stealth floating HUD overlay, providing architectural suggestions, live syntax hints, and algorithmic breakdowns in real time.',
    highlights: ['Native Desktop App (macOS & Win)', 'Stealth Floating HUD Overlay', 'Sub-300ms Audio Transcription', 'BYOK Model Routing'],
    capabilities: [
      {
        title: 'Real-time Audio Stream Parsing',
        description: 'High-accuracy continuous voice transcription with speaker diarization and noise suppression.',
      },
      {
        title: 'Live Screen Context OCR',
        description: 'Reads technical problem statements, IDE code windows, and system architecture diagrams on the fly.',
      },
      {
        title: 'Role-Aware Response Synthesis',
        description: 'Tailors advice to senior engineering levels, avoiding boilerplate in favor of architectural precision.',
      },
      {
        title: 'Stealth Floating HUD',
        description: 'Transparent, click-through desktop overlay designed for absolute minimum visual distraction.',
      },
    ],
    architecture: {
      stack: ['Rust Core', 'WebRTC Audio Pipeline', 'Claude 3.7 / Gemini 2.0 Routing', 'Tauri GUI'],
      runtime: 'Native Desktop Process',
      deployment: 'Client Desktop with Cloud AI Bridge',
      latency: '<400ms voice-to-hint',
    },
    protocols: ['WebRTC', 'WebSocket', 'Model BYOK API'],
  },

  'key-service': {
    id: 'key-service',
    slug: 'key-service',
    type: 'product',
    typeLabel: 'Infrastructure Product',
    title: 'Key Service',
    subtitle: 'Licensing, device-bound verification and entitlement infrastructure.',
    category: 'Licensing & Identity',
    status: 'production',
    statusLabel: 'Production Ready',
    tagline: 'Hardware-bound licensing and entitlement control for software products.',
    description:
      'Key Service is a high-performance Go/PostgreSQL licensing backend. It handles cryptographic product activation, hardware fingerprint hashing, recurring entitlement validation, and audited lifecycle administration across all studio applications.',
    highlights: ['Cryptographic Ed25519', 'Offline Verification', '<3ms Verification'],
    capabilities: [
      {
        title: 'Device-Bound Fingerprinting',
        description: 'Hashes CPU, motherboard, and disk IDs to create tamper-resistant device identity hashes.',
      },
      {
        title: 'Cryptographic License Keys',
        description: 'Issues Ed25519-signed license tokens verifiable both online and in air-gapped environments.',
      },
      {
        title: 'Feature Entitlement Gates',
        description: 'Granular boolean, integer and expiration-based feature toggles per issued license.',
      },
      {
        title: 'Audit & Revocation Control',
        description: 'Instantly revoke, rebind, or suspend licenses with an immutable administrative audit trail.',
      },
    ],
    architecture: {
      stack: ['Go 1.24', 'PostgreSQL', 'Ed25519 Cryptography', 'Redis Cache'],
      runtime: 'Lightweight Docker Container',
      deployment: 'High-availability Kubernetes / VPS',
      latency: '<3ms verification',
    },
    protocols: ['REST JSON API', 'gRPC Service', 'Offline JWT / Ed25519'],
  },

  'ai-execution-advisor': {
    id: 'ai-execution-advisor',
    slug: 'ai-execution-advisor',
    type: 'product',
    typeLabel: 'AI Operations Product',
    title: 'AI Execution Advisor',
    subtitle: 'Analyzes AI workloads, execution cost and quality for organizational LLM ops.',
    category: 'AI Product · LLM Operations',
    status: 'active',
    statusLabel: 'Active System',
    tagline: 'Evidence-based cost, latency, and quality optimization for enterprise AI.',
    description:
      'Observes organization-scoped AI workloads across providers (OpenAI, Anthropic, Google, local open weights). Analyzes token efficiency, cache hit rates, prompt length bloat, and provides guarded A/B experiment recommendations to cut costs without reducing quality.',
    highlights: ['Token Cost Analytics', 'Cache Hit Optimization', 'Automated Fallback Routing'],
    capabilities: [
      {
        title: 'Cross-Provider Cost Inspection',
        description: 'Granular per-tenant, per-model, and per-feature spend tracking down to the individual token.',
      },
      {
        title: 'Prompt Compression & Caching',
        description: 'Detects repetitive context blocks and enforces prefix caching rules to slash LLM billings by up to 60%.',
      },
      {
        title: 'A/B Quality Evaluation',
        description: 'Guarded side-by-side model experiments benchmarking smaller/cheaper models against flagship tiers.',
      },
      {
        title: 'Adaptive Fallback Policy',
        description: 'Auto-reroutes failed or rate-limited requests to standby providers with zero user disruption.',
      },
    ],
    architecture: {
      stack: ['Go Reverse Proxy', 'ClickHouse Analytics', 'Next.js Dashboard'],
      runtime: 'Cloud Proxy Edge',
      deployment: 'Drop-in API BaseURL replacement',
      latency: '<2ms proxy overhead',
    },
    protocols: ['OpenAI-compatible REST', 'Anthropic Protocol', 'gRPC Telemetry'],
  },

  'agent-platform': {
    id: 'agent-platform',
    slug: 'agent-platform',
    type: 'agent',
    typeLabel: 'Autonomous AI Platform',
    title: 'Agent Platform',
    subtitle: 'Multi-tenant control plane for agents, conversations, tools and delegations.',
    category: 'AI Platform · Multi-Agent',
    status: 'active',
    statusLabel: 'Active Platform',
    tagline: 'The unified operating system for autonomous enterprise agents.',
    description:
      'A scalable multi-tenant control plane for orchestrating autonomous agents, persistent memories, tool registries, execution quotas, and cross-agent delegation across web, Telegram, voice and media pipelines.',
    highlights: ['Multi-Agent Delegation', 'Sandboxed Tool Registry', 'Persistent Memory Store'],
    capabilities: [
      {
        title: 'Hierarchical Agent Delegation',
        description: 'Supervisor agents break complex goals into task graphs and delegate to specialized subagents.',
      },
      {
        title: 'Sandboxed Tool Execution',
        description: 'Execute Python, Bash, Web Search, and database queries in short-lived secure micro-VM environments.',
      },
      {
        title: 'Contextual Memory Management',
        description: 'Short-term sliding window context coupled with long-term vector embeddings and user facts graph.',
      },
      {
        title: 'Tenant Quotas & Policy Controls',
        description: 'Fine-grained rate limits, budget ceilings, and strict tool authorization policies per workspace.',
      },
    ],
    architecture: {
      stack: ['Node.js / TypeScript', 'PostgreSQL', 'pgvector', 'Docker Engine', 'Next.js'],
      runtime: 'Distributed Cluster',
      deployment: 'Self-hosted or Cloud',
      latency: '<100ms dispatch',
    },
    protocols: ['REST', 'WebSocket', 'MCP (Model Context Protocol)', 'Telegram Webhooks'],
  },

  'voice-ai': {
    id: 'voice-ai',
    slug: 'voice-ai',
    type: 'agent',
    typeLabel: 'Autonomous AI Agent',
    title: 'Voice AI',
    subtitle: 'Realtime bidirectional conversational agents for voice and telephony.',
    category: 'Voice AI · Realtime',
    status: 'build',
    statusLabel: 'In Active Build',
    tagline: 'Sub-second conversational voice intelligence with natural interruption handling.',
    description:
      'Realtime conversational voice engine combining WebRTC streaming, acoustic voice activity detection (VAD), streaming neural speech-to-text, LLM generation, and ultra-low-latency voice synthesis.',
    highlights: ['Sub-500ms End-to-End', 'Native Interruption (Barge-in)', 'SIP / Telephony Bridge'],
    capabilities: [
      {
        title: 'Bilingual Speech Pipeline',
        description: 'Flawless transcription and synthesis across Ukrainian and English with native accent modulation.',
      },
      {
        title: 'Zero-lag Barge-in',
        description: 'User interruptions are recognized instantly, gracefully silencing current audio playback within 80ms.',
      },
      {
        title: 'Telephony & WebRTC Connectors',
        description: 'Connect directly to Asterisk, Twilio, browser WebRTC, or SIP trunks.',
      },
      {
        title: 'Custom Voice Personas',
        description: 'Train and configure distinct vocal characteristics, pacing, emotion, and technical tone.',
      },
    ],
    architecture: {
      stack: ['Rust WebRTC Engine', 'Whisper Live', 'Cartesia / ElevenLabs', 'Gemini Live API'],
      runtime: 'GPU Acceleration Node',
      deployment: 'Low-latency Regional Edge',
      latency: '<450ms turnaround',
    },
    protocols: ['WebRTC', 'SIP / RTP', 'WebSocket Streaming'],
  },

  'video-ai': {
    id: 'video-ai',
    slug: 'video-ai',
    type: 'agent',
    typeLabel: 'Autonomous AI Agent',
    title: 'Video AI',
    subtitle: 'Generative video editing, synthetic presentations and avatar experiences.',
    category: 'Generative AI · Video',
    status: 'build',
    statusLabel: 'In Active Build',
    tagline: 'Automate visual media generation from structured text and prompts.',
    description:
      'Generative video pipeline for producing product demos, synthetic avatar presentations, and automated short-form video content from structured markdown scripts and documentation.',
    highlights: ['Automated B-roll Stitching', 'Synthetic Avatars', 'Kinetic Typography'],
    capabilities: [
      {
        title: 'Script-to-Video Compilation',
        description: 'Transforms markdown technical guides into narrated, visually paced walkthrough videos.',
      },
      {
        title: 'Dynamic Asset Injection',
        description: 'Automatically inserts code snippets, product UI frames, and animated diagram highlights.',
      },
      {
        title: 'Multi-resolution Rendering',
        description: 'Simultaneous export for 16:9 desktop presentation and 9:16 vertical social reels.',
      },
      {
        title: 'Full Audio Soundtrack Mastering',
        description: 'Automated background audio ducking, sound effects, and voice clarity balancing.',
      },
    ],
    architecture: {
      stack: ['Remotion', 'FFmpeg', 'Node.js Renderer', 'Gemini Omni Flash'],
      runtime: 'Cloud Rendering Fleet',
      deployment: 'AWS ECS / GPU Nodes',
      latency: '2x realtime render',
    },
    protocols: ['REST Render API', 'Webhook Delivery', 'S3 Storage'],
  },

  rag: {
    id: 'rag',
    slug: 'rag',
    type: 'agent',
    typeLabel: 'Knowledge AI System',
    title: 'RAG',
    subtitle: 'Strict grounded-answer retrieval engine for tenant-isolated knowledge bases.',
    category: 'Knowledge AI · Retrieval',
    status: 'active',
    statusLabel: 'Active System',
    tagline: 'Hallucination-free document intelligence with verifiable source attribution.',
    description:
      'RAG knowledge system combining hybrid sparse-dense vector retrieval, re-ranking, and strict provenance citation. Designed to ingest PDF manuals, documentation, source code, and knowledge bases for strictly grounded answers.',
    highlights: ['Hybrid BM25 + Dense Vectors', 'Cohere Rerank Integration', '100% Source Citations'],
    capabilities: [
      {
        title: 'Multi-format Document Ingestion',
        description: 'Extracts clean semantic text from PDFs, Markdown, Notion, GitHub repos, and raw database dumps.',
      },
      {
        title: 'Context-Aware Chunking',
        description: 'Hierarchical chunking preserving headers, tables, and parent-child document relationships.',
      },
      {
        title: 'Strict Provenance & Citations',
        description: 'Every statement in the generated answer contains clickable footnotes pointing to exact source pages.',
      },
      {
        title: 'Tenant-isolated Knowledge Partitioning',
        description: 'Strict security boundaries guaranteeing that organizational knowledge never leaks across workspaces.',
      },
    ],
    architecture: {
      stack: ['Python LlamaIndex', 'Qdrant / pgvector', 'BGE / OpenAI Embeddings', 'Next.js UI'],
      runtime: 'Kubernetes Cluster',
      deployment: 'Private VPC',
      latency: '<200ms retrieval',
    },
    protocols: ['REST Query API', 'Vector gRPC', 'Webhook Sync'],
  },

  'telegram-ai': {
    id: 'telegram-ai',
    slug: 'telegram-ai',
    type: 'agent',
    typeLabel: 'Autonomous AI Agent',
    title: 'Telegram AI',
    subtitle: 'Autonomous Telegram monitoring, lead classification and alert workflows.',
    category: 'Monitoring AI · Telegram',
    status: 'active',
    statusLabel: 'Active Agent',
    tagline: 'High-speed signal extraction from thousands of Telegram communities.',
    description:
      'Autonomous agent fleet monitoring targeted Telegram groups, channels, and forums. Extracts purchase intent, high-value technical queries, customer feedback, and breaking market signals with zero manual polling.',
    highlights: ['Realtime MTProto Daemon', 'Intent Classification', 'Instant Private Alerts'],
    capabilities: [
      {
        title: 'Live Chat Stream Interception',
        description: 'Listens across hundreds of community discussions simultaneously via distributed listener daemons.',
      },
      {
        title: 'Fast Intent & Sentiment Scoring',
        description: 'Filters noise, emojis, and spam, highlighting only high-value queries with commercial intent.',
      },
      {
        title: 'Instant Dispatch & Webhooks',
        description: 'Forwards actionable leads directly to manager Telegram accounts or CRM systems within 2 seconds.',
      },
      {
        title: 'Automated Conversation Starter',
        description: 'Can draft contextual introductory responses based on company knowledge for quick human approval.',
      },
    ],
    architecture: {
      stack: ['Python AsyncIO', 'Telethon', 'FastAPI', 'Redis', 'PostgreSQL'],
      runtime: 'Distributed VPS Daemon Fleet',
      deployment: 'Self-hosted Docker Swarm',
      latency: '<1.5s latency',
    },
    protocols: ['Telegram MTProto API', 'Telegram Bot API', 'Webhook Dispatch'],
  },

  'web-widget-ai': {
    id: 'web-widget-ai',
    slug: 'web-widget-ai',
    type: 'agent',
    typeLabel: 'Autonomous AI Agent',
    title: 'Web Widget Support AI',
    subtitle: 'Embeddable intelligent website chat widget with streaming answers, documentation grounding, and lead capture.',
    category: 'Web AI · Conversational Widget',
    status: 'active',
    statusLabel: 'Production Ready',
    tagline: 'Instant customer support and automated lead qualification embedded in any website.',
    description:
      'WEB WIDGET AI is a lightweight (<25KB), customizable embeddable web chat widget powered by streaming LLMs and vector RAG. It seamlessly integrates into any modern website or web app, answers visitor questions strictly grounded in your product documentation, collects verified leads, and hands off complex conversations to human operators.',
    highlights: ['<25KB Embed Bundle', 'Realtime Token Streaming', 'Strict Docs Grounding', 'Automated Lead Qualification'],
    capabilities: [
      {
        title: 'One-Line Script Embedding',
        description: 'Drop onto any website via a single script tag across WordPress, Webflow, Shopify, React, Next.js or static HTML.',
      },
      {
        title: 'Strict Knowledge Grounding',
        description: 'Answers visitor inquiries strictly using verified documentation, pricing sheets, and FAQs with zero hallucination.',
      },
      {
        title: 'Automated Lead Qualification',
        description: 'Identifies high-intent visitors, collects verified emails and phone numbers, and routes leads directly to CRM or Telegram.',
      },
      {
        title: 'Custom Brand & Theme Styling',
        description: 'Fully customizable widget accents, launcher bubbles, welcome greetings, avatars, and tone of voice.',
      },
    ],
    architecture: {
      stack: ['TypeScript', 'Preact Widget Core', 'FastAPI Backend', 'Qdrant Vector DB', 'Redis Cache'],
      runtime: 'Edge CDN & Distributed Server Fleet',
      deployment: 'Managed Cloud / On-Premise Docker',
      latency: '<80ms TTFT (Time to First Token)',
    },
    protocols: ['WebSocket Streaming', 'REST API', 'Embed Script', 'CRM Webhooks'],
  },

  'telegram-bot-ai': {
    id: 'telegram-bot-ai',
    slug: 'telegram-bot-ai',
    type: 'agent',
    typeLabel: 'Autonomous AI Agent',
    title: 'TELEGRAM Support BOT AI',
    subtitle: 'Interactive conversational assistant for Telegram groups, channels and private chats with tool execution.',
    category: 'Telegram AI · Conversational Bot',
    status: 'active',
    statusLabel: 'Active System',
    tagline: 'Enterprise-grade conversational intelligence and workflow automation right inside Telegram.',
    description:
      'TELEGRAM CHATBOT AI is a production-grade conversational bot engineered for Telegram. It handles customer inquiries in direct messages, moderates and assists in community groups, understands voice notes and document uploads, and runs custom backend actions (order lookup, support ticketing, booking) through secure function calling.',
    highlights: ['Group & Direct Message Modes', 'Voice & Image Understanding', 'Persistent User Context', 'Function Calling & Tools'],
    capabilities: [
      {
        title: 'Group Moderation & Community Support',
        description: 'Answers member questions in group discussions, detects spam, and responds either inline or via private messaging.',
      },
      {
        title: 'Voice Note & Document Understanding',
        description: 'Transcribes incoming voice messages with Whisper and analyzes uploaded PDF/photo documents with multimodal vision.',
      },
      {
        title: 'Contextual Multi-Turn Memory',
        description: 'Maintains long-term session memory for every user, remembering past interactions, preferences, and account IDs.',
      },
      {
        title: 'Custom Tool & API Integrations',
        description: 'Executes backend queries, order lookups, appointment scheduling, and CRM updates directly through chat buttons and commands.',
      },
    ],
    architecture: {
      stack: ['Python 3.12 AsyncIO', 'aiogram 3.x', 'PostgreSQL', 'Redis State Store', 'Whisper & Vision APIs'],
      runtime: 'Resilient High-Availability VPS Cluster',
      deployment: 'Docker Swarm / Kubernetes',
      latency: '<350ms response delivery',
    },
    protocols: ['Telegram Bot API', 'MTProto Client', 'Webhook Bridge', 'REST JSON API'],
  },

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
