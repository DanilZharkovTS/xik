import { common } from './common'
import { team } from './team'
import { admin } from './admin'
import { outreach } from './outreach'
import { reports } from './reports'
import { content } from './content'
import { auth } from './auth'
import { publicSite } from './public'
import { account } from './account'

const en = { ...common.en, ...team.en, ...admin.en, ...outreach.en, ...reports.en, ...content.en, ...auth.en, ...publicSite.en, ...account.en }
const uk = { ...common.uk, ...team.uk, ...admin.uk, ...outreach.uk, ...reports.uk, ...content.uk, ...auth.uk, ...publicSite.uk, ...account.uk }

export type MessageKey = keyof typeof en

// Іспанська підключається разом із публічними й клієнтськими словниками (messages/public.ts).
const es: Partial<Record<MessageKey, string>> = { ...auth.es, ...publicSite.es, ...account.es }

export const messages: { en: typeof en; uk: Record<MessageKey, string>; es: Partial<Record<MessageKey, string>> } = {
  en,
  uk,
  es,
}
