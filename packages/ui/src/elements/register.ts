// Side-effect entry: registers every Tympan custom element when loaded in a
// browser. The standalone bundle (dist/elements.bundle.js) is this module.
import { defineTympanElements } from './index.ts'

defineTympanElements()

export * from './index.ts'
