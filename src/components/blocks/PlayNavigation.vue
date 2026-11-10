<script setup lang="ts">
import { computed, ref } from 'vue'
import { defineBlock, useGlobalBlock } from '@bagelink/blox'
import { $, Btn, defineSchema } from '@bagelink/vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'
interface Link { label?: string; href?: string }
interface Group { label?: string; links?: Link[]; decoration?: unknown }
interface Props { logo?: unknown; logo_alt?: string; home_href?: string; groups?: Group[]; cta_label?: string; cta_href?: string; menu_label?: string; close_label?: string }
defineBlock({
	name: 'PlayNavigation', label: 'Play.Works navigation', category: 'layout', icon: 'menu', global: true,
	schema: defineSchema({
		logo: imageField(), logo_alt: $.text('Logo alt'), home_href: $.text('Home link'),
		groups: $.array('Navigation groups', defineSchema({ label: $.text('Label'), decoration: imageField(), links: $.array('Links', defineSchema({ label: $.text('Label'), href: $.text('Link') }), { allowReorder: true }) }), { allowReorder: true }),
		cta_label: $.text('Button'), cta_href: $.text('Button link'), menu_label: $.text('Open menu label'), close_label: $.text('Close menu label'),
	}),
})
const props = defineProps<Props>()
const { data } = useGlobalBlock<Props & Record<string, unknown>>('PlayNavigation')
const content = computed(() => ({ ...props, ...data.value }))
const safeHref = (value?: string) => {
	try { const url = new URL(value || '', 'https://playworks.invalid'); return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined } catch { return undefined }
}
const tab = ref(-1)
const open = ref(false)
function close() { open.value = false; tab.value = -1 }
</script>
<template>
	<header class="playworks pw-navigation" @keydown.esc="close">
		<div class="menu-back-wrap"><div class="menu-back" /></div>
		<div class="top-menu" @mouseleave="tab = -1">
			<a :href="safeHref(content.home_href || '/')" class="top-logo"><img :src="mediaUrl(content.logo)" :alt="content.logo_alt || ''" /></a>
			<nav class="nav-links-wrap" :class="{ 'open-nav': open }" aria-label="Main navigation">
				<Btn flat class="close-menu" icon="close" :aria-label="content.close_label || 'Close menu'" @click="close" />
				<div class="drop wrap">
					<template v-for="(group, i) in content.groups" :key="i">
						<Btn flat class="top-drop" :class="{ open: tab === i }" :value="group.label" :aria-expanded="tab === i" @mouseenter="tab = i" @focus="tab = i" @click="tab = tab === i ? -1 : i" />
						<div class="top-cont" :class="{ open: tab === i }"><div class="top-cont-inner">
							<a v-for="(link, j) in group.links" :key="j" :href="safeHref(link.href)" class="drop-link" @click="close">{{ link.label }}</a>
							<img v-if="mediaUrl(group.decoration)" :src="mediaUrl(group.decoration)" alt="" :class="i === 0 ? 'menu-tab1-img' : i === 1 ? 'tab-icon-2' : 'tab-icon-3'" />
						</div></div>
					</template>
				</div>
				<Btn v-if="content.cta_label" class="btn top-btn" :value="content.cta_label" :href="safeHref(content.cta_href)" @click="close" />
			</nav>
			<div class="manu-background" @click="close" />
			<Btn flat class="menu" icon="menu" :aria-label="content.menu_label || 'Open menu'" :aria-expanded="open" @click="open = true" />
		</div>
	</header>
</template>
