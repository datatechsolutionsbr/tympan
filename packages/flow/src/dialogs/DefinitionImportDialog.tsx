// DefinitionImportDialog: takes a flow definition file by drop or by the
// file picker, validates its structure, lists every problem and imports the
// normalised graph. The zone only receives drops; the picker button is the
// interactive element.

import { useEffect, useRef, useState } from 'react'
import { DropZone, FileTrigger, type DropZoneProps } from 'react-aria-components'
import { FileUp } from 'lucide-react'
import { Button, InlineNotice, useMediaQuery } from '@fakhir/design-system'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowConnector, FlowGraph, FlowNode } from '../model/types'

export interface DefinitionImportDialogLabels {
  title: string
  description: string
  dropHere: string
  dropActive: string
  chooseFile: string
  fileHint: string
  chooseAnother: string
  reading: string
  valid: string
  invalidTitle: string
  invalidFormat: string
  notObject: string
  missingNodes: string
  missingConnectors: string
  missingViewport: string
  nodeField: string
  connectorField: string
  cancel: string
  import: string
}

export const definitionImportDialogLabels = defineLabels<DefinitionImportDialogLabels>('DefinitionImportDialog', {
  en: {
    title: 'Import definition',
    description: 'Replace this flow with a definition exported from Fakhir.',
    dropHere: 'Drop a definition file here',
    dropActive: 'Release to read the file',
    chooseFile: 'Choose file',
    fileHint: 'A .json file exported from a flow.',
    chooseAnother: 'Choose another file',
    reading: 'Reading the file',
    valid: '{nodes, plural, one {# step} other {# steps}} and {connectors, plural, one {# connection} other {# connections}} ready to import.',
    invalidTitle: 'This file cannot be imported',
    invalidFormat: 'Invalid format: the file is not readable structured data.',
    notObject: 'The definition must be an object.',
    missingNodes: 'The list of steps (nodes) is missing.',
    missingConnectors: 'The list of connections (connectors) is missing.',
    missingViewport: 'The viewport object is missing.',
    nodeField: 'Step {index}: missing {field}.',
    connectorField: 'Connection {index}: missing {field}.',
    cancel: 'Cancel',
    import: 'Import',
  },
  'pt-BR': {
    title: 'Importar definição',
    description: 'Substitui este fluxo por uma definição exportada do Fakhir.',
    dropHere: 'Solte aqui um arquivo de definição',
    dropActive: 'Solte para ler o arquivo',
    chooseFile: 'Escolher arquivo',
    fileHint: 'Um arquivo .json exportado de um fluxo.',
    chooseAnother: 'Escolher outro arquivo',
    reading: 'Lendo o arquivo',
    valid: '{nodes, plural, one {# passo} other {# passos}} e {connectors, plural, one {# conexão} other {# conexões}} prontos para importar.',
    invalidTitle: 'Este arquivo não pode ser importado',
    invalidFormat: 'Formato inválido: o arquivo não é um dado estruturado legível.',
    notObject: 'A definição precisa ser um objeto.',
    missingNodes: 'Falta a lista de passos (nodes).',
    missingConnectors: 'Falta a lista de conexões (connectors).',
    missingViewport: 'Falta o objeto de enquadramento (viewport).',
    nodeField: 'Passo {index}: falta {field}.',
    connectorField: 'Conexão {index}: falta {field}.',
    cancel: 'Cancelar',
    import: 'Importar',
  },
  es: {
    title: 'Importar definición',
    description: 'Reemplaza este flujo por una definición exportada de Fakhir.',
    dropHere: 'Suelta aquí un archivo de definición',
    dropActive: 'Suelta para leer el archivo',
    chooseFile: 'Elegir archivo',
    fileHint: 'Un archivo .json exportado de un flujo.',
    chooseAnother: 'Elegir otro archivo',
    reading: 'Leyendo el archivo',
    valid: '{nodes, plural, one {# paso} other {# pasos}} y {connectors, plural, one {# conexión} other {# conexiones}} listos para importar.',
    invalidTitle: 'Este archivo no se puede importar',
    invalidFormat: 'Formato no válido: el archivo no es un dato estructurado legible.',
    notObject: 'La definición debe ser un objeto.',
    missingNodes: 'Falta la lista de pasos (nodes).',
    missingConnectors: 'Falta la lista de conexiones (connectors).',
    missingViewport: 'Falta el objeto de encuadre (viewport).',
    nodeField: 'Paso {index}: falta {field}.',
    connectorField: 'Conexión {index}: falta {field}.',
    cancel: 'Cancelar',
    import: 'Importar',
  },
})
export const defaultDefinitionImportDialogLabels = definitionImportDialogLabels.bundles.en

type DropEvent = Parameters<NonNullable<DropZoneProps['onDrop']>>[0]
type DropItem = DropEvent['items'][number]

