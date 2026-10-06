import type { ChainedCommands, Editor } from '@tiptap/core'

import type { RichTextFeature, RichTextFieldConfig, RichTextHeadingLevel } from '../index'
import { DEFAULT_ALLOWED_SCHEMES, isSafeUrl, type UrlPolicy } from '../links'
import { isFeatureEnabled } from './extensions'

/**
 * Formatting toolbar for the preview editor, pinned above the edited element so
 * it never covers the line being typed. Lives in its own shadow root, so page
 * styles never reach it, and keeps focus in the editor while clicked.
 */
export interface Toolbar {
  openLink: () => void
  destroy: () => void
}

interface Tool {
  feature: RichTextFeature
  label: string
  icon: string
  isActive: (editor: Editor) => boolean
  run: (chain: ChainedCommands) => ChainedCommands
}

/** Block formats the CMS offers when a field configures none. */
const DEFAULT_HEADING_LEVELS: RichTextHeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'p']

const MARKS: Tool[] = [
  {
    feature: 'bold',
    label: 'Bold',
    icon: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
    isActive: (editor) => editor.isActive('bold'),
    run: (chain) => chain.toggleBold(),
  },
  {
    feature: 'italic',
    label: 'Italic',
    icon: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
    isActive: (editor) => editor.isActive('italic'),
    run: (chain) => chain.toggleItalic(),
  },
  {
    feature: 'underline',
    label: 'Underline',
    icon: '<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16"/>',
    isActive: (editor) => editor.isActive('underline'),
    run: (chain) => chain.toggleUnderline(),
  },
  {
    feature: 'strike',
    label: 'Strikethrough',
    icon: '<path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16"/>',
    isActive: (editor) => editor.isActive('strike'),
    run: (chain) => chain.toggleStrike(),
  },
  {
    feature: 'code',
    label: 'Inline code',
    icon: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    isActive: (editor) => editor.isActive('code'),
    run: (chain) => chain.toggleCode(),
  },
]

const BLOCKS: Tool[] = [
  {
    feature: 'bulletList',
    label: 'Bullet list',
    icon: '<path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13"/>',
    isActive: (editor) => editor.isActive('bulletList'),
    run: (chain) => chain.toggleBulletList(),
  },
  {
    feature: 'orderedList',
    label: 'Numbered list',
    icon: '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    isActive: (editor) => editor.isActive('orderedList'),
    run: (chain) => chain.toggleOrderedList(),
  },
  {
    feature: 'blockquote',
    label: 'Quote',
    icon: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    isActive: (editor) => editor.isActive('blockquote'),
    run: (chain) => chain.toggleBlockquote(),
  },
  {
    feature: 'codeBlock',
    label: 'Code block',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 9-3 3 3 3M14 15l3-3-3-3"/>',
    isActive: (editor) => editor.isActive('codeBlock'),
    run: (chain) => chain.toggleCodeBlock(),
  },
]

const LINK_ICON =
  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
const REMOVE_ICON = '<path d="M18 6 6 18M6 6l12 12"/>'

const BLUE = 'rgb(59, 130, 246)'

const CSS = `
  :host { all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647; }
  [hidden] { display: none !important; }
  .bar {
    display: flex; align-items: center; gap: 2px; padding: 3px; box-sizing: border-box;
    background: #fff; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    font: 500 12px/20px system-ui, -apple-system, sans-serif;
  }
  .group { display: flex; gap: 2px; }
  .group + .group { margin-left: 2px; padding-left: 4px; border-left: 1px solid #e5e7eb; }
  button, select { all: unset; box-sizing: border-box; cursor: pointer; border-radius: 4px; }
  button { display: grid; place-items: center; width: 26px; height: 26px; }
  button:hover:not(:disabled), select:hover { background: #f3f4f6; }
  button[aria-pressed="true"] { background: ${BLUE}; color: #fff; }
  button:disabled { opacity: 0.4; cursor: default; }
  button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid ${BLUE}; outline-offset: -2px; }
  select { height: 26px; padding: 0 6px; }
  svg { width: 15px; height: 15px; }
  input {
    all: unset; box-sizing: border-box; width: 240px; height: 26px; padding: 0 6px;
    border-radius: 4px; background: #f3f4f6;
  }
  input[aria-invalid="true"] { background: #fef2f2; outline: 2px solid #dc2626; outline-offset: -2px; }
  .error { padding: 0 6px; color: #b91c1c; white-space: nowrap; }
`

