<script setup lang="ts">
import { computed } from 'vue'
import { defineBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
defineBlock({
	name: 'VideoEmbed', label: 'Full-width video player', category: 'media', icon: 'play_circle',
	schema: defineSchema({ src: $.text('HTTPS embed URL'), title: $.text('Accessible title'), overlap: $.select('Spacing', ['overlap', 'normal'], { default: 'overlap' }) }),
})
const props = defineProps<{ src?: string; title?: string; overlap?: 'overlap' | 'normal' }>()
const source = computed(() => {
	try { const url = new URL(props.src || ''); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
})
</script>
<template>
	<section class="playworks pw-video"><div class="big-vid-wrap" :class="{ newhome: props.overlap !== 'normal' }"><div class="big-vid">
		<iframe v-if="source" :src="source" :title="props.title || 'Video player'" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowfullscreen />
	</div></div></section>
</template>
