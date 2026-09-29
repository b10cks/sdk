/**
 * Cleanup for HTML pasted from Microsoft Word and Office, ported from the CMS
 * editor so a paste in the preview yields the same document. Word emits nested
 * spans, namespaced tags (`<o:p>`), conditional comments and `mso-*` styles
 * that would otherwise leak into the document, e.g. as `textClass` marks.
 * Anything that doesn't look like Office HTML passes through untouched.
 */

const WORD_MARKERS =
  /(?:urn:schemas-microsoft-com|<o:p|<\/o:p|mso-|class=["']?Mso|WordDocument|<xml>)/i

/** Namespaced and metadata elements dropped along with their text. */
const DROP_TAGS = new Set(['STYLE', 'META', 'LINK', 'XML', 'O:P', 'W:SDT', 'V:SHAPETYPE'])

export function transformPastedHtml(html: string): string {
  return WORD_MARKERS.test(html) ? cleanWordHtml(html) : html
}

function cleanWordHtml(html: string): string {
  // Word wraps fallbacks in `<!--[if gte mso 9]> … <![endif]-->` comments.
  const withoutComments = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  const doc = new DOMParser().parseFromString(withoutComments, 'text/html')

  reconstructLists(doc.body, doc)
  for (const child of Array.from(doc.body.children)) cleanElement(child)
  return doc.body.innerHTML
}

function isListParagraph(el: Element | undefined): el is HTMLParagraphElement {
  if (el?.tagName !== 'P') return false
  const cls = el.getAttribute('class') || ''
  const style = el.getAttribute('style') || ''
  return /MsoListParagraph/i.test(cls) || /mso-list\s*:/i.test(style)
}

/**
 * Word writes lists as flat `<p class=MsoListParagraph>` paragraphs whose first
 * run is the bullet or number. Group consecutive ones into a real `<ul>` or
 * `<ol>` and strip the leading marker.
 */
function reconstructLists(container: HTMLElement, doc: Document): void {
  const children = Array.from(container.children)
  for (let i = 0; i < children.length; i++) {
    const group: HTMLParagraphElement[] = []
    for (let next = children[i]; isListParagraph(next); next = children[i + group.length]) {
      group.push(next)
    }
    const [first] = group
    if (!first) continue

    // Ordered when the first visible glyph is a number, like "1." or "2)".
    const ordered = /^[0-9]+[.)]/.test((first.textContent || '').trimStart())
    const list = doc.createElement(ordered ? 'ol' : 'ul')
    for (const p of group) {
      p.querySelector('span[style*="mso-list"]')?.remove()
      const li = doc.createElement('li')
      li.innerHTML = p.innerHTML.replace(/^\s*(?:[0-9]+[.)]|[•·▪◦‣o-])\s*/, '')
      list.appendChild(li)
    }

    first.replaceWith(list)
    for (const p of group.slice(1)) p.remove()
    i += group.length - 1
  }
}

function cleanElement(el: Element): void {
  // Depth-first, so unwrapping and removing on the way up is safe.
  for (const child of Array.from(el.children)) cleanElement(child)

  if (DROP_TAGS.has(el.tagName) || el.tagName.includes(':')) {
    el.remove()
    return
  }

  for (const name of ['class', 'style', 'lang', 'align']) el.removeAttribute(name)

  // Collapse the empty spans Word scatters around every run.
  if (el.tagName === 'SPAN' && el.attributes.length === 0) {
    el.replaceWith(...Array.from(el.childNodes))
  }
}
