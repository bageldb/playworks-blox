import { sharedBlockModules } from '@bageldb/blox-renderer'

/** One registry composition for hydration, prerendering, preview, and manifest. */
export const modules = {
  ...sharedBlockModules,
  ...import.meta.glob<Record<string, unknown>>('./components/blocks/*.vue', { eager: true }),
}
