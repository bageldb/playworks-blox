<script setup lang="ts">
import { computed, reactive, ref, useId } from 'vue'
import { defineBlock } from '@bagelink/blox'
import { $, Btn, SelectInput, TextInput, UploadInput, defineSchema } from '@bagelink/vue'

interface Props {
	embedded?: boolean
	form_name?: string
	title?: string
	body?: string
	platforms?: { label: string; value: string }[]
	labels?: Record<string, string>
	allow_screenshot?: boolean
	locale?: string
}

const schema = defineSchema<Props>({
	form_name: $.text('Public form name'),
	title: $.text('Title'),
	body: $.textarea('Introduction'),
	platforms: $.array('Platforms', defineSchema({
		label: $.text('Label'),
		value: $.text('Value'),
	})),
	labels: $.json('Labels'),
	allow_screenshot: $.checkbox('Allow private screenshots'),
	locale: $.text('Submission locale'),
})

defineBlock({
	name: 'PlayForm',
	label: 'Play.Works contact / support form',
	icon: 'contact_support',
	category: 'form',
	description: 'Original Play.Works form with private-only screenshot uploads.',
	schema,
	defaults: { form_name: 'playworks-support', allow_screenshot: false, locale: 'en' },
})

const props = withDefaults(defineProps<Props>(), {
	form_name: 'playworks-support',
	allow_screenshot: false,
	locale: 'en',
})
const id = useId()
const contact = computed(() => props.form_name === 'playworks-contact')
const supportPlatforms = ['Sky', 'Comcast', 'Roku', 'Vizio', 'Samsung', 'Sling', 'LG', 'Videotron Helix', 'Cox', 'Rogers', 'Shaw', 'Amazon Fire TV', 'Freebox', 'Free Mini4k', 'BT', 'TalkTalk', 'Humax T2000', 'Vewd', 'Philips', 'Dish TV', 'Other']
const contactPlatforms = ['Freebox', 'Free Mini4k', 'Dish TV', 'Samsung', 'LG', 'Comcast Xfinity', 'Philips', 'Vizio', 'Vewd', 'Roku', 'Sky Q', 'Videotron Helix', 'Cox', 'Rogers', 'Shaw', 'BT', 'TalkTalk', 'Humax T2000', 'Other']
const platforms = computed(() => props.platforms ?? (contact.value ? contactPlatforms : supportPlatforms).map(value => ({
	value,
	label: contact.value && value === 'Free Mini4k' ? 'FreeMini4k' : contact.value && value === 'Dish TV' ? 'DishTV' : value,
})))
const defaults: Record<string, string> = {
	name: 'Name', subject: 'Subject', email: 'Email', message: 'Message', platform: 'Platform',
	submit: 'Submit', uploading: 'Uploading...', sending: 'Sending...',
	upload: 'Click to upload screenshot', upload_hint: 'PNG, JPG up to 10MB',
	screenshot_help: 'To help us provide the best support possible, please take a screenshot of the About page within the app and attach it using the upload option.',
	thank_you: 'Thank you!', success: 'Your submission has been received!',
	error: 'An error occurred while submitting the form. Please try again.',
	upload_error: 'Screenshot upload failed. Please try again or submit without a screenshot.',
	platform_error: 'Please select a platform',
}
const label = (key: string) => props.labels?.[key] ?? defaults[key] ?? key
const form = reactive({ name: '', subject: '', email: '', message: '', platform: '' })
const screenshot = ref<{ path_key: string; name: string; mimetype: string; size: number }>()
const uploadModel = ref('')
const uploading = ref(false)
const sending = ref(false)
const done = ref(false)
const error = ref('')
const uploadError = ref('')

