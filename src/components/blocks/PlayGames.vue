<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, Btn, defineSchema } from '@bagelink/vue'
import { sanitizeHtml } from '@/utils/sanitize'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Game { title?: string; image?: unknown; body?: string }
defineBlock({
	name: 'PlayGames', label: 'Featured TV games', category: 'content', icon: 'sports_esports',
	schema: defineSchema({ title: $.textarea('Title'), body: $.textarea('Rich HTML introduction'), background: imageField(), items: $.array('Games', defineSchema({ title: $.text('Name'), image: imageField(), body: $.textarea('Rich HTML description') }), { allowReorder: true }), cta_label: $.text('Button'), cta_href: $.text('Button link') }),
})
const props = defineProps<{ title?: string; body?: string; background?: unknown; items?: Game[]; cta_label?: string; cta_href?: string }>()
</script>
<template>
	<section class="playworks pw-games"><div class="games-sec newhome" :style="mediaUrl(props.background) ? { backgroundImage: `url(${JSON.stringify(mediaUrl(props.background))})` } : undefined">
		<h3 class="txt60 red pw-lines">{{ props.title }}</h3>
		<div class="w900"><div class="txt18" v-html="sanitizeHtml(props.body || '')" /><br /></div>
		<div class="games-home-wrap">
			<div v-for="(game, i) in props.items" :key="i" class="game-home-box">
				<img :src="mediaUrl(game.image)" :alt="game.title || ''" class="game-img-box" />
				<h4 class="txt30">{{ game.title }}<br /></h4><div class="game-box-txt" v-html="sanitizeHtml(game.body || '')" />
			</div>
		</div>
		<Btn v-if="props.cta_label" class="btn bigger blue games-btn" :href="props.cta_href" :value="props.cta_label" />
	</div></section>
</template>
