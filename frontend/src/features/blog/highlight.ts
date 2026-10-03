import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import php from 'highlight.js/lib/languages/php'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

// Лише найуживаніші мови: підсвічування відбувається на сервері, у браузер іде готова розмітка.
const LANGUAGES = { bash, css, go, javascript, json, php, python, sql, typescript, xml, yaml }

for (const [name, definition] of Object.entries(LANGUAGES)) hljs.registerLanguage(name, definition)

const ALIASES: Record<string, string> = {
  sh: 'bash', shell: 'bash', zsh: 'bash', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'xml', yml: 'yaml', golang: 'go',
}

// Повертає безпечний HTML (hljs екранує вміст) і назву мови; невідома мова лишається простим текстом.
export function highlight(code: string, language?: string): { html: string; language: string | null } {
  const requested = language?.toLowerCase().trim()
  const name = requested ? (ALIASES[requested] ?? requested) : undefined

  if (name && hljs.getLanguage(name)) {
    return { html: hljs.highlight(code, { language: name, ignoreIllegals: true }).value, language: name }
  }

  return { html: code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), language: null }
}
