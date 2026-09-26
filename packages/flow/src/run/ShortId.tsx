// A long identifier shown as a short prefix, with the full value kept in the
// accessible text and the title (never cut for assistive technology).

export function ShortId({ id, label, visible = 8 }: { id: string; label?: string; visible?: number }) {
  const short = id.length > visible ? id.slice(0, visible) : id
  return (
    <span className="ty-run-shortid" title={id}>
      {label ? <span className="ty-run-shortid__label">{label} </span> : null}
      <code className="ty-run-mono" aria-hidden="true">
        {short}
      </code>
      <span className="ty-visually-hidden">{id}</span>
    </span>
  )
}
