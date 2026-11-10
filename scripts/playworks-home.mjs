import { readFileSync } from 'node:fs'

const asset = name => `/playworks/${name}`
const block = (type, props = {}) => ({ type, props })
const image = value => value?.imageURL || ''

export function createHomepage(snapshot) {
  const collections = snapshot.collections
  const top = collections.topGraphicsAnimation[0]
  if (!top?.mainVideoLink) throw new Error('Missing original homepage video')
  const homeSource = readFileSync(new URL('../../play-works/src/views/Home.vue', import.meta.url), 'utf8')
  const gamesIntro = homeSource.match(/<div class="w900">([\s\S]*?)<\/div>/)?.[1]
  if (!gamesIntro) throw new Error('Missing original games introduction')
  const partners = collections.partners.filter(row => row.bigLogo || !row.draft)
  const news = collections.news.filter(row => row.featured && row.live && !row.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  const original = JSON.parse(readFileSync(new URL('../../play-works/localData.json', import.meta.url), 'utf8'))
  const featured = [...(top.featuredGame || original.topGraph?.featuredGame || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  return {
    slug: '/', title: 'Play.Works', status: 'draft',
    meta_title: 'Play.Works is the #1 provider of CTV Games and Original TV Channels.',
    content: { blocks: [
      block('PlayNavigation'),
      block('MediaHero', { video: top.mainVideoLink, title: top.onVideoHeader || '', subtitle: top.onVideoSubtitle || '', cta_label: top.onVideoCTA || '', cta_href: top.onVideoCTALink || '' }),
      block('PlayIntro', { title: 'Games - Creators - TV', subtitle: "It's Play.Works", stats: [
        { value: 150, suffix: '+', label: 'Creators' },
        { value: 400, suffix: '+', label: 'Games' },
        { value: 400, suffix: 'M+', label: 'Homes' },
      ] }),
      block('ImageMarquee', Object.fromEntries([['line_one', 'lineOne'], ['line_two', 'lineTwo']].map(([key, source]) => [
        key, (top[source] || []).map(item => ({ image: image(item), alt: item.altText || '' })),
      ]))),
      block('EditorialSpotlight', { items: news.map(item => ({
        title: item.title, image: image(item.image), body: item.content,
        date: new Date(item.date).toLocaleDateString('en-US', { timeZone: 'UTC' }), href: `/news/${item.slug}`,
      })), cta_label: 'Read More', cta_href: '/news' }),
      block('BrandLogoGrid', { title: 'Partners', body: 'Play.Works has long-standing relationships with the biggest and most innovative TV platforms in the world.',
        items: partners.map(item => ({ name: item.name, image: image(item.logo), size: item.bigLogo ? 'large' : 'small' })),
      }),
      block('PlayCreators', { title: 'Driving Significant Revenue for Creators', image: image(top.creatorsSectionImage),
        image_alt: top.creatorsSectionImage?.altText || '', body: top.creatorsSectionText,
        decoration: asset('pattern1 blue copy 144.svg'), cta_label: 'More', cta_href: '/tv-channels#stars',
      }),
      block('PlayGames', { title: 'A Global Leader in\nCasual Gaming on TV', body: gamesIntro,
        items: featured.map(item => ({ title: item.name, image: image(item.icon), body: item.aboutGame })),
        cta_label: 'All Games', cta_href: '/games',
      }),
      block('VideoEmbed', { src: 'https://cdn.jwplayer.com/players/sWEcVjTL-4DULHiTS.html', title: 'Play.Works showreel', overlap: 'overlap' }),
      block('PlayFooter'),
    ] },
  }
}

export const globalBlocks = [
  { type: 'PlayNavigation', props: {
    logo: asset('logo-top.svg'), logo_alt: 'Play.Works', home_href: '/',
    menu_label: 'Open menu', close_label: 'Close menu', cta_label: 'Contact Us', cta_href: '/contact-us',
    groups: [
      { label: 'Games', decoration: asset('pattern1 blue copy.svg'), links: [
        { label: 'Games', href: '/games' }, { label: 'AdverGaming', href: '/advergaming' },
      ] },
      { label: 'Video', decoration: asset('pattern1 blue copy 143.svg'), links: [
        { label: 'TV Channels', href: '/tv-channels' }, { label: 'AVOD', href: '/tv-channels#AVOD' },
        { label: 'FAST', href: '/tv-channels#FAST' }, { label: 'Our Stars', href: '/tv-channels#stars' },
        { label: 'Ready for Primetime', href: '/tv-channels#Primetime' },
      ] },
      { label: 'About', decoration: asset('pattern1 blue copy 2.svg'), links: [
        { label: 'Team', href: '/team' }, { label: 'News', href: '/news' },
        { label: 'Careers', href: '/careers' }, { label: 'Support', href: '/support' },
      ] },
    ],
  } },
  { type: 'PlayFooter', props: {
    links: [
      { label: 'Terms', href: '/terms', tone: 'plain' },
      { label: 'Privacy Policy', href: '/privacy-policy', tone: 'red' },
      { label: 'Kids Privacy Policy', href: '/privacy-policy-kids', tone: 'red' },
    ], credit_image: asset('bagel.svg'), credit_alt: 'Bagel Studio', credit_href: 'https://bagelstudio.co.il/',
  } },
]