async function uploadScreenshot(file: File): Promise<string> {
	uploadError.value = ''
	if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024) {
		uploadError.value = label('upload_hint')
		throw new Error('Invalid screenshot')
	}
	uploading.value = true
	try {
		const body = new FormData()
		body.append('file', file)
		body.append('private', 'true')
		const response = await fetch('/api/files/upload', { method: 'POST', body })
		if (!response.ok) throw new Error('Private upload unavailable')
		const result = await response.json()
		if (result?.meta?.private !== true || typeof result.path_key !== 'string' || !result.path_key) {
			throw new Error('Upload did not confirm private storage')
		}
		screenshot.value = { path_key: result.path_key, name: file.name, mimetype: file.type, size: file.size }
		// Return a harmless local display name; never feed storage keys or signed URLs
		// to UploadInput's image preview/CDN resolver.
		return file.name
	} catch {
		uploadError.value = label('upload_error')
		throw new Error('Private screenshot upload failed')
	} finally {
		uploading.value = false
	}
}

async function submit() {
	if (sending.value || uploading.value) return
	error.value = ''
	if (!form.platform) { error.value = label('platform_error'); return }
	if (!props.form_name) { error.value = label('error'); return }
	sending.value = true
	try {
		const response = await fetch(`/api/form/submit/${encodeURIComponent(props.form_name)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				...(props.allow_screenshot && screenshot.value ? { screenshot: screenshot.value } : {}),
				_meta: { locale: props.locale },
			}),
		})
		if (!response.ok) throw new Error('Submission failed')
		done.value = true
	} catch {
		error.value = label('error')
	} finally {
		sending.value = false
	}
}
</script>

<template>
	<section class="playworks play-form" :class="{ 'play-form-embedded': props.embedded }">
		<h3 v-if="props.title" class="play-form-title">{{ props.title }}</h3>
		<div class="faq-page-box sup">
			<p class="txt20">{{ props.body ?? (contact ? 'For player support or technical issues with a Play.Works app or game, please use the form below and our Support team will respond as soon as possible.' : 'For any support questions or comments please fill out the below form') }}</p>
			<p v-if="props.allow_screenshot" class="txt20 light">{{ label('screenshot_help') }}</p>
			<div class="form-wrap">
				<div v-if="done" class="tnx" role="status">
					<p><span class="new-line">{{ label('thank_you') }}</span> {{ label('success') }}</p>
				</div>
				<form v-else class="form form-grid" :aria-busy="sending || uploading" @submit.prevent="submit">
					<div>
						<div v-for="field in (['name', 'subject', 'message'] as const)" :key="field" class="relative field-wrap">
							<img :src="`/playworks/${field === 'name' ? 'iconusr.svg' : field === 'subject' ? 'Star.svg' : 'iconmeg.svg'}`" class="form-icon" :class="{ msg: field === 'message' }" alt="">
							<TextInput v-model="form[field]" :id="`${id}-${field}`" :name="field" :placeholder="label(field)" :native-input-attrs="{ 'aria-label': label(field) }" :multiline="field === 'message'" :rows="field === 'message' ? 4 : undefined" :disabled="sending" class="play-field" :class="{ bigger: field === 'message' }" />
						</div>
					</div>
					<div>
						<div class="relative field-wrap">
							<img src="/playworks/iconemail.svg" class="form-icon email" alt="">
							<TextInput v-model="form.email" :id="`${id}-email`" name="email" type="email" autocomplete="email" :placeholder="label('email')" :native-input-attrs="{ 'aria-label': label('email') }" :disabled="sending" class="play-field" />
						</div>
						<div class="relative field-wrap">
							<img src="/playworks/iconplat.svg" class="form-icon plat" alt="">
							<SelectInput v-model="form.platform" :options="platforms" :placeholder="label('platform')" :aria-label="label('platform')" required :disabled="sending" class="play-select" />
						</div>
						<div v-if="props.allow_screenshot" class="file-upload-container">
							<UploadInput v-model="uploadModel" :upload="uploadScreenshot" accept="image/png,image/jpeg" :disabled="sending || uploading" :show-icon="false" :upload-frame="false" height="100px" class="play-upload" :aria-label="label('upload')">
								<template #files>
									<div class="file-upload-content">
										<span :class="{ uploaded: screenshot }">{{ uploading ? label('uploading') : screenshot?.name ?? label('upload') }}</span>
										<span class="upload-subtext">{{ label('upload_hint') }}</span>
									</div>
								</template>
							</UploadInput>
							<p v-if="uploadError" class="error" role="alert">{{ uploadError }}</p>
						</div>
						<div class="form-btn-wrap">
							<Btn type="submit" class="play-submit" :value="uploading ? label('uploading') : sending ? label('sending') : label('submit')" :disabled="sending || uploading" />
						</div>
					</div>
				</form>
				<p v-if="error" class="error" role="alert">{{ error }}</p>
			</div>
		</div>
	</section>
</template>

<style scoped>
/* Source form geometry, scoped to this block (never the generic FormBlock). */
.playworks.play-form { max-width: 1080px; width: 90%; margin: 60px auto; }
.playworks .play-form-title { font-size: 60px; line-height: 1.1; }
.playworks .faq-page-box { background: #fef2df; border-radius: 30px; padding: 50px 50px 50px 300px; }
.playworks.play-form-embedded { max-width: none; width: 100%; margin: 0; }
.playworks.play-form-embedded .faq-page-box { padding: 50px; }
.playworks .txt20 { font-size: 20px; font-weight: 600; line-height: 1.5; }
.playworks .txt20.light { font-weight: 400; }
.playworks .form-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; }
.playworks .field-wrap { position: relative; margin-bottom: 20px; }
.playworks .form-icon { position: absolute; left: 18px; top: 18px; z-index: 1; pointer-events: none; }
.playworks .form-icon.msg { top: 20px; }
.playworks .form-icon.email { top: 23px; }
.playworks .form-icon.plat { top: 23px; }
.playworks .play-field { width: 100%; }
.playworks .play-field :deep(input),
.playworks .play-field :deep(textarea) {
	box-sizing: border-box; width: 100%; border-radius: 30px; border: none;
	background: white; padding: 20px 20px 20px 50px; font: inherit; font-size: 20px;
	line-height: 25px; color: #222; box-shadow: none;
}
.playworks .play-field :deep(input) { height: 65px; }
.playworks .play-field :deep(textarea) { height: 186px; resize: none; }
.playworks .play-field :deep(input::placeholder),
.playworks .play-field :deep(textarea::placeholder) { color: #757575; opacity: 1; }
.playworks .play-select :deep(.selectinput-btn) {
	width: 100%; height: 65px; background: white; border-radius: 30px;
	border: none; padding-left: 50px; font-size: 20px; font-weight: 400; color: #222;
}
.playworks .play-submit {
	height: 65px; width: 100%; background: #ed4b4b; color: white; font-weight: 900;
	font-style: italic; padding: 10px 20px; border-radius: 30px; font-size: 20px; border: none;
}
.playworks .play-submit:disabled { opacity: .6; cursor: not-allowed; }
.playworks .file-upload-container { margin: 20px 0; }
.playworks .play-upload :deep(.fileUploadWrap) {
	box-sizing: border-box; border: 2px dashed #ccc; border-radius: 30px;
	padding: 2px 20px; text-align: center; background: white; min-height: 100px;
	display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.playworks .play-upload :deep(.fileUploadWrap:hover) { border-color: #ed4b4b; box-shadow: 0 4px 12px rgb(237 75 75 / 10%); }
.playworks .file-upload-content { display: flex; flex-direction: column; align-items: center; gap: 8px; overflow-wrap: anywhere; }
.playworks .uploaded { color: #ed4b4b; }
.playworks .upload-subtext { font-size: 11px; color: #777; margin-top: 4px; }
.playworks .tnx { font-size: 30px; font-style: italic; font-weight: 900; }
.playworks .new-line { display: block; }
.playworks .error { background: #b72121; padding: 8px; text-align: center; color: white; }
.playworks :deep(input:focus-visible), .playworks :deep(textarea:focus-visible),
.playworks :deep(button:focus-visible) { outline: 2px solid #143a71; outline-offset: 3px; }
@media (max-width: 767px) {
	.playworks .faq-page-box { padding: 20px; }
	.playworks.play-form-embedded .faq-page-box { padding: 20px; }
	.playworks .form-grid { grid-template-columns: minmax(0, 1fr); gap: 0; }
	.playworks .play-form-title { font-size: 40px; }
}
</style>
