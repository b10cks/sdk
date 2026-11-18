import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

import { useRuntimeConfig } from '#imports'

import { withBaseURL, withoutBaseURL, withRequestQuery } from '../redirectCache'
import { resolveB10cksRedirect } from '../resolveB10cksRedirect'

/** Answers a request whose path has a b10cks redirect, before anything renders. */
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const url = getRequestURL(event)
  // The visual editor previews drafts. A redirect would move it off the entry being edited.
  if (url.searchParams.has('b10cks_vid')) return

  const { baseURL } = useRuntimeConfig(event).app
  const hit = await resolveB10cksRedirect(withoutBaseURL(url.pathname, baseURL), event)
  if (hit) {
    const target = withRequestQuery(withBaseURL(hit.target, baseURL), url.search)
    return sendRedirect(event, target, hit.status_code || 301)
  }
})
