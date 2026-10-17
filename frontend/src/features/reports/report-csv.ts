import { channelLabel } from './channel-label'
import type { Report } from './reports.types'
import { replyRate } from './reports.types'

const cell = (value: unknown): string => {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const row = (values: unknown[]) => values.map(cell).join(',')

// Звіт у CSV: розділи по днях, каналах, модераторах, продуктах і шаблонах. BOM для Excel.
export const reportToCsv = (report: Report, labels: { unspecified: string }): string => {
  const counts = ['first', 'repeat', 'reply', 'publication', 'total'] as const
  const lines: string[] = [row(['period', report.range.from, report.range.to])]

  lines.push('', row(['date', ...counts]))
  for (const point of report.series) lines.push(row([point.bucket, ...counts.map((key) => point[key])]))

  lines.push('', row(['channel', ...counts]))
  for (const item of report.byChannel)
    lines.push(row([item.channel === 'unspecified' ? labels.unspecified : channelLabel(item.channel), ...counts.map((key) => item[key])]))

  if (report.byModerator) {
    lines.push('', row(['moderator', ...counts, 'reply_rate']))
    for (const item of report.byModerator) {
      const rate = replyRate(item.reply, item.first)
      lines.push(row([item.name, ...counts.map((key) => item[key]), rate === null ? '' : rate.toFixed(3)]))
    }
  }

  if (report.byProduct) {
    lines.push('', row(['product', ...counts]))
    for (const item of report.byProduct) lines.push(row([item.name, ...counts.map((key) => item[key])]))
  }

  if (report.byTemplate?.length) {
    lines.push('', row(['template', 'uses', 'people', 'replied']))
    for (const item of report.byTemplate) lines.push(row([item.title, item.uses, item.targets, item.replied]))
  }

  return '﻿' + lines.join('\r\n') + '\r\n'
}

export const downloadText = (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
