import { describe, expect, it } from 'vitest'
import {
  createRichTextRenderer,
  createRichTextTextRenderer,
  DEFAULT_ALLOWED_SCHEMES,
  renderRichText,
  renderRichTextAsText,
} from './index'
import type { RichTextDocument } from './index'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function doc(...content: RichTextDocument[]): RichTextDocument {
  return { type: 'doc', content }
}

function p(...content: RichTextDocument[]): RichTextDocument {
  return { type: 'paragraph', content }
}

function text(t: string, ...marks: RichTextDocument['marks']): RichTextDocument {
  return marks?.length ? { type: 'text', text: t, marks } : { type: 'text', text: t }
}

function mark(type: string, attrs?: Record<string, unknown>): NonNullable<RichTextDocument['marks']>[number] {
  return attrs ? { type, attrs } : { type }
}

// ─── HTML renderer ────────────────────────────────────────────────────────────

describe('renderRichText', () => {
  describe('null / empty input', () => {
    it('returns empty string for null', () => {
      expect(renderRichText(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(renderRichText(undefined)).toBe('')
    })

    it('returns empty string for empty doc', () => {
      expect(renderRichText(doc())).toBe('')
    })
  })

  describe('paragraph', () => {
    it('wraps content in <p>', () => {
      expect(renderRichText(doc(p(text('Hello'))))).toBe('<p>Hello</p>')
    })

    it('renders empty paragraph', () => {
      expect(renderRichText(doc(p()))).toBe('<p></p>')
    })

    it('renders multiple paragraphs', () => {
      expect(renderRichText(doc(p(text('A')), p(text('B'))))).toBe('<p>A</p><p>B</p>')
    })
  })

  describe('heading', () => {
    it.each([1, 2, 3, 4, 5, 6])('renders h%i', (level) => {
      const node: RichTextDocument = { type: 'heading', attrs: { level }, content: [text('Title')] }
      expect(renderRichText(doc(node))).toBe(`<h${level}>Title</h${level}>`)
    })

    it('clamps level 0 to h1', () => {
      const node: RichTextDocument = { type: 'heading', attrs: { level: 0 }, content: [text('X')] }
      expect(renderRichText(doc(node))).toBe('<h1>X</h1>')
    })

    it('clamps level 7 to h6', () => {
      const node: RichTextDocument = { type: 'heading', attrs: { level: 7 }, content: [text('X')] }
      expect(renderRichText(doc(node))).toBe('<h6>X</h6>')
    })

    it('defaults missing level to h1', () => {
      const node: RichTextDocument = { type: 'heading', content: [text('X')] }
      expect(renderRichText(doc(node))).toBe('<h1>X</h1>')
    })
  })

  describe('text marks', () => {
    it('renders bold', () => {
      expect(renderRichText(doc(p(text('hi', mark('bold')))))).toBe('<p><strong>hi</strong></p>')
    })

    it('renders italic', () => {
      expect(renderRichText(doc(p(text('hi', mark('italic')))))).toBe('<p><em>hi</em></p>')
    })

    it('renders strike', () => {
      expect(renderRichText(doc(p(text('hi', mark('strike')))))).toBe('<p><s>hi</s></p>')
    })

    it('renders underline', () => {
      expect(renderRichText(doc(p(text('hi', mark('underline')))))).toBe('<p><u>hi</u></p>')
    })

    it('renders inline code', () => {
      expect(renderRichText(doc(p(text('hi', mark('code')))))).toBe('<p><code>hi</code></p>')
    })

    it('renders nested marks: bold wraps italic', () => {
      // marks[0] = outermost, marks[1] = innermost
      const result = renderRichText(doc(p(text('hi', mark('bold'), mark('italic')))))
      expect(result).toBe('<p><strong><em>hi</em></strong></p>')
    })

    it('ignores unknown mark types (passthrough)', () => {
      expect(renderRichText(doc(p(text('hi', mark('superscript')))))).toBe('<p>hi</p>')
    })
  })

  describe('textClass mark', () => {
    it('wraps in <span class>', () => {
      const result = renderRichText(doc(p(text('hi', mark('textClass', { class: 'highlight' })))))
      expect(result).toBe('<p><span class="highlight">hi</span></p>')
    })

    it('skips span when class is null', () => {
      const result = renderRichText(doc(p(text('hi', mark('textClass', { class: null })))))
      expect(result).toBe('<p>hi</p>')
    })
  })

  describe('link mark', () => {
    it('renders href', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { href: 'https://example.com' })))))
      expect(result).toBe('<p><a href="https://example.com">click</a></p>')
    })

    it('falls back to url when href is absent', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { url: 'https://example.com' })))))
      expect(result).toBe('<p><a href="https://example.com">click</a></p>')
    })

    it('falls back to url when href is empty string', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { href: '', url: 'https://example.com' })))))
      expect(result).toBe('<p><a href="https://example.com">click</a></p>')
    })

    it('falls back to # when both href and url are absent', () => {
      const result = renderRichText(doc(p(text('click', mark('link', {})))))
      expect(result).toBe('<p><a href="#">click</a></p>')
    })

    it('renders target and rel', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { href: '/x', target: '_blank', rel: 'noopener' })))))
      expect(result).toBe('<p><a href="/x" target="_blank" rel="noopener">click</a></p>')
    })
  })

  describe('URL scheme sanitizing', () => {
    it('neutralizes javascript: URLs in link href', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { href: 'javascript:alert(1)' })))))
      expect(result).toBe('<p><a href="#">click</a></p>')
    })

    it('neutralizes javascript: URLs hidden behind case and control characters', () => {
      const result = renderRichText(doc(p(text('click', mark('link', { href: 'JaVa\tScRiPt:alert(1)' })))))
      expect(result).toBe('<p><a href="#">click</a></p>')
    })

    it('neutralizes data: URLs in image src', () => {
      const result = renderRichText(doc({ type: 'image', attrs: { src: 'data:text/html,<script>1</script>' } }))
      expect(result).toBe('<img src="#">')
    })

    it('neutralizes disallowed schemes returned by internalLinkHandler', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', { content: 'abc' })))), {
        internalLinkHandler: () => 'vbscript:evil',
      })
      expect(result).toContain('href="#"')
    })

    it('allows http, https, mailto, tel and relative URLs by default', () => {
      for (const href of ['https://example.com', 'http://example.com', 'mailto:a@b.c', 'tel:+123', '/about', '#anchor', '//cdn.example.com/x']) {
        const result = renderRichText(doc(p(text('x', mark('link', { href })))))
        expect(result).toContain(`href="${href}"`)
      }
    })

    it('allows javascript: when explicitly whitelisted via allowedSchemes', () => {
      const result = renderRichText(doc(p(text('x', mark('link', { href: 'javascript:void(0)' })))), {
        allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript'],
      })
      expect(result).toContain('href="javascript:void(0)"')
    })

    it('restricts to a custom allowlist when one is provided', () => {
      const result = renderRichText(doc(p(text('x', mark('link', { href: 'http://example.com' })))), {
        allowedSchemes: ['https'],
      })
      expect(result).toContain('href="#"')
    })
  })

  describe('internalLink mark', () => {
    it('renders CMS format (content + anchor) without handler', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', {
        content: 'abc123',
        anchor: 'section1',
      })))))
      expect(result).toContain('data-type="internal"')
      expect(result).toContain('data-b10cks-internal-link')
      expect(result).toContain('data-content="abc123"')
      expect(result).toContain('data-anchor="section1"')
      expect(result).toContain('href="#"')
    })

    it('uses internalLinkHandler to resolve href', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', { content: 'abc123' })))), {
        internalLinkHandler: (attrs) => `/content/${attrs.content}`,
      })
      expect(result).toContain('href="/content/abc123"')
    })

    it('falls back to default href when handler returns null', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', { url: '/fallback', content: 'abc' })))), {
        internalLinkHandler: () => null,
      })
      expect(result).toContain('href="/fallback"')
    })

    it('falls back to href attr when url is absent (legacy format)', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', { href: '/legacy' })))))
      expect(result).toContain('href="/legacy"')
    })

    it('does not emit data-anchor when anchor is absent', () => {
      const result = renderRichText(doc(p(text('page', mark('internalLink', { content: 'abc' })))))
      expect(result).not.toContain('data-anchor')
    })
  })

  describe('blockquote', () => {
    it('wraps in <blockquote>', () => {
      expect(renderRichText(doc({ type: 'blockquote', content: [p(text('quote'))] }))).toBe('<blockquote><p>quote</p></blockquote>')
    })
  })

  describe('code block', () => {
    it('wraps in <pre><code>', () => {
      const node: RichTextDocument = { type: 'codeBlock', content: [text('const x = 1')] }
      expect(renderRichText(doc(node))).toBe('<pre><code>const x = 1</code></pre>')
    })

    it('adds data-language when present', () => {
      const node: RichTextDocument = { type: 'codeBlock', attrs: { language: 'typescript' }, content: [text('let x')] }
      expect(renderRichText(doc(node))).toBe('<pre><code data-language="typescript">let x</code></pre>')
    })
  })

  describe('lists', () => {
    it('renders bullet list', () => {
      const node: RichTextDocument = {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [p(text('A'))] },
          { type: 'listItem', content: [p(text('B'))] },
        ],
      }
      expect(renderRichText(doc(node))).toBe('<ul><li><p>A</p></li><li><p>B</p></li></ul>')
    })

    it('renders ordered list with default start', () => {
      const node: RichTextDocument = {
        type: 'orderedList',
        content: [{ type: 'listItem', content: [p(text('A'))] }],
      }
      expect(renderRichText(doc(node))).toBe('<ol><li><p>A</p></li></ol>')
    })

    it('renders ordered list with non-default start', () => {
      const node: RichTextDocument = {
        type: 'orderedList',
        attrs: { start: 5 },
        content: [{ type: 'listItem', content: [p(text('A'))] }],
      }
      expect(renderRichText(doc(node))).toBe('<ol start="5"><li><p>A</p></li></ol>')
    })

    it('renders a configured list style as a class on the bullet list', () => {
      const node: RichTextDocument = {
        type: 'bulletList',
        attrs: { className: 'checklist' },
        content: [{ type: 'listItem', content: [p(text('A'))] }],
      }
      expect(renderRichText(doc(node))).toBe('<ul class="checklist"><li><p>A</p></li></ul>')
    })

    it('renders a list style class alongside the start attribute on ordered lists', () => {
      const node: RichTextDocument = {
        type: 'orderedList',
        attrs: { className: 'roman', start: 5 },
        content: [{ type: 'listItem', content: [p(text('A'))] }],
      }
      expect(renderRichText(doc(node))).toBe('<ol class="roman" start="5"><li><p>A</p></li></ol>')
    })

    it('accepts a plain class attribute on list items', () => {
      const node: RichTextDocument = {
        type: 'bulletList',
        content: [{ type: 'listItem', attrs: { class: 'task' }, content: [p(text('A'))] }],
      }
      expect(renderRichText(doc(node))).toBe('<ul><li class="task"><p>A</p></li></ul>')
    })
  })

  describe('hardBreak / horizontalRule', () => {
    it('renders <br>', () => {
      expect(renderRichText(doc(p(text('a'), { type: 'hardBreak' }, text('b'))))).toBe('<p>a<br>b</p>')
    })

    it('renders <hr>', () => {
      expect(renderRichText(doc({ type: 'horizontalRule' }))).toBe('<hr>')
    })
  })

  describe('image', () => {
    it('renders <img> with src', () => {
      const node: RichTextDocument = { type: 'image', attrs: { src: '/photo.jpg' } }
      expect(renderRichText(doc(node))).toBe('<img src="/photo.jpg">')
    })

    it('renders alt and title', () => {
      const node: RichTextDocument = { type: 'image', attrs: { src: '/photo.jpg', alt: 'A photo', title: 'Photo' } }
      expect(renderRichText(doc(node))).toBe('<img src="/photo.jpg" alt="A photo" title="Photo">')
    })
  })

  describe('table', () => {
    it('renders a simple table', () => {
      const node: RichTextDocument = {
        type: 'table',
        content: [{
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [p(text('Name'))] },
            { type: 'tableCell', content: [p(text('Alice'))] },
          ],
        }],
      }
      expect(renderRichText(doc(node))).toBe('<table><tr><th><p>Name</p></th><td><p>Alice</p></td></tr></table>')
    })

    it('renders colspan and rowspan', () => {
      const node: RichTextDocument = {
        type: 'table',
        content: [{
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { colspan: 2, rowspan: 3 }, content: [p(text('merged'))] },
          ],
        }],
      }
      expect(renderRichText(doc(node))).toContain('<td colspan="2" rowspan="3">')
    })

    it('omits colspan/rowspan when value is 1', () => {
      const node: RichTextDocument = {
        type: 'table',
        content: [{
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [p(text('x'))] },
          ],
        }],
      }
      const result = renderRichText(doc(node))
      expect(result).not.toContain('colspan')
      expect(result).not.toContain('rowspan')
    })
  })

  describe('placeholderToken', () => {
    it('renders fallback span without handler', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'companyName', label: '{companyName}' } }
      expect(renderRichText(doc(p(node)))).toBe('<p><span data-type="placeholder-token" data-key="companyName" data-label="{companyName}"></span></p>')
    })

    it('resolves value from handler', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'companyName', label: '{companyName}' } }
      const result = renderRichText(doc(p(node)), {
        placeholderHandler: (key) => key === 'companyName' ? 'Google Inc' : null,
      })
      expect(result).toBe('<p>Google Inc</p>')
    })

    it('falls back to span when handler returns null', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'unknown', label: '{unknown}' } }
      const result = renderRichText(doc(p(node)), {
        placeholderHandler: () => null,
      })
      expect(result).toContain('data-type="placeholder-token"')
    })

    it('html-escapes the resolved value', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'x', label: '{x}' } }
      const result = renderRichText(doc(p(node)), {
        placeholderHandler: () => '<b>bold</b>',
      })
      expect(result).toBe('<p>&lt;b&gt;bold&lt;/b&gt;</p>')
    })
  })

  describe('unknown node type', () => {
    it('renders children without a wrapper', () => {
      const node: RichTextDocument = { type: 'customWidget', content: [p(text('inside'))] }
      expect(renderRichText(doc(node))).toBe('<p>inside</p>')
    })
  })

  describe('security: HTML escaping', () => {
    it('escapes < > & " in text content', () => {
      const result = renderRichText(doc(p(text('<script>alert("xss")</script>'))))
      expect(result).toBe('<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>')
      expect(result).not.toContain('<script>')
    })

    it('escapes < > & " in link href', () => {
      const result = renderRichText(doc(p(text('x', mark('link', { href: '"><script>alert(1)</script>' })))))
      expect(result).not.toContain('<script>')
    })

    it('escapes special chars in image src', () => {
      // The injection payload contains `"` which would break out of the attribute.
      // After escaping it becomes &quot; — the `"` can't close the attribute.
      const node: RichTextDocument = { type: 'image', attrs: { src: '"><img onerror=alert(1)>' } }
      const result = renderRichText(doc(node))
      expect(result).not.toContain('"><img')   // raw breakout sequence is gone
      expect(result).toContain('&quot;&gt;')   // the chars are encoded instead
    })

    it('escapes special chars in link title', () => {
      // The payload opens with `"` to break out of the title attribute.
      // After escaping the `"` becomes &quot; — the attack can't escape the attribute.
      const result = renderRichText(doc(p(text('x', mark('link', { href: '/x', title: '"onmouseover=alert(1)' })))))
      expect(result).not.toContain('" onmouseover')  // raw breakout sequence is gone
      expect(result).toContain('&quot;onmouseover')  // encoded safely inside the attribute
    })
  })

  describe('createRichTextRenderer', () => {
    it('creates a reusable renderer', () => {
      const renderer = createRichTextRenderer()
      expect(renderer.render(doc(p(text('Hello'))))).toBe('<p>Hello</p>')
      expect(renderer.render(null)).toBe('')
    })

    it('persists options across calls', () => {
      const renderer = createRichTextRenderer({
        internalLinkHandler: (attrs) => `/resolved/${attrs.content}`,
      })
      const linkDoc = doc(p(text('x', mark('internalLink', { content: 'abc' }))))
      expect(renderer.render(linkDoc)).toContain('href="/resolved/abc"')
    })
  })
})

