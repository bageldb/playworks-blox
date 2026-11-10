<script setup lang="ts">
import { computed } from 'vue'
import { defineBlock, useGlobalBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Link { label?: string; href?: string; tone?: 'plain' | 'red' }
interface Props { links?: Link[]; credit_image?: unknown; credit_alt?: string; credit_href?: string }
defineBlock({
	name: 'PlayFooter', label: 'Play.Works footer', category: 'layout', icon: 'bottom_navigation', global: true,
	schema: defineSchema({ links: $.array('Links', defineSchema({ label: $.text('Label'), href: $.text('Link'), tone: $.select('Tone', ['plain', 'red'], { default: 'plain' }) }), { allowReorder: true }), credit_image: imageField(), credit_alt: $.text('Credit alt'), credit_href: $.text('Credit link') }),
})
const props = defineProps<Props>()
const { data } = useGlobalBlock<Props & Record<string, unknown>>('PlayFooter')
const content = computed(() => ({ ...props, ...data.value }))
const safeHref = (value?: string) => {
	try { const url = new URL(value || '', 'https://playworks.invalid'); return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined } catch { return undefined }
}
</script>
<template>
	<footer class="playworks pw-footer"><div class="footer">
		<div class="footer-box" />
		<div class="footer-links-wrap">
			<a v-for="(link, i) in content.links" :key="i" :href="safeHref(link.href)" class="footer-link" :class="{ red: link.tone === 'red' }">{{ link.label }}</a>
			<a v-if="content.credit_href" :href="safeHref(content.credit_href)" target="_blank" rel="noopener noreferrer" class="bagel"><img :src="mediaUrl(content.credit_image)" :alt="content.credit_alt || ''" /></a>
		</div>
	</div></footer>
</template>