export function createToolbar(
  editor: Editor,
  el: HTMLElement,
  config: RichTextFieldConfig,
  policy: UrlPolicy = {}
): Toolbar {
  const enabled = (feature: RichTextFeature) => isFeatureEnabled(config, feature)
  const host = document.createElement('div')
  host.id = 'b10cks-richtext-toolbar'
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = CSS

  const bar = element('div', 'bar')
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', 'Text formatting')
  const tools = element('div', 'group')
  const linkForm = element('div', 'group')
  linkForm.hidden = true
  bar.append(tools, linkForm)
  root.append(style, bar)

  // Safari doesn't focus a clicked select, so focus alone can't tell that its
  // menu is open. Stay visible until the editor has focus again or the next
  // pointer press lands outside the toolbar.
  let selecting = false
  bar.addEventListener('pointerdown', (event) => {
    selecting = event.target instanceof HTMLSelectElement
  })
  const onOutsidePointer = (event: PointerEvent) => {
    if (!selecting || event.composedPath().includes(host)) return
    selecting = false
    refresh()
  }

  // Keep the editor focused, except for the controls that take input.
  bar.addEventListener('mousedown', (event) => {
    if (!(event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement)) {
      event.preventDefault()
    }
  })

  const refreshers: (() => void)[] = []
  const run = (tool: Tool) => tool.run(editor.chain().focus()).run()

  const addGroup = (nodes: HTMLElement[]) => {
    if (nodes.length === 0) return
    const group = element('div', 'group')
    group.append(...nodes)
    tools.appendChild(group)
  }

  const toolButton = (tool: Tool) => {
    const button = iconButton(tool.label, tool.icon)
    button.addEventListener('click', () => run(tool))
    refreshers.push(() => button.setAttribute('aria-pressed', String(tool.isActive(editor))))
    return button
  }

  const levels = enabled('heading') ? (config.headingLevels ?? DEFAULT_HEADING_LEVELS) : []
  if (levels.length > 0) addGroup([formatSelect(editor, levels, refreshers)])
  addGroup(MARKS.filter((tool) => enabled(tool.feature)).map(toolButton))

  const input = element('input', '')
  input.type = 'url'
  input.placeholder = 'Paste or type a link'
  input.setAttribute('aria-label', 'Link address')
  const error = element('span', 'error')
  error.id = 'b10cks-link-error'
  error.hidden = true
  error.textContent = `Use ${(policy.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES).join(', ')} or a relative link`
  input.setAttribute('aria-describedby', error.id)
  const setInvalid = (invalid: boolean) => {
    if (invalid) input.setAttribute('aria-invalid', 'true')
    else input.removeAttribute('aria-invalid')
    error.hidden = !invalid
    place()
  }
  input.addEventListener('input', () => setInvalid(false))
  const unlink = iconButton('Remove link', REMOVE_ICON)
  linkForm.append(input, error, unlink)

  const closeLink = () => {
    linkForm.hidden = true
    tools.hidden = false
    editor.commands.focus()
  }
  const openLink = () => {
    if (!enabled('link') || editor.isActive('internalLink')) return
    tools.hidden = true
    linkForm.hidden = false
    input.value = editor.getAttributes('link').href ?? ''
    setInvalid(false)
    unlink.disabled = !editor.isActive('link')
    place()
    input.focus()
  }
  const applyLink = () => {
    const href = input.value.trim()
    if (href && !isSafeUrl(href, policy)) {
      setInvalid(true)
      return
    }
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!href) chain.unsetLink()
    else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
    } else chain.setLink({ href })
    chain.run()
    closeLink()
  }
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applyLink()
    else if (event.key === 'Escape') closeLink()
    else return
    event.preventDefault()
    event.stopPropagation()
  })
  unlink.addEventListener('click', () => {
    input.value = ''
    applyLink()
  })

  const blocks = BLOCKS.filter((tool) => enabled(tool.feature)).map(toolButton)
  if (enabled('link')) {
    const button = iconButton('Link', LINK_ICON)
    button.addEventListener('click', openLink)
    refreshers.push(() => {
      const internal = editor.isActive('internalLink')
      button.disabled = internal
      button.title = internal ? 'Edit internal links in the editor' : 'Link'
      button.setAttribute('aria-pressed', String(editor.isActive('link') || internal))
    })
    blocks.unshift(button)
  }
  addGroup(blocks)

  document.body.appendChild(host)

  function place() {
    const rect = el.getBoundingClientRect()
    const { width, height } = bar.getBoundingClientRect()
    const viewport = document.documentElement.clientWidth
    const top = Math.max(4, rect.top - height - 6)
    const left = Math.min(Math.max(4, rect.left), viewport - width - 4)
    host.style.transform = `translate(${left}px, ${top}px)`
  }

  function refresh() {
    const visible = editor.isFocused || document.activeElement === host || selecting
    host.hidden = !visible
    if (!visible) {
      linkForm.hidden = true
      tools.hidden = false
      return
    }
    for (const refresher of refreshers) refresher()
    place()
  }

  const onFocus = () => {
    selecting = false
    refresh()
  }
  editor.on('transaction', refresh)
  editor.on('focus', onFocus)
  // Focus moving into the link input blurs the editor; wait for it to land.
  const onBlur = () => setTimeout(refresh)
  editor.on('blur', onBlur)
  const scrollOptions = { capture: true, passive: true }
  window.addEventListener('scroll', place, scrollOptions)
  window.addEventListener('resize', place)
  input.addEventListener('blur', onBlur)
  document.addEventListener('pointerdown', onOutsidePointer, true)
  refresh()

  return {
    openLink,
    destroy() {
      editor.off('transaction', refresh)
      editor.off('focus', onFocus)
      editor.off('blur', onBlur)
      document.removeEventListener('pointerdown', onOutsidePointer, true)
      window.removeEventListener('scroll', place, scrollOptions)
      window.removeEventListener('resize', place)
      host.remove()
    },
  }
}

