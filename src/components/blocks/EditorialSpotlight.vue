<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { defineBlock } from '@bagelink/blox'
import { $, Btn, defineSchema } from '@bagelink/vue'
import { sanitizeHtml } from '@/utils/sanitize'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Story { title?: string; image?: unknown; body?: string; date?: string; href?: string }
defineBlock({
	name: 'EditorialSpotlight', label: 'Selectable news spotlight', category: 'content', icon: 'newspaper',
	schema: defineSchema({ items: $.array('Stories', defineSchema({ title: $.text('Title'), image: imageField(), body: $.textarea('Rich HTML excerpt'), date: $.text('Display date'), href: $.text('Story link') }), { allowReorder: true }), cta_label: $.text('Button'), cta_href: $.text('Button link') }),
})
const props = defineProps<{ items?: Story[]; cta_label?: string; cta_href?: string }>()
const index = ref(0)
const selected = computed(() => props.items?.[index.value])
const safeHref = (value?: string) => {
	try { const url = new URL(value || '', 'https://playworks.invalid'); return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined } catch { return undefined }
}
watch(() => props.items?.length, () => { index.value = 0 })
</script>
<template>
	<section class="playworks pw-editorial"><div v-if="selected" class="news-preview-sec">
		<div class="news-preview-featured"><Transition name="news-fade" mode="out-in">
			<div :key="index" class="news-preview-featured-inner">
				<a :href="safeHref(selected.href)" class="news-preview-img-wrap"><img :src="mediaUrl(selected.image)" :alt="selected.title || ''" class="news-preview-img" /></a>
				<div class="news-preview-txt">
					<a :href="safeHref(selected.href)" class="news-preview-title">{{ selected.title }}</a>
					<div class="news-preview-desc" v-html="sanitizeHtml(selected.body || '')" />
					<p /><p class="news-preview-date">{{ selected.date }}</p>
				</div>
			</div>
		</Transition></div>
		<div class="news-preview-thumbs">
			<Btn v-for="(item, i) in props.items" :key="i" flat class="news-preview-thumb" :class="{ active: i === index }" :aria-label="item.title" :aria-pressed="i === index" @click="index = i">
				<img :src="mediaUrl(item.image)" :alt="item.title || ''" />
			</Btn>
		</div>
		<div v-if="props.cta_label" class="news-preview-btn-wrap"><Btn class="btn" :value="props.cta_label" :href="safeHref(props.cta_href)" /></div>
	</div></section>
</template>
