// ToolServerListField: zero or more external tool servers (Model Context
// Protocol) for an agent, each reached by a remote address or a local
// command. Headers are kept untouched (secrets live on credential screens).

import { useEffect, useId, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Fieldset, TextField } from '@datatechsolutions/tympan'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export interface ToolServer {
  prefix?: string
  url?: string
  command?: string
  args?: string[]
  headers?: Record<string, string>
}

export interface ToolServerListLabels {
  label: string
  add: string
  empty: string
  legend: string
  prefix: string
  prefixHint: string
  url: string
  urlPlaceholder: string
  command: string
  args: string
  argsHint: string
  remove: string
  incomplete: string
  badUrl: string
  added: string
}

export const toolServerListLabels = defineLabels<ToolServerListLabels>('ToolServerListField', {
  en: {
    label: 'Tool servers',
    add: 'Add server',
    empty: 'No tool server attached.',
    legend: 'Server {n, number}',
    prefix: 'Tool name prefix',
    prefixHint: 'Put in front of every tool this server offers.',
    url: 'Remote address',
    urlPlaceholder: 'https://',
    command: 'Local command',
    args: 'Command arguments',
    argsHint: 'Separated by spaces.',
    remove: 'Remove server {n, number}',
    incomplete: 'Without an address or a command this server will be ignored on save.',
    badUrl: 'Not a valid address.',
    added: 'Server added',
  },
  'pt-BR': {
    label: 'Servidores de ferramentas',
    add: 'Adicionar servidor',
    empty: 'Nenhum servidor de ferramentas associado.',
    legend: 'Servidor {n, number}',
    prefix: 'Prefixo dos nomes das ferramentas',
    prefixHint: 'Vai antes de cada ferramenta oferecida por este servidor.',
    url: 'Endereço remoto',
    urlPlaceholder: 'https://',
    command: 'Comando local',
    args: 'Argumentos do comando',
    argsHint: 'Separados por espaços.',
    remove: 'Remover servidor {n, number}',
    incomplete: 'Sem endereço nem comando, este servidor será ignorado ao salvar.',
    badUrl: 'Endereço inválido.',
    added: 'Servidor adicionado',
  },
  es: {
    label: 'Servidores de herramientas',
    add: 'Añadir servidor',
    empty: 'No hay servidores de herramientas.',
    legend: 'Servidor {n, number}',
    prefix: 'Prefijo de los nombres de herramientas',
    prefixHint: 'Se antepone a cada herramienta que ofrece este servidor.',
    url: 'Dirección remota',
    urlPlaceholder: 'https://',
    command: 'Comando local',
    args: 'Argumentos del comando',
    argsHint: 'Separados por espacios.',
    remove: 'Quitar servidor {n, number}',
    incomplete: 'Sin dirección ni comando, este servidor se ignorará al guardar.',
    badUrl: 'La dirección no es válida.',
    added: 'Servidor añadido',
  },
})

export const defaultToolServerListLabels: ToolServerListLabels = toolServerListLabels.bundles.en

export interface ToolServerListFieldProps {
  value: ToolServer[]
  /** Every edit, add or removal (raw; clean with cleanToolServers on save). */
  onChange: (list: ToolServer[]) => void
  /** Hosts that forbid local processes hide command and arguments. */
  allowCommand?: boolean
  labels?: Partial<ToolServerListLabels>
}

const splitArgs = (text: string) => text.split(/\s+/).filter(Boolean)

/** Trims fields, drops empty arguments and entries without address or command; undefined when nothing remains. */
export function cleanToolServers(list: readonly ToolServer[] | undefined): ToolServer[] | undefined {
  const out: ToolServer[] = []
  for (const s of list ?? []) {
    const prefix = s.prefix?.trim()
    const url = s.url?.trim()
    const command = s.command?.trim()
    const args = (s.args ?? []).map((a) => a.trim()).filter(Boolean)
    if (!url && !command) continue
    out.push({
      ...(prefix ? { prefix } : {}),
      ...(url ? { url } : {}),
      ...(command ? { command } : {}),
      ...(args.length ? { args } : {}),
      ...(s.headers ? { headers: s.headers } : {}),
    })
  }
  return out.length ? out : undefined
}

