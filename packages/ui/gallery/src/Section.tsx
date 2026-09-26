import type { ReactNode } from 'react'

interface SectionProps {
  /** Id of the visible caption; the block is labelled by it. */
  id: string
  title: string
  children: ReactNode
}

/** Gallery block: a captioned glass sheet with one component in its states. */
export function Section(props: SectionProps) {
  const caption = (
    <h2 id={props.id} className="fk-gallery-section__title">
      {props.title}
    </h2>
  )
  const body = <div className="fk-gallery-section__body">{props.children}</div>
  return (
    <section data-component={props.title} aria-labelledby={props.id} className="fk-gallery-section">
      {[caption, body].map((part, i) => (
        <GalleryPart key={i}>{part}</GalleryPart>
      ))}
    </section>
  )
}

function GalleryPart({ children }: { children: ReactNode }) {
  return <>{children}</>
}
