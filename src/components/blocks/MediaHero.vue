<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, Btn, defineSchema } from '@bagelink/vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Props { video?: string; poster?: unknown; title?: string; subtitle?: string; cta_label?: string; cta_href?: string }
defineBlock({
	name: 'MediaHero', label: 'Play.Works video hero', category: 'hero', icon: 'movie',
	schema: defineSchema({ video: $.text('Video URL'), poster: imageField(), title: $.textarea('Title'), subtitle: $.textarea('Subtitle'), cta_label: $.text('Button'), cta_href: $.text('Button link') }),
})
const props = defineProps<Props>()
</script>
<template>
	<section class="playworks pw-media-hero">
		<div class="hero-video-wrap">
			<video class="hero-video" :src="props.video" :poster="mediaUrl(props.poster)" autoplay loop muted playsinline preload="auto" />
			<div class="hero-video-overlay" />
			<div class="hero-video-content"><div class="hero-video-textbox">
				<h1 class="hero-video-title">{{ props.title }}</h1>
				<p class="hero-video-sub">{{ props.subtitle }}</p>
			</div></div>
		</div>
		<div v-if="props.cta_label && props.cta_href" class="hero-video-btn-wrap"><Btn class="btn hero-video-btn" :href="props.cta_href" :value="props.cta_label" /></div>
	</section>
</template>