// ─── Text renderer ────────────────────────────────────────────────────────────

describe('renderRichTextAsText', () => {
  it('returns empty string for null', () => {
    expect(renderRichTextAsText(null)).toBe('')
  })

  it('extracts plain text from a paragraph', () => {
    expect(renderRichTextAsText(doc(p(text('Hello world'))))).toBe('Hello world')
  })

  it('separates blocks with double newline by default', () => {
    expect(renderRichTextAsText(doc(p(text('A')), p(text('B'))))).toBe('A\n\nB')
  })

  it('respects custom blockSeparator', () => {
    expect(renderRichTextAsText(doc(p(text('A')), p(text('B'))), { blockSeparator: ' ' })).toBe('A B')
  })

  it('strips marks (returns raw text)', () => {
    expect(renderRichTextAsText(doc(p(text('bold', mark('bold')))))).toBe('bold')
  })

  it('renders hard break as \\n', () => {
    expect(renderRichTextAsText(doc(p(text('a'), { type: 'hardBreak' }, text('b'))))).toBe('a\nb')
  })

  it('does not add trailing separator', () => {
    const result = renderRichTextAsText(doc(p(text('only'))))
    expect(result).toBe('only')
    expect(result.endsWith('\n\n')).toBe(false)
  })

  it('handles nested content (heading + paragraph)', () => {
    const h: RichTextDocument = { type: 'heading', attrs: { level: 1 }, content: [text('Title')] }
    expect(renderRichTextAsText(doc(h, p(text('Body'))))).toBe('Title\n\nBody')
  })

  describe('placeholderToken', () => {
    it('emits resolved value when handler returns one', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'name', label: '{name}' } }
      const result = renderRichTextAsText(doc(p(text('Hello '), node, text('!'))), {
        placeholderHandler: (key) => key === 'name' ? 'Alice' : null,
      })
      expect(result).toBe('Hello Alice!')
    })

    it('emits nothing when handler returns null', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'x', label: '{x}' } }
      const result = renderRichTextAsText(doc(p(text('Hello '), node, text('!'))), {
        placeholderHandler: () => null,
      })
      expect(result).toBe('Hello !')
    })

    it('emits nothing without handler', () => {
      const node: RichTextDocument = { type: 'placeholderToken', attrs: { key: 'x', label: '{x}' } }
      const result = renderRichTextAsText(doc(p(text('start '), node, text(' end'))))
      expect(result).toBe('start  end')
    })
  })

  describe('createRichTextTextRenderer', () => {
    it('creates a reusable text renderer', () => {
      const renderer = createRichTextTextRenderer({ blockSeparator: ' | ' })
      expect(renderer.render(doc(p(text('A')), p(text('B'))))).toBe('A | B')
      expect(renderer.render(null)).toBe('')
    })
  })
})
