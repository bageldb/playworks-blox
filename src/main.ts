import { createBloxApp } from '@bagelink/blox'
import { BagelVue, RouterWrapper } from '@bagelink/vue'
import { App, createRouter, setupSiteApp } from '@bageldb/blox-renderer'
import { modules } from './blocks'

import '@bagelink/vue/styles/core.css'
import '@bagelink/blox/style.css'
import '@bageldb/blox-renderer/styles/main.css'
import './styles/playworks.css'
import './styles/playworks-inner.css'

const websiteName = import.meta.env.VITE_BLOX_WEBSITE_NAME ?? 'playworks'

createBloxApp({
  rootComponent: App,
  router: createRouter(),
  modules,
  websiteName,
  store: websiteName,
  apiBaseURL: import.meta.env.VITE_BLOX_API_URL ?? '/api',
  plugins: [[BagelVue, {}]],
  globalComponents: { RouterWrapper },
  setup: (app) => {
    setupSiteApp(app, modules)
  },
})
