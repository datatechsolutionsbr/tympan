import type { ReactNode } from 'react'

/**
 * Gallery specimen: one glass sheet per component, captioned with its name.
 * `id` anchors the caption so the page can link to a specimen.
 */
export function Section(specimen: { id: string; title: string; children: ReactNode }) {
  const { id: anchor, title: name, children: states } = specimen
  return (
    <section className="fk-gallery-section" data-component={name} aria-label={name}>
      <h2 className="fk-gallery-section__title" id={anchor}>
        {name}
      </h2>
      <div className="fk-gallery-section__body">{states}</div>
    </section>
  )
}
