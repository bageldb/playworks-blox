<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, Btn, defineSchema } from '@bagelink/vue'
import { sanitizeHtml } from '@/utils/sanitize'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
defineBlock({
	name: 'PlayCreators', label: 'Creator revenue section', category: 'content', icon: 'groups',
	schema: defineSchema({ title: $.text('Title'), image: imageField(), image_alt: $.text('Image alt'), body: $.textarea('Rich HTML text'), decoration: imageField(), cta_label: $.text('Button'), cta_href: $.text('Button link') }),
})
const props = defineProps<{ title?: string; image?: unknown; image_alt?: string; body?: string; decoration?: unknown; cta_label?: string; cta_href?: string }>()
</script>
<template>
	<section class="playworks pw-creators"><div class="influencers-sec-wrap"><div class="influencers-sec newhome">
		<div class="side-head-wrap influ"><h3 class="txt60">{{ props.title }}</h3></div>
		<div class="influencers-flex">
			<img class="influ-img" :src="mediaUrl(props.image)" :alt="props.image_alt || ''" />
			<div class="influ-txt-box">
				<div class="txt18" v-html="sanitizeHtml(props.body || '')" />
				<div class="influ-cta-row"><Btn v-if="props.cta_label" class="btn bigger influ-btn" :href="props.cta_href" :value="props.cta_label" /></div>
				<img v-if="mediaUrl(props.decoration)" :src="mediaUrl(props.decoration)" alt="" class="influ-icon" />
			</div>
		</div>
	</div></div></section>
</template>