export type DefinitionCheck = { ok: true; graph: FlowGraph } | { ok: false; errors: string[] }

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** Parses and validates a definition; every problem is listed with its item index. */
export function checkFlowDefinition(text: string, labels: DefinitionImportDialogLabels = defaultDefinitionImportDialogLabels, locale?: string): DefinitionCheck {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return { ok: false, errors: [labels.invalidFormat] }
  }
  if (!isObject(root)) return { ok: false, errors: [labels.notObject] }
  const g = isObject(root.graph) ? root.graph : root
  const errors: string[] = []
  const nodes = g.nodes
  const connectors = g.connectors
  if (!Array.isArray(nodes)) errors.push(labels.missingNodes)
  if (!Array.isArray(connectors)) errors.push(labels.missingConnectors)
  if (!isObject(g.viewport)) errors.push(labels.missingViewport)
  if (Array.isArray(nodes)) {
    nodes.forEach((n, index) => {
      const item = isObject(n) ? n : {}
      for (const field of ['id', 'kind', 'position'] as const) {
        const ok = field === 'position' ? isObject(item.position) : typeof item[field] === 'string' && item[field] !== ''
        if (!ok) errors.push(fill(labels.nodeField, { index, field }, locale))
      }
    })
  }
  if (Array.isArray(connectors)) {
    connectors.forEach((c, index) => {
      const item = isObject(c) ? c : {}
      for (const field of ['id', 'source', 'target'] as const) {
        if (typeof item[field] !== 'string' || item[field] === '') errors.push(fill(labels.connectorField, { index, field }, locale))
      }
    })
  }
  if (errors.length) return { ok: false, errors }
  const vp = g.viewport as Record<string, unknown>
  const graph: FlowGraph = {
    nodes: (nodes as Array<Record<string, unknown>>).map((n) => {
      const p = n.position as Record<string, unknown>
      return {
        ...(n as unknown as FlowNode),
        position: { x: num(p.x, 0), y: num(p.y, 0) },
        data: isObject(n.data) ? n.data : { label: '' },
      }
    }),
    connectors: (connectors as Array<Record<string, unknown>>).map((c) => ({
      ...(c as unknown as FlowConnector),
      sourcePort: typeof c.sourcePort === 'string' && c.sourcePort ? c.sourcePort : 'out',
      targetPort: typeof c.targetPort === 'string' && c.targetPort ? c.targetPort : 'in',
    })),
    viewport: { x: num(vp.x, 0), y: num(vp.y, 0), zoom: num(vp.zoom, 1) },
  }
  return { ok: true, graph }
}

function readFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ''))
    r.onerror = () => reject(r.error)
    r.readAsText(file)
  })
}

export interface DefinitionImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (graph: FlowGraph) => void
  labels?: Partial<DefinitionImportDialogLabels>
}

type Picked = { name: string; status: 'reading' } | { name: string; status: 'done'; check: DefinitionCheck }

export function DefinitionImportDialog({ open, onClose, onImport, labels }: DefinitionImportDialogProps) {
  const l = useLabels(definitionImportDialogLabels, labels)
  const { locale, direction } = useFlowLocale()
  const coarse = useMediaQuery('(pointer: coarse)')
  const [picked, setPicked] = useState<Picked | null>(null)
  const pickerRef = useRef<HTMLButtonElement>(null)
  const refocusPicker = useRef(false)

  useEffect(() => {
    if (!open) setPicked(null)
  }, [open])
  useEffect(() => {
    if (!picked && refocusPicker.current) {
      refocusPicker.current = false
      requestAnimationFrame(() => pickerRef.current?.focus())
    }
  }, [picked])

  const accept = async (file: File | undefined | null) => {
    if (!file) return
    setPicked({ name: file.name, status: 'reading' })
    try {
      const text = await readFile(file)
      setPicked({ name: file.name, status: 'done', check: checkFlowDefinition(text, l, locale) })
    } catch {
      setPicked({ name: file.name, status: 'done', check: { ok: false, errors: [l.invalidFormat] } })
    }
  }

  const onDrop = async (e: DropEvent) => {
    const item = e.items.find((i: DropItem) => i.kind === 'file')
    if (item && item.kind === 'file') await accept(await item.getFile())
  }

  const check = picked?.status === 'done' ? picked.check : null

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={l.title}
      subtitle={l.description}
      width="regular"
      className="fk-definition-import"
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            {l.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={!check?.ok}
            onPress={() => {
              if (check?.ok) {
                onImport(check.graph)
                onClose()
              }
            }}
          >
            {l.import}
          </Button>
        </>
      }
    >
      {picked ? (
        <div className="fk-definition-import__result" dir={direction}>
          <div className="fk-definition-import__file">
            <span className="fk-definition-import__file-name">{picked.name}</span>
            <Button
              variant="quiet"
              size="compact"
              onPress={() => {
                refocusPicker.current = true
                setPicked(null)
              }}
            >
              {l.chooseAnother}
            </Button>
          </div>
          <div role="status" aria-live="polite" className="fk-definition-import__status">
            {picked.status === 'reading' ? <p className="fk-definition-import__reading">{l.reading}</p> : null}
            {check?.ok ? (
              <InlineNotice tone="success" urgency="none">
                {fill(l.valid, { nodes: check.graph.nodes.length, connectors: check.graph.connectors.length }, locale)}
              </InlineNotice>
            ) : null}
            {check && !check.ok ? (
              <InlineNotice tone="danger" urgency="none" title={l.invalidTitle}>
                <ul className="fk-definition-import__errors">
                  {check.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </InlineNotice>
            ) : null}
          </div>
        </div>
      ) : (
        <DropZone className="fk-definition-import__zone" dir={direction} aria-label={l.dropHere} onDrop={(e) => void onDrop(e)}>
          {({ isDropTarget }) => (
            <>
              <FileUp className="fk-definition-import__icon" aria-hidden="true" focusable="false" />
              <p className="fk-definition-import__instruction" data-drop-target={isDropTarget || undefined}>
                {coarse ? l.chooseFile : isDropTarget ? l.dropActive : l.dropHere}
              </p>
              <p className="fk-definition-import__hint">{l.fileHint}</p>
              <FileTrigger acceptedFileTypes={['application/json', '.json']} onSelect={(files) => void accept(files?.[0])}>
                <Button ref={pickerRef} variant="secondary">
                  {l.chooseFile}
                </Button>
              </FileTrigger>
            </>
          )}
        </DropZone>
      )}
    </SectionedModal>
  )
}
