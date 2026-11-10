<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Image { image?: unknown; alt?: string }
defineBlock({
	name: 'ImageMarquee', label: 'Opposing image tracks', category: 'media', icon: 'view_carousel',
	schema: defineSchema({
		line_one: $.array('First track', defineSchema({ image: imageField(), alt: $.text('Alt text') }), { allowReorder: true }),
		line_two: $.array('Second track', defineSchema({ image: imageField(), alt: $.text('Alt text') }), { allowReorder: true }),
	}),
})
const props = defineProps<{ line_one?: Image[]; line_two?: Image[] }>()
</script>
<template>
	<section class="playworks pw-marquee"><div class="scroll-apps">
		<div v-for="(line, row) in [props.line_one, props.line_two]" :key="row" class="scroll-apps-wrap" :class="{ rev: row === 1 }">
			<div v-for="copy in 2" :key="copy" class="scroll-apps-track" :aria-hidden="copy === 2 ? true : undefined">
				<img v-for="(item, i) in line" :key="i" :src="mediaUrl(item.image)" :alt="copy === 2 ? '' : item.alt || ''" class="app-scroll" />
			</div>
		</div>
	</div></section>
</template>
