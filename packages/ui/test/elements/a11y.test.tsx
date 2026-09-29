// Accessibility sweep: every example of every element is rendered (the
// reference renderer, which the fixtures and the parity tests pin) and run
// through axe. Colour contrast needs real layout and is checked in the
// gallery; fragments are not in landmarks, so `region` is off here.
import { afterEach, describe, expect, it } from 'vitest'
import { renderElement } from '../../src/elements/anatomy'
import { buttonDefinition } from '../../src/elements/button/definition'
import { brandWordmarkDefinition } from '../../src/elements/brand-wordmark/definition'
import { checkboxDefinition } from '../../src/elements/checkbox/definition'
import { drawerDefinition } from '../../src/elements/drawer/definition'
import { gradientMarkDefinition } from '../../src/elements/gradient-mark/definition'
import { inlineNoticeDefinition } from '../../src/elements/inline-notice/definition'
import { linkDefinition } from '../../src/elements/link/definition'
import { modalDefinition } from '../../src/elements/modal/definition'
import { nativeSelectDefinition } from '../../src/elements/native-select/definition'
import { separatorDefinition } from '../../src/elements/separator/definition'
import { skeletonDefinition } from '../../src/elements/skeleton/definition'
import { spinnerDefinition } from '../../src/elements/spinner/definition'
import { statusPillDefinition } from '../../src/elements/status-pill/definition'
import { surfaceDefinition } from '../../src/elements/surface/definition'
import { switchDefinition } from '../../src/elements/switch/definition'
import { tagDefinition } from '../../src/elements/tag/definition'
import { textAreaDefinition } from '../../src/elements/text-area/definition'
import { textFieldDefinition } from '../../src/elements/text-field/definition'
import { themePaletteDefinition } from '../../src/elements/theme-palette/definition'
import type { ElementDefinition } from '../../src/elements/definition'
import { expectNoAxeViolations } from '../axe'

const DEFINITIONS: ElementDefinition[] = [
  brandWordmarkDefinition,
  buttonDefinition,
  checkboxDefinition,
  drawerDefinition,
  gradientMarkDefinition,
  inlineNoticeDefinition,
  linkDefinition,
  modalDefinition,
  nativeSelectDefinition,
  separatorDefinition,
  skeletonDefinition,
  spinnerDefinition,
  statusPillDefinition,
  surfaceDefinition,
  switchDefinition,
  tagDefinition,
  textAreaDefinition,
  textFieldDefinition,
  themePaletteDefinition,
]

afterEach(() => {
  document.body.replaceChildren()
})

for (const def of DEFINITIONS.filter((d) => d.examples.length)) {
  describe(`${def.tag} examples`, () => {
    for (const example of def.examples) {
      it(`${example.name}: no axe violations`, async () => {
        const host = document.createElement('div')
        host.innerHTML = renderElement(def, example.props, example.slots, 'i')
        document.body.append(host)
        expect(host.innerHTML).not.toBe('')
        await expectNoAxeViolations(host, ['region'])
      })
    }
  })
}
