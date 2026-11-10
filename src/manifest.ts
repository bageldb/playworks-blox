import { createBlox, serializeRegistry } from '@bagelink/blox'
import { modules } from './blocks'

export function buildManifest() {
  return serializeRegistry(createBlox({ modules }).getRegistry())
}