const LEVEL_LABELS: Record<RichTextHeadingLevel, string> = {
  p: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
}

function formatSelect(
  editor: Editor,
  levels: RichTextHeadingLevel[],
  refreshers: (() => void)[]
): HTMLSelectElement {
  const select = element('select', '')
  select.setAttribute('aria-label', 'Text format')
  for (const level of levels) {
    const option = element('option', '')
    option.value = level
    option.textContent = LEVEL_LABELS[level]
    select.appendChild(option)
  }
  const current = element('option', '')
  current.hidden = true
  current.value = ''
  current.textContent = 'Format'
  select.appendChild(current)

  select.addEventListener('change', () => {
    const level = select.value as RichTextHeadingLevel
    const chain = editor.chain().focus()
    if (level === 'p') chain.setParagraph().run()
    else chain.setHeading({ level: headingNumber(level) }).run()
  })
  refreshers.push(() => {
    const active = levels.find((level) =>
      level === 'p'
        ? editor.isActive('paragraph')
        : editor.isActive('heading', { level: headingNumber(level) })
    )
    select.value = active ?? ''
  })
  return select
}

function headingNumber(level: Exclude<RichTextHeadingLevel, 'p'>): 1 | 2 | 3 | 4 | 5 | 6 {
  return Number(level.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6
}

function iconButton(label: string, paths: string): HTMLButtonElement {
  const button = element('button', '')
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  return button
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (className) el.className = className
  return el
}
