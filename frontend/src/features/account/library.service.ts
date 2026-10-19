import { accountService } from './account.service'
import type { LibraryItem } from './account.service'

export type { LibraryItem }

export const libraryService = {
  getLicenseKey: accountService.getLicenseKey,
}
