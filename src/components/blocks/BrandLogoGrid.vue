<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Logo { image?: unknown; name?: string; size?: 'large' | 'small' }
defineBlock({
	name: 'BrandLogoGrid', label: 'Partner logos', category: 'content', icon: 'grid_view',
	schema: defineSchema({ title: $.text('Title'), body: $.textarea('Text'), items: $.array('Logos', defineSchema({ name: $.text('Name'), image: imageField(), size: $.select('Size', ['large', 'small'], { default: 'small' }) }), { allowReorder: true }) }),
})
const props = defineProps<{ title?: string; body?: string; items?: Logo[] }>()
</script>
<template>
	<section class="playworks pw-logos"><div class="partners-sec newhome">
		<div class="w700"><h3 class="txt90 red">{{ props.title }}</h3><p class="txt18">{{ props.body }}</p></div>
		<img v-for="(logo, i) in (props.items || []).filter(item => item.size === 'large')" :key="i" :src="mediaUrl(logo.image)" :alt="logo.name || ''" class="partner-logo big" />
		<div class="small-logos-wrap"><img v-for="(logo, i) in (props.items || []).filter(item => item.size !== 'large')" :key="i" :src="mediaUrl(logo.image)" :alt="logo.name || ''" class="partner-logo" /></div>
	</div></section>
</template>
