// ConnectionPorts: the points on a node where connectors start and end. Ports
// are not tab stops; the canvas surface reads their data attributes to draw a
// connection, and the keyboard path is the "Connect to…" command below.

import { useMemo, useState, type CSSProperties } from 'react'
import { Button as AriaButton, ComboBox, Input, Label, ListBox, ListBoxItem, Popover } from 'react-aria-components'
import { Check, ChevronDown, Info, Minus, TriangleAlert, X } from 'lucide-react'
import { Button, ModalDialog, NativeSelect } from '@fakhir/ui'
import type { BranchTone } from '../catalog/kindCatalog'
import { defineLabels, fill, useLabels } from '../internal/labels'
import type { LayoutDirection, Side } from '../model/types'
import { useSurface } from '../surface/SurfaceContext'
import type { PortRef } from '../surface/types'
import { evenSpread, portSetIds, sideForLayout, type PlacedPort } from './ports'

export interface ConnectionPortsLabels {
  input: string
  output: string
  /** "{direction} {label} of {node}"; label may be empty. */
  name: string
}

export const connectionPortsLabels = defineLabels<ConnectionPortsLabels>('connectionPorts', {
  en: { input: 'input', output: 'output', name: '{direction}{label} of {node}' },
  'pt-BR': { input: 'entrada', output: 'saída', name: '{direction}{label} de {node}' },
  es: { input: 'entrada', output: 'salida', name: '{direction}{label} de {node}' },
})
export const defaultConnectionPortsLabels = connectionPortsLabels.bundles.en

const TONE_ICON: Record<BranchTone, typeof Check> = { success: Check, error: X, info: Info, warning: TriangleAlert, neutral: Minus }

/** Small label beside an output: icon and word by tone, never colour alone. */
export function BranchLabel({ label, tone = 'neutral' }: { label: string; tone?: BranchTone }) {
  const Icon = TONE_ICON[tone]
  return (
    <span className="fk-branch-label" data-branch-tone={tone} aria-hidden="true">
      <Icon focusable="false" />
      {label}
    </span>
  )
}

export interface ConnectionPortProps {
  /** Receives (input) or emits (output) connectors. */
  direction: 'input' | 'output'
  /** Preferred side before the layout mapping. */
  side: Side
  id: string
  nodeId: string
  /** Node name used in the port's accessible name. */
  nodeLabel: string
  /** Kind tone (categorical token name) of the point. */
  tone?: string
  branchTone?: BranchTone
  /** Position along the side, in percent; centred when absent. */
  offset?: number
  label?: string
  layout?: LayoutDirection
  /** Read-only picture: decorative, not a connection point. */
  preview?: boolean
  labels?: Partial<ConnectionPortsLabels>
}

/** One port. */
export function ConnectionPort(props: ConnectionPortProps) {
  const { direction, side, id, nodeId, nodeLabel, tone = 'neutral', branchTone, offset, label, layout = 'right', preview = false } = props
  const placed: PlacedPort = {
    id,
    role: direction === 'output' ? 'source' : 'target',
    side: sideForLayout(side, layout),
    along: offset !== undefined ? offset / 100 : 0.5,
    ...(label ? { label } : {}),
    ...(branchTone ? { tone: branchTone } : {}),
  }
  return <PortDot port={placed} nodeId={nodeId} nodeLabel={nodeLabel} tone={tone} preview={preview} labels={props.labels} />
}

export interface PortSetProps extends Omit<ConnectionPortProps, 'id' | 'offset'> {
  count: number
  idPrefix: string
  /** Stable keys for items that can be reordered; replaces prefix-index ids. */
  keys?: readonly string[]
}

/** Several ports spread evenly along one side (ids prefix-0, prefix-1 …). */
export function PortSet({ count, idPrefix, keys, ...rest }: PortSetProps) {
  return (
    <>
      {portSetIds(count, idPrefix, keys).map((id, i) => (
        <ConnectionPort key={id} {...rest} id={id} offset={evenSpread(i, count) * 100} />
      ))}
    </>
  )
}

export interface ConnectionPortsProps {
  nodeId: string
  nodeLabel: string
  inputs: readonly PlacedPort[]
  outputs: readonly PlacedPort[]
  tone?: string
  preview?: boolean
  labels?: Partial<ConnectionPortsLabels>
}

/** All ports of a node (see portsOf). */
export function ConnectionPorts({ nodeId, nodeLabel, inputs, outputs, tone = 'neutral', preview = false, labels }: ConnectionPortsProps) {
  return (
    <>
      {[...inputs, ...outputs].map((p) => (
        <PortDot key={`${p.role}-${p.id}`} port={p} nodeId={nodeId} nodeLabel={nodeLabel} tone={tone} preview={preview} labels={labels} />
      ))}
    </>
  )
}

