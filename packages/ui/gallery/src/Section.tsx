import type { ReactNode } from 'react'

/** One gallery block: a titled glass sheet holding a component in its states. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="fk-gallery-section" aria-labelledby={id} data-component={title}>
      <h2 id={id} className="fk-gallery-section__title">
        {title}
      </h2>
      <div className="fk-gallery-section__body">{children}</div>
    </section>
  )
}
