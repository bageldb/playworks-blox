import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Pure payload preparation: source reads only; never calls App or publishes pages.
const views = fileURLToPath(new URL('../../play-works/src/views/', import.meta.url))
const assets = '/playworks/assets/'
const sourceViews = new Set(['Games', 'Team', 'Careers', 'Why', 'Tvchannels', 'Advergaming', 'Partners', 'Contact', 'Support', 'Terms', 'Privacypolicy'])
function template(view) {
  if (!sourceViews.has(view)) throw new Error('Unsupported source view')
  return readFileSync(`${views}${view}.vue`, 'utf8').split('</template>')[0]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replaceAll('../assets/', assets)
}
function between(view, start, end) {
  const source = template(view)
  const from = source.indexOf(start)
  const to = source.indexOf(end, from + start.length)
  if (from < 0 || to < 0) throw new Error(`Source layout changed: ${view}: ${start}`)
  return source.slice(from, to).trim()
}
const block = (kind, props = {}) => ({ type: 'PlayContent', props: { kind, asset_base: assets, ...props } })
const html = value => block('html', { html: value })
const grid = (kind, collection, extra = {}) => block(kind, { collection, ...extra })
const bound = (kind, context = '$page') => ({ ...block(kind), data_bindings: { article: context } })
function page(slug, title, blocks, data_bindings = {}) {
  return {
    slug, title, status: 'draft', data_bindings,
    content: { blocks: [
      { type: 'PlayNavigation', props: {} },
      ...blocks,
      { type: 'PlayFooter', props: {} },
    ] },
  }
}
const binding = (collection, bind_by = 'slug') => ({ adapter: 'datastore', store: 'playworks', collection, bind_by })
function sourceItems(snapshot, name) {
  const rows = snapshot?.collections?.[name]
  if (!Array.isArray(rows)) throw new Error(`Missing snapshot collection: ${name}`)
  return rows.filter(row => row.draft !== true)
}
function form(view) {
  const source = template(view)
  const options = [...source.matchAll(/<option value="([^"]+)"/g)]
    .map(match => ({ label: match[1], value: match[1] }))
  return {
    type: 'FormBlock',
    props: {
      form_name: `playworks-${view.toLowerCase()}`, submit_label: 'Send',
      fields: [
        { name: 'name', title: 'Name', kind: 'text', required: true },
        { name: 'subject', title: 'Subject', kind: 'text', required: true },
        { name: 'message', title: 'Message', kind: 'textarea', required: true },
        { name: 'email', title: 'Email', kind: 'email', required: true },
        { name: 'platform', title: 'Platform', kind: 'choice', required: true, options },
      ],
    },
  }
}

/**
 * Build editable draft pages from the reviewed public export.
 * List blocks read live `playworks` collections through Blox useData/listItems.
 * Detail pages remain templates: Blox expands {slug} against the bound collection.
 * No editorial record is copied into component defaults or page props.
 */
export function createPages(snapshot) {
  for (const name of ['games', 'team', 'creators', 'tvChannels', 'careers', 'faq', 'news', 'newsletter', 'videoPages', 'legal']) sourceItems(snapshot, name)
  const pages = [
    page('/games', 'Games', [
      html(between('Games', '<div class="games-bg">', '<div class="games-wrap">')),
      grid('games', 'games'),
    ]),
    page('/team', 'Team', [
      html(between('Team', '<div class="faq-page-wrap">', '<div class="team-wrap">')),
      grid('team', 'team'),
    ]),
    page('/news', 'News', [
      grid('news', 'news', { title: 'News', path_prefix: '/news/' }),
      grid('news', 'newsletter', { title: 'Newsletter', path_prefix: '/newsletter/' }),
    ]),
    page('/news/{slug}', 'News article', [bound('article')], { $page: binding('news') }),
    page('/newsletter/{slug}', 'Newsletter', [bound('article')], { $page: binding('newsletter') }),
    page('/video/{slug}', 'Video', [bound('video')], { $page: binding('videoPages') }),
    page('/faq', 'FAQ', [grid('faq', 'faq', { title: 'FAQ' })]),
    page('/advergaming', 'AdverGaming', [
      html(between('Advergaming', '<div class="faq-page-wrap center">', '<botfooter')),
    ]),
    page('/partners', 'Partners', [
      html(between('Partners', '<div class="big-vid-wrap top">', '<botfooter')),
    ]),
    page('/careers', 'Careers', [
      html(`${between('Careers', '<div class="games-bg">', '<div v-for="(singleCareer, name)')} </div></div></div>`),
      grid('careers', 'careers'),
    ]),
    page('/why-ctv', 'Why Connected TV?', [
      html(between('Why', '<div class="why-top">', '<div class="faq-sec">')),
      grid('faq', 'faq', { title: 'FAQ' }),
      html(between('Why', '<div class="youtubevideo">', '<botfooter')),
    ]),
    page('/tv-channels', 'TV Channels', [
      html(between('Tvchannels', '<div class="top-tv">', '<div class="tv-ch-sec">')),
      grid('channels', 'tvChannels'),
      html(between('Tvchannels', '<div class="big-vid-wrap">', '<div class="stars-wrap">')),
      grid('creators', 'creators'),
      html(between('Tvchannels', '<p class="stars-txt">', '<botfooter')),
    ]),
  ]
  for (const [view, slug, title] of [['Contact', '/contact-us', 'Let’s Connect'], ['Support', '/support', 'Support']]) {
    pages.push(page(slug, title, [
      html(`${between(view, '<div class="faq-page-wrap">', '<div class="form-wrap">')}</div></div>`),
      form(view),
    ]))
  }
  pages.push(page('/tv-games', 'Support', structuredClone(pages.find(item => item.slug === '/support').content.blocks.slice(1, -1))))
  const legal = sourceItems(snapshot, 'legal')
  for (const item of legal) {
    const isTerms = (item.source_id ?? item._id) === '6267c58e2d0dad08eb02321a'
    const slug = isTerms ? 'terms' : item.slug
    if (!slug || (!isTerms && !slug.startsWith('privacy-'))) continue
    // Concrete legal paths have no bind parameter: select their live record by
    // original slug, or the original fixed identity for Terms.
    pages.push(page(`/${slug}`, item.title || (isTerms ? 'Terms' : 'Privacy policy'), [
      block('legal', { collection: 'legal', record_slug: item.slug, record_source_id: isTerms ? '6267c58e2d0dad08eb02321a' : '' }),
      html(between(isTerms ? 'Terms' : 'Privacypolicy', '<div class="legal-bg">', '<botfooter')),
    ]))
  }
  return pages
}

export const redirects = [
  { from_path: '/lets-play', to_path: '/contact-us', status_code: 301 },
]
export const routeContract = {
  original: ['/games', '/tv-channels', '/team', '/news', '/news/:slug', '/newsletter/:slug', '/video/:slug', '/careers', '/advergaming', '/why-ctv', '/partners', '/faq', '/contact-us', '/support', '/tv-games', '/privacy-*', '/terms'],
  excluded: ['/old-home', '/home-preview', '/tv-channels-preview', '/contest', '/creature-competition'],
  assets,
  store: 'playworks',
}
