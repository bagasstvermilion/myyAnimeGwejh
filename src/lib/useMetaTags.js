import { useEffect } from 'react'

const SITE_NAME = 'MyAnimeGwe'

// sets a per-page <title> and meta description — without this, every route
// in the SPA shares the same static tags from index.html, which search
// engines treat as duplicate content across pages. `title` is expected to
// already include the site name (e.g. "My List - MyAnimeGwe").
export function useMetaTags(title, description) {
  useEffect(() => {
    document.title = title || SITE_NAME

    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
  }, [title, description])
}

// keeps admin/private pages (and anything else login-gated and irrelevant
// to search) out of Google/Bing entirely — robots.txt alone only stops
// crawling, it doesn't guarantee a page won't still show up as a bare,
// title-less result if something links to it
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex, nofollow')

    return () => meta.remove()
  }, [])
}
