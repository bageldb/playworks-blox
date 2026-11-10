<script setup lang="ts">
import { defineBlock } from '@bagelink/blox'
import { $, defineSchema } from '@bagelink/vue'
import PlayForm from './PlayForm.vue'
import { imageField, mediaUrl } from '@bageldb/blox-renderer/media'

interface Props {
  title?: string
  decoration?: unknown
  introduction?: string
  opportunities?: string
  email?: string
  support_text?: string
  form_name?: string
  platforms?: { label: string; value: string }[]
}
defineBlock({
  name: 'PlayContact', label: 'Play.Works contact page', category: 'form',
  description: 'Contact introduction, overlapping title and aligned support form.',
  schema: defineSchema({
    title: $.text('Title'), decoration: imageField('Title illustration'),
    introduction: $.textarea('Introduction'), opportunities: $.textarea('Opportunities'),
    email: $.text('Business email'), support_text: $.textarea('Support introduction'),
    form_name: $.text('Form definition'),
    platforms: $.array('Platforms', defineSchema({ label: $.text('Label'), value: $.text('Value') })),
  }),
})
const props = defineProps<Props>()
const emailHref = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email || '') ? `mailto:${props.email}` : undefined
</script>

<template>
  <section class="playworks play-contact" data-play-kind="contact">
    <div class="faq-page-wrap">
      <div class="side-head-wrap top-page">
        <h1 class="txt60">{{ props.title }}</h1>
        <img v-if="mediaUrl(props.decoration)" :src="mediaUrl(props.decoration)" class="play-icon" alt="">
      </div>
      <div class="faq-page-box cont"><p class="txt20 light">{{ props.introduction }}</p></div>
      <p class="txt20 light ps-1">{{ props.opportunities }}</p>
      <p class="txt20 light ps-1"><b>Business inquiries:</b> Email <a :href="emailHref()">{{ props.email }}</a>.</p>
      <PlayForm embedded :form_name="props.form_name" :platforms="props.platforms" :body="props.support_text" />
    </div>
  </section>
</template>

<style scoped>
.play-contact .ps-1 { padding-inline: 50px; }
.play-contact .faq-page-box { min-height: 0; }
.play-contact h1 { font-family: inherit; }
.play-contact .cont p { white-space: pre-line; }
@media (max-width: 767px) {
  .play-contact .ps-1 { padding-inline: 20px; }
}
</style>
