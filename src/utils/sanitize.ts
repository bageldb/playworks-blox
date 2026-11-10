import sanitize from 'sanitize-html'

/** Same allowlist on the server and in the browser; no DOM-dependent bypass. */
export function sanitizeHtml(value: unknown): string {
  if (typeof value !== 'string') return ''
  return sanitize(value, {
    allowedTags: [...sanitize.defaults.allowedTags, 'img', 'video', 'source'],
    allowedAttributes: {
      '*': ['class', 'id'],
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      video: ['src', 'poster', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'preload'],
      source: ['src', 'type'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, ...(attributes.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) },
      }),
    },
  })
}
