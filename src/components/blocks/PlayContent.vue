<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { defineBlock, useBloxApi, useData } from '@bagelink/blox'
import { Btn, defineSchema, $ } from '@bagelink/vue'
import { sanitizeHtml } from '@/utils/sanitize'

interface Item {
  [key: string]: unknown
  _id?: string
  id?: string
  slug?: string
  name?: string
  title?: string
  question?: string
  answer?: string
  body?: string
  content?: string
  bio?: string
  info?: string
  aboutGame?: string
  subHeader?: string
  contactUs?: string
  videoLink?: string
  videoSrc?: string
  date?: string
  _createdDate?: string
  source_order?: number
  draft?: boolean
}
interface Props {
  kind?: string
  title?: string
  html?: string
  collection?: string
  items?: Item[]
  article?: Item
  path_prefix?: string
  back_label?: string
  close_label?: string
  asset_base?: string
  record_slug?: string
  record_source_id?: string
}
const schema = defineSchema({
  kind: $.select('Layout', ['html', 'games', 'team', 'creators', 'channels', 'news', 'careers', 'faq', 'article', 'legal', 'video'].map(value => ({ label: value, value }))),
  title: $.text('Section heading'),
  html: $.textarea('Original rich content'),
  collection: $.text('Datastore collection'),
  path_prefix: $.text('Detail URL prefix'),
  back_label: $.text('Back label'),
  close_label: $.text('Close label'),
  asset_base: $.text('Original asset directory'),
  record_slug: $.text('Record slug'),
  record_source_id: $.text('Original record identity'),
  items: $.array('Items', defineSchema({
    name: $.text('Name'), title: $.text('Title'), slug: $.text('Slug'),
    question: $.text('Question'), answer: $.textarea('Answer'),
    content: $.textarea('Content'), body: $.textarea('Body'),
  })),
})
defineBlock({
  name: 'PlayContent', label: 'Play.Works content', category: 'content',
  description: 'Original Play.Works layouts with editable rich copy and live public collections.',
  schema, defaults: {},
  dataSource: ['games', 'team', 'creators', 'tvChannels', 'careers', 'faq', 'news', 'newsletter', 'videoPages', 'legal'].map(collection => ({ collection, store: 'playworks' })),
})
const props = withDefaults(defineProps<Props>(), {
  kind: 'html', back_label: 'Back', close_label: 'Close', asset_base: '/playworks/assets/',
})
const api = useBloxApi()
const { data: records, error } = useData(
  () => `playworks:${props.collection || ''}`,
  async () => {
    if (!props.collection || props.items !== undefined || !api) return []
    const all: Item[] = []
    let total = Infinity
    while (all.length < total) {
      const page = await api.listItems<Item>(props.collection, { offset: all.length, limit: 100 })
      all.push(...page.items)
      total = page.total
      if (!page.items.length) break
    }
    return all
  },
  { default: [] as Item[] },
)
const items = computed(() => [...(props.items ?? records.value)]
  .filter(item => item.draft !== true)
  .sort((a, b) => (a.source_order ?? 0) - (b.source_order ?? 0)))
const article = computed(() => props.article ?? items.value.find(item =>
  props.record_source_id ? item.source_id === props.record_source_id || item._id === props.record_source_id
    : props.record_slug ? item.slug === props.record_slug : false) ?? {})
