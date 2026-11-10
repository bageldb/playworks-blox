import { sharedBlockModules } from '@bageldb/blox-renderer'
import type { BlockModule } from '@bagelink/blox'

/** One registry composition for hydration, prerendering, preview, and manifest. */
export const modules = {
  // Shared source types cannot describe the metadata added by bloxPlugin.
  ...sharedBlockModules as Record<string, BlockModule>,
  ...import.meta.glob<BlockModule>('./components/blocks/*.vue', { eager: true }),
}
