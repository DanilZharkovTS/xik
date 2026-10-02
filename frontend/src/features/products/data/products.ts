export const PRODUCT_CATEGORIES = [
  'development',
  'writing',
  'design',
  'productivity',
  'education',
  'business',
  'marketing',
  'finance',
  'research',
  'analytics',
  'communication',
  'automation',
  'imageGeneration',
  'videoGeneration',
  'audio',
  'translation',
  'socialMedia',
  'sales',
  'legal',
  'cybersecurity',
  'dataScience',
  'lifestyle',
] as const

export const PRODUCT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'CNY',
  'UAH',
] as const

export const PRODUCT_BILLING_PERIODS = [
  'week',
  'month',
  'year',
] as const

import type { Product } from '../types'

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'keyho',
    name: 'KEYHO',
    shortDescription: 'Property operations platform connecting owners, managers and workers.',
    description:
      'Property operations platform connecting owners, managers and workers across apartments, tasks, services, communication and operational workflows.',
    categories: ['productivity', 'business', 'automation'],
    features: [
      'Task management and assignments',
      'Apartment and property tracking',
      'Worker scheduling and communication',
      'Operational workflows and analytics',
    ],
    price: '29',
    currency: 'USD',
    billingPeriod: 'month',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isSaved: false,
  },
  {
    id: 'prod-2',
    slug: 'telemetry-hub',
    name: 'TELEMETRY HUB',
    shortDescription: 'Reusable observability platform for independent Docker Compose projects.',
    description:
      'Reusable observability platform that unifies metrics, logs, traces and alerting for independent Docker Compose projects in one operational stack.',
    categories: ['analytics', 'automation', 'development'],
    features: [
      'Unified metrics, logs, and traces',
      'Docker Compose auto-discovery',
      'Alerting and incident dispatch',
      'Self-hosted and private-first',
    ],
    price: '49',
    currency: 'USD',
    billingPeriod: 'month',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isSaved: false,
  },
  {
    id: 'prod-3',
    slug: 'job-follow',
    name: 'JOB FOLLOW',
    shortDescription: 'Market intelligence, Telegram lead monitoring, and IT job discovery.',
    description:
      'News distribution, Telegram lead monitoring, IT job discovery and market intelligence connected through independent automated delivery pipelines.',
    categories: ['analytics', 'socialMedia', 'automation'],
    features: [
      'Telegram lead monitoring',
      'IT job discovery pipelines',
      'Real-time keyword alerts',
      'Automated distribution channels',
    ],
    price: '19',
    currency: 'USD',
    billingPeriod: 'month',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isSaved: false,
  },
]