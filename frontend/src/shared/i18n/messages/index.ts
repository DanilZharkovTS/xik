import { common } from './common'
import { team } from './team'
import { admin } from './admin'
import { outreach } from './outreach'
import { reports } from './reports'
import { content } from './content'
import { auth } from './auth'

const en = { ...common.en, ...team.en, ...admin.en, ...outreach.en, ...reports.en, ...content.en, ...auth.en }
const uk = { ...common.uk, ...team.uk, ...admin.uk, ...outreach.uk, ...reports.uk, ...content.uk, ...auth.uk }

export const messages: { en: typeof en; uk: Record<keyof typeof en, string> } = { en, uk }

export type MessageKey = keyof typeof en
