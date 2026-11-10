<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { defineBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
interface Stat { value?: number; suffix?: string; label?: string }
defineBlock({
	name: 'PlayIntro', label: 'Play.Works introduction', category: 'content', icon: 'numbers',
	schema: defineSchema({ title: $.text('Title'), subtitle: $.text('Subtitle'), stats: $.array('Counters', defineSchema({ value: $.number('Value'), suffix: $.text('Suffix'), label: $.text('Label') }), { allowReorder: true }) }),
})
const props = defineProps<{ title?: string; subtitle?: string; stats?: Stat[] }>()
const target = ref<HTMLElement>()
const values = ref<number[]>([])
let observer: IntersectionObserver | undefined
let frame = 0
let started = false
function animate() {
	if (started) return
	started = true
	const begin = performance.now()
	const tick = (now: number) => {
		const progress = Math.min((now - begin) / 6000, 1)
		values.value = (props.stats || []).map(stat => Math.round((stat.value || 0) * progress))
		if (progress < 1) frame = requestAnimationFrame(tick)
	}
	frame = requestAnimationFrame(tick)
}
watch(() => props.stats, () => { values.value = (props.stats || []).map(stat => stat.value || 0) }, { immediate: true, deep: true })
onMounted(() => {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
	observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { animate(); observer?.disconnect() } })
	if (target.value) observer.observe(target.value)
})
onUnmounted(() => { observer?.disconnect(); cancelAnimationFrame(frame) })
</script>
<template>
	<section class="playworks pw-intro"><div class="who-sec newhome"><div class="who who-preview">
		<h3 class="txt60 who-preview-title red">{{ props.title }}</h3><p class="who-preview-sub">{{ props.subtitle }}</p>
		<div ref="target" class="num-info-wrap">
			<div v-for="(stat, i) in props.stats" :key="i" class="num-box">
				<p class="big-num" :aria-label="`${stat.value || 0}${stat.suffix || ''}`"><span aria-hidden="true">{{ values[i] }}{{ stat.suffix }}</span></p>
				<p class="small-num-txt">{{ stat.label }}</p>
			</div>
		</div>
	</div></div></section>
</template>