const opened = ref('')
const heights = ref<Record<string, number>>({})
const key = (item: Item, index: number) => String(item.id ?? item._id ?? item.slug ?? index)
const html = (value: unknown) => sanitizeHtml(typeof value === 'string' ? value : '')
function url(value: unknown): string {
  const raw = typeof value === 'string' ? value : value && typeof value === 'object'
    ? String((value as Record<string, unknown>).imageURL ?? (value as Record<string, unknown>).url ?? '') : ''
  return /^(?:https?:\/\/|\/(?!\/)|mailto:)/i.test(raw.trim()) ? raw.trim() : ''
}
function embed(value: unknown): string {
  const raw = url(value)
  if (!raw || /\.(mp4|webm|ogg|ogv|mov|m4v)(?:$|[?#])/i.test(raw)) return ''
  try {
    const parsed = new URL(raw)
    if (!['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'vimeo.com', 'cdn.jwplayer.com'].includes(parsed.hostname)) return ''
    return parsed.href.replace(/\/players\/([^/?#]+)\.js(?:\?[^#]*)?$/, '/players/$1.html')
  } catch { return '' }
}
async function toggle(id: string, event: MouseEvent) {
  opened.value = opened.value === id ? '' : id
  await nextTick()
  const card = (event.currentTarget as HTMLElement)?.closest('[data-play-card]')
  const panel = card?.querySelector<HTMLElement>('[data-play-panel]')
  if (panel) heights.value[id] = panel.getBoundingClientRect().height
  if (opened.value && card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
function date(item: Item): string {
  const dateValue = item.date ?? item._createdDate
  if (!dateValue) return ''
  const result = new Date(dateValue)
  return Number.isNaN(result.valueOf()) ? '' : result.toLocaleDateString('en-US', { timeZone: 'UTC' })
}
const careerGroups = computed(() => {
  const groups: Record<string, Item[]> = {}
  for (const item of items.value) {
    const location = item.location as { value?: string } | undefined
    ;(groups[location?.value || 'Flexible'] ??= []).push(item)
  }
  return groups
})
</script>

<template>
  <section class="playworks" :data-play-kind="props.kind">
    <div v-if="props.kind === 'html'" v-html="html(props.html)" />
    <div v-else-if="['games', 'team', 'creators'].includes(props.kind)" :class="props.kind === 'team' ? 'team-wrap' : props.kind === 'creators' ? 'stars-wrap' : 'games-wrap'">
      <div v-for="(item, index) in items" :key="key(item, index)" data-play-card :class="props.kind === 'team' ? 'teambox-wrap' : props.kind === 'creators' ? 'star-box' : 'game-box'">
        <div :class="[{ gameopen: opened === key(item, index), openteam: opened === key(item, index), openstar: opened === key(item, index) }, props.kind === 'team' ? 'team-box' : props.kind === 'creators' ? 'star-box-inner' : '']">
          <div :class="props.kind === 'team' ? 'team-inner-box' : 'game-inner-box'">
            <Btn flat class="play-card-toggle" :aria-expanded="opened === key(item, index)" :aria-controls="`play-panel-${kind}-${key(item, index)}`" @click="toggle(key(item, index), $event)">
              <img :src="url(item.icon ?? item.profile ?? item.thumbnail)" :alt="item.name || ''" :class="props.kind === 'team' ? 'team-img' : props.kind === 'creators' ? 'star-img' : 'game-img'" />
              <template v-if="props.kind !== 'games'">
                <span :class="props.kind === 'team' ? 'team-name-wrap' : 'star-name'">{{ item.name }}</span>
                <span v-if="props.kind === 'team'" class="team-title">{{ item.title }}</span>
                <span v-else class="subs-wrap">{{ item.youtube || item.instagramFollowers || item.tickTokFollowers || item.generalFollowers }}</span>
              </template>
              <span class="list-drop-tri" :class="{ game: props.kind === 'games', star: props.kind === 'creators' }" />
            </Btn>
            <a v-if="props.kind === 'team' && url(item.linkedinLink)" :href="url(item.linkedinLink)" class="team-linkedin" target="_blank" rel="noopener noreferrer">
              <img :src="`${props.asset_base}linkedin.svg`" alt="LinkedIn" />
            </a>
          </div>
          <div v-if="opened === key(item, index)" :id="`play-panel-${kind}-${key(item, index)}`" data-play-panel :class="props.kind === 'team' ? 'list-drop-wrap' : 'list-drop-box game'">
            <div v-if="props.kind === 'team'" class="list-drop-box" v-html="html(item.bio)" />
            <template v-else>
              <img v-if="url(item.bigImage)" :src="url(item.bigImage)" :alt="item.name || ''" class="game-big-img" />
              <div class="game-drop-txt-wrap">
                <h4 class="txt60 blue-txt">{{ item.name }}</h4>
                <div class="txt18" v-html="html(item.aboutGame ?? item.content)" />
              </div>
            </template>
            <Btn flat :value="props.close_label" @click="opened = ''" />
          </div>
        </div>
        <div v-if="opened === key(item, index)" class="ghost" :style="{ height: `${heights[key(item, index)] || 0}px` }" />
      </div>
    </div>
    <div v-else-if="props.kind === 'faq'" class="faq-page-wrap">
      <div v-if="props.title" class="side-head-wrap top-page"><h1 class="txt60">{{ props.title }}</h1></div>
      <div class="faq-page-box">
        <div v-for="(item, index) in items" :key="key(item, index)" class="faq-box" :class="{ 'faq-open': opened === key(item, index) }">
          <Btn flat class="faq-q" :aria-expanded="opened === key(item, index)" :aria-controls="`faq-${key(item, index)}`" @click="opened = opened === key(item, index) ? '' : key(item, index)">
            <span class="faq-marks"><img :src="`${props.asset_base}plus.svg`" class="mark-pls" alt="" /><img :src="`${props.asset_base}min.svg`" class="mark-min" alt="" /></span>
            {{ item.question }}
          </Btn>
          <div :id="`faq-${key(item, index)}`" v-show="opened === key(item, index)" class="faq-a" v-html="html(item.answer)" />
        </div>
      </div>
    </div>
    <div v-else-if="props.kind === 'channels'" class="tv-ch-sec">
      <div v-for="(item, index) in items" :key="key(item, index)" class="tv-ch-box">
        <div v-if="url(item.videoSrc || item.videoLink)" class="tv-ch-media">
          <iframe v-if="!item.videoSrc && embed(item.videoLink)" :src="embed(item.videoLink)" :title="item.title || item.name || 'Channel video'" allowfullscreen />
          <video v-else playsinline autoplay muted loop :poster="url(item.poster)" :src="url(item.videoSrc || item.videoLink)" />
        </div>
        <div class="txt20 light" v-html="html(item.body)" />
      </div>
    </div>
    <div v-else-if="props.kind === 'news'" class="news-wrap">
      <h1 v-if="props.title" class="txt90 red">{{ props.title }}</h1>
      <a v-if="items.length && props.path_prefix !== '/newsletter/'" :href="`${props.path_prefix}${items[0].slug}`" class="news-top-box">
        <img :src="url(items[0].image)" :alt="items[0].title || ''" class="news-top-box-img" />
        <div class="news-top-box-txt-wrap"><h2>{{ items[0].title }}</h2><div class="txt18 ellipsis" v-html="html(items[0].content)" /><p>{{ date(items[0]) }}</p></div>
      </a>
      <div class="news-boxs-wrap">
        <a v-for="(item, index) in items.slice(props.path_prefix === '/newsletter/' ? 0 : 1)" :key="key(item, index)" :href="`${props.path_prefix}${item.slug}`" class="news-small-box">
          <img :src="url(item.image) || `${props.asset_base}empty.jpg`" :alt="item.title || ''" class="news-small-box-img" />
          <p class="news-small-box-txt">{{ item.title }}</p><p class="news-small-box-date">{{ date(item) }}</p>
        </a>
      </div>
    </div>
    <div v-else-if="props.kind === 'careers'" class="careers-wrap">
      <div v-for="(group, location) in careerGroups" :key="location" class="careers-top-txt-box">
        <p class="pos-head">{{ location }}</p>
        <div v-for="(item, index) in group" :key="key(item, index)" class="career-box" :class="{ opencar: opened === key(item, index) }">
          <Btn flat class="job-head" :aria-expanded="opened === key(item, index)" @click="opened = opened === key(item, index) ? '' : key(item, index)">{{ item.title }}<span class="pos-marks-wrap"><span class="carpls" /><span class="carmin" /></span></Btn>
          <div v-show="opened === key(item, index)" class="job-info" v-html="html(item.info)" />
        </div>
      </div>
    </div>
    <div v-else-if="props.kind === 'video'" class="videoPage">
      <div class="joystick-wrap"><div class="joystick"><img :src="`${props.asset_base}joystick-white.svg`" alt="" /></div><div><h1 class="txt60 blue-txt">{{ article.title }}</h1><h3 v-if="article.subHeader" class="videoPageSub">{{ article.subHeader }}</h3><div class="txt20 light videoPageBody" v-html="html(article.body)" /></div></div>
      <div v-if="url(article.videoLink)" class="w1170 videoPageVideo"><iframe v-if="embed(article.videoLink)" :src="embed(article.videoLink)" :title="article.title" allowfullscreen /><video v-else playsinline controls :src="url(article.videoLink)" /></div>
      <div class="txt20 light videoPageContactUs" v-html="html(article.contactUs)" />
    </div>
    <div v-else-if="props.kind === 'legal'" class="legal-wrap"><h1 class="txt30">{{ article.title }}</h1><div v-html="html(article.content)" /></div>
    <div v-else-if="props.kind === 'article'" class="news-wrap"><article class="news-page-wrap"><a href="/news" class="back-wrap"><img :src="`${props.asset_base}back.svg`" alt="" /><p>{{ props.back_label }}</p></a><h1 class="news-page-head">{{ article.title }}</h1><img v-if="url(article.image)" :src="url(article.image)" :alt="article.title || ''" class="news-page-img" /><div class="rtf" v-html="html(article.content)" /></article></div>
    <p v-if="error" role="status">Content could not be loaded. Please try again.</p>
  </section>
</template>