function isUrl(text: string): boolean {
  try {
    const u = new URL(text.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function ToolServerListField({ value, onChange, allowCommand = true, labels }: ToolServerListFieldProps) {
  const l = useLabels(toolServerListLabels, labels)
  const { locale } = useFlowLocale()
  const headingId = useId()
  // Argument text is kept as typed so spaces survive while editing.
  const [argText, setArgText] = useState<string[]>(() => value.map((s) => (s.args ?? []).join(' ')))
  const [urlChecked, setUrlChecked] = useState<Record<number, boolean>>({})
  const [live, setLive] = useState('')
  const firstFields = useRef<Array<HTMLInputElement | null>>([])
  const addRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null)
  const pendingFocus = useRef<number | 'add' | null>(null)

  useEffect(() => {
    if (pendingFocus.current === null) return
    const target = pendingFocus.current === 'add' ? addRef.current : firstFields.current[pendingFocus.current]
    pendingFocus.current = null
    target?.focus()
  })

  const patch = (i: number, p: Partial<ToolServer>) => onChange(value.map((s, k) => (k === i ? { ...s, ...p } : s)))

  const add = () => {
    setArgText((t) => [...t, ''])
    pendingFocus.current = value.length
    onChange([...value, {}])
    setLive(l.added)
  }

  const remove = (i: number) => {
    setArgText((t) => t.filter((_, k) => k !== i))
    const next = value.filter((_, k) => k !== i)
    pendingFocus.current = next.length ? Math.min(i, next.length - 1) : 'add'
    onChange(next)
  }

  return (
    <div className="ty-tool-servers" role="group" aria-labelledby={headingId}>
      <div className="ty-tool-servers__header">
        <span id={headingId} className="ty-tool-servers__label">
          {l.label}
        </span>
        <Button ref={addRef} variant="secondary" size="compact" leadingIcon={<Plus />} onPress={add}>
          {l.add}
        </Button>
      </div>
      {value.length === 0 ? <p className="ty-tool-servers__empty">{l.empty}</p> : null}
      {value.map((s, i) => {
        const n = i + 1
        const incomplete = !s.url?.trim() && !s.command?.trim()
        const badUrl = urlChecked[i] && !!s.url?.trim() && !isUrl(s.url)
        return (
          <Fieldset key={i} legend={fill(l.legend, { n }, locale)} className="ty-tool-servers__entry">
            <TextField
              ref={(el) => {
                firstFields.current[i] = el
              }}
              label={l.prefix}
              hint={l.prefixHint}
              value={s.prefix ?? ''}
              onChange={(v) => patch(i, { prefix: v })}
            />
            <div className="ty-tool-servers__reach" data-command={allowCommand || undefined}>
              <TextField
                label={l.url}
                inputType="url"
                placeholder={l.urlPlaceholder}
                className="ty-ltr-text"
                value={s.url ?? ''}
                onChange={(v) => patch(i, { url: v })}
                onBlur={() => setUrlChecked((c) => ({ ...c, [i]: true }))}
                {...(badUrl ? { errorMessage: l.badUrl } : {})}
              />
              {allowCommand ? (
                <TextField label={l.command} className="ty-tool-servers__mono ty-ltr-text" value={s.command ?? ''} onChange={(v) => patch(i, { command: v })} />
              ) : null}
            </div>
            {allowCommand ? (
              <TextField
                label={l.args}
                hint={l.argsHint}
                className="ty-tool-servers__mono ty-ltr-text"
                value={argText[i] ?? (s.args ?? []).join(' ')}
                onChange={(v) => {
                  setArgText((t) => {
                    const copy = [...t]
                    copy[i] = v
                    return copy
                  })
                  patch(i, { args: splitArgs(v) })
                }}
              />
            ) : null}
            {incomplete ? (
              <p className="ty-tool-servers__hint" data-tone="warning">
                {l.incomplete}
              </p>
            ) : null}
            <div className="ty-tool-servers__actions">
              <Button variant="quiet" size="compact" leadingIcon={<Trash2 />} onPress={() => remove(i)} accessibleLabel={fill(l.remove, { n }, locale)}>
                {fill(l.remove, { n }, locale)}
              </Button>
            </div>
          </Fieldset>
        )
      })}
      <p className="ty-visually-hidden" role="status" aria-live="polite">
        {live}
      </p>
    </div>
  )
}
