import { useMemo } from 'react'
import { CopyButton } from './CopyButton'
import { realcar } from './realce'

/** A code block with a title, syntax colours and a copy button. Code is always left-to-right. */
export function Code({ titulo, codigo }: { titulo: string; codigo: string }) {
  const pedacos = useMemo(() => realcar(codigo), [codigo])
  return (
    <div className="ty-site-codigo">
      <div className="ty-site-codigo__topo">
        <span className="ty-site-codigo__rotulo">{titulo}</span>
        <CopyButton texto={codigo} rotulo={titulo} />
      </div>
      <pre className="ty-site-codigo__pre" dir="ltr">
        <code>
          {pedacos.map((p, i) =>
            p.tipo === 'plano' ? (
              p.texto
            ) : (
              <span key={i} className={`ty-site-hl ty-site-hl--${p.tipo}`}>
                {p.texto}
              </span>
            ),
          )}
        </code>
      </pre>
    </div>
  )
}