function PortDot({ port, nodeId, nodeLabel, tone, preview, labels }: { port: PlacedPort; nodeId: string; nodeLabel: string; tone: string; preview: boolean; labels: Partial<ConnectionPortsLabels> | undefined }) {
  const l = useLabels(connectionPortsLabels, labels)
  const surface = useSurface()
  const name = fill(l.name, { direction: port.role === 'source' ? l.output : l.input, label: port.label ? ` ${port.label}` : '', node: nodeLabel })
  const target = surface.connectTarget?.nodeId === nodeId && surface.connecting && surface.connecting.role !== port.role ? (surface.connectTarget.valid ? 'valid' : 'invalid') : undefined
  const connectingFromHere = surface.connecting?.nodeId === nodeId && surface.connecting.portId === port.id && surface.connecting.role === port.role
  const style = { '--fk-port-along': `${port.along * 100}%` } as CSSProperties
  const common = {
    className: 'fk-port',
    'data-side': port.side,
    'data-role': port.role,
    'data-tone': tone,
    ...(port.tone ? { 'data-branch-tone': port.tone } : {}),
    'data-hidden': surface.floating ? 'true' : undefined,
    'data-target': target,
    'data-origin': connectingFromHere ? 'true' : undefined,
    style,
  }
  if (preview) {
    return (
      <span {...common} data-preview="true" aria-hidden="true">
        <span className="fk-port__dot" />
      </span>
    )
  }
  return (
    <span {...common} data-fk-port="" data-fk-port-node={nodeId} data-fk-port-id={port.id} data-fk-port-role={port.role} data-port-id={port.id}>
      <span className="fk-port__dot" aria-hidden="true" />
      <span className="fk-visually-hidden">{name}</span>
      {port.label ? <BranchLabel label={port.label} {...(port.tone ? { tone: port.tone } : {})} /> : null}
    </span>
  )
}

// ---- keyboard alternative -----------------------------------------------

export interface ConnectToLabels {
  title: string
  description: string
  output: string
  target: string
  targetPlaceholder: string
  noTargets: string
  connect: string
  cancel: string
}

export const connectToLabels = defineLabels<ConnectToLabels>('connectTo', {
  en: {
    title: 'Connect {node} to…',
    description: 'Choose the step that receives this connection.',
    output: 'Output',
    target: 'Target step',
    targetPlaceholder: 'Type a step name',
    noTargets: 'No step can receive this connection.',
    connect: 'Connect',
    cancel: 'Cancel',
  },
  'pt-BR': {
    title: 'Conectar {node} a…',
    description: 'Escolha a etapa que recebe esta conexão.',
    output: 'Saída',
    target: 'Etapa de destino',
    targetPlaceholder: 'Digite o nome de uma etapa',
    noTargets: 'Nenhuma etapa pode receber esta conexão.',
    connect: 'Conectar',
    cancel: 'Cancelar',
  },
  es: {
    title: 'Conectar {node} con…',
    description: 'Elige el paso que recibe esta conexión.',
    output: 'Salida',
    target: 'Paso de destino',
    targetPlaceholder: 'Escribe el nombre de un paso',
    noTargets: 'Ningún paso puede recibir esta conexión.',
    connect: 'Conectar',
    cancel: 'Cancelar',
  },
})
export const defaultConnectToLabels = connectToLabels.bundles.en

export interface ConnectTarget {
  nodeId: string
  label: string
  kindLabel?: string
}

export interface ConnectToDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sourceId: string
  sourceLabel: string
  /** Outputs of the source; a list to choose from when there is more than one. */
  outputs: readonly PlacedPort[]
  /** Valid targets only (the host filters with canConnect). */
  targets: readonly ConnectTarget[]
  /** Same call a pointer drop makes. */
  onConnect: (from: PortRef, to: PortRef) => void
  labels?: Partial<ConnectToLabels>
}

/** "Connect to…": the keyboard way to create a connector from the focused node. */
export function ConnectToDialog({ isOpen, onOpenChange, sourceId, sourceLabel, outputs, targets, onConnect, labels }: ConnectToDialogProps) {
  const l = useLabels(connectToLabels, labels)
  const [output, setOutput] = useState<string | undefined>(outputs[0]?.id)
  const [target, setTarget] = useState<string | null>(null)
  const items = useMemo(() => targets.map((t) => ({ id: t.nodeId, ...t })), [targets])
  const submit = () => {
    if (!target) return
    onConnect({ nodeId: sourceId, role: 'source', ...(output ? { portId: output } : {}) }, { nodeId: target, role: 'target' })
    onOpenChange(false)
  }
  return (
    <ModalDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="narrow"
      title={fill(l.title, { node: sourceLabel })}
      description={l.description}
      actions={
        <>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            {l.cancel}
          </Button>
          <Button variant="primary" disabled={!target} onPress={submit}>
            {l.connect}
          </Button>
        </>
      }
    >
      <div className="fk-connect-to">
        {outputs.length > 1 ? (
          <NativeSelect label={l.output} options={outputs.map((o) => ({ value: o.id, label: o.label ?? o.id }))} value={output ?? ''} onChange={setOutput} />
        ) : null}
        {items.length ? (
          <ComboBox className="fk-connect-to__combo" items={items} selectedKey={target} onSelectionChange={(k) => setTarget(k === null ? null : String(k))} menuTrigger="focus">
            <Label className="fk-connect-to__label">{l.target}</Label>
            <div className="fk-connect-to__field">
              <Input className="fk-connect-to__input" placeholder={l.targetPlaceholder} />
              <AriaButton className="fk-connect-to__toggle">
                <ChevronDown aria-hidden="true" focusable="false" />
              </AriaButton>
            </div>
            <Popover className="fk-connect-to__popover">
              <ListBox className="fk-connect-to__list">
                {(item: (typeof items)[number]) => (
                  <ListBoxItem id={item.id} textValue={item.label} className="fk-connect-to__option">
                    {item.label}
                    {item.kindLabel ? <span className="fk-connect-to__kind">{item.kindLabel}</span> : null}
                  </ListBoxItem>
                )}
              </ListBox>
            </Popover>
          </ComboBox>
        ) : (
          <p className="fk-connect-to__empty">{l.noTargets}</p>
        )}
      </div>
    </ModalDialog>
  )
}
