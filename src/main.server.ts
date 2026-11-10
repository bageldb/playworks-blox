import process from 'node:process'
import { createBloxSSREntry } from '@bagelink/blox/ssg'
import { BagelVue, RouterWrapper } from '@bagelink/vue'
import { App, createRouter, setupSiteApp } from '@bageldb/blox-renderer'
import { modules } from './blocks'

import '@bagelink/vue/styles/core.css'
import '@bagelink/blox/style.css'
import '@bageldb/blox-renderer/styles/main.css'
import './styles/playworks.css'
import './styles/playworks-inner.css'

const websiteName = process.env.BLOX_WEBSITE_NAME ?? process.env.WEBSITE_NAME ?? 'playworks'

export const { render, prefetchResolve, configureBuildData } = createBloxSSREntry({
  rootComponent: App,
  createRouter,
  modules,
  websiteName,
  store: websiteName,
  locale: 'en',
  supportedLocales: ['en'],
  apiBase: process.env.BLOX_API_URL ?? process.env.BAGELINK_API_URL ?? 'https://api.bagel.to',
  plugins: [[BagelVue, {}]],
  globalComponents: { RouterWrapper },
  setup: (app) => {
    setupSiteApp(app, modules)
  },
})
