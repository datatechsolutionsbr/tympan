// @datatechsolutions/tympan/flow (FSL-1.1-ALv2), the flow and provenance canvas
// (formerly the @datatechsolutions/tympan-flow package). It needs the optional
// peer @dagrejs/dagre. Import the stylesheets once, design system first:
//   import '@datatechsolutions/tympan/styles.css'
//   import '@datatechsolutions/tympan/flow.css'

// Model and pure helpers
export * from './model/types'
export * from './model/graph'
export * from './geometry/rect'
export * from './geometry/viewport'
export * from './geometry/curve'
export * from './geometry/guides'
export * from './geometry/arrange'
export * from './layout/autoLayout'

// Catalog, palette tokens and node state attributes
export * from './catalog/kindCatalog'
export * from './catalog/icons'
export * from './catalog/palette'
export * from './catalog/nodeState'
export * from './catalog/RenderCatalog'

// Editor state
export * from './state/store'
export * from './state/graphEdits'
export * from './state/editorState'
export * from './state/dialogStack'

// Shared infrastructure
export { AnnouncerProvider, useAnnounce } from './internal/Announcer'
export { ConfirmProvider, useConfirm, type ConfirmFn, type ConfirmOptions } from './internal/confirm'
export { SectionedModal, type SectionedModalProps, type ModalSection } from './internal/SectionedModal'
export { DockedPanel, type DockedPanelProps } from './internal/DockedPanel'
export { formatDuration, formatRelative, formatDateTime } from './internal/format'
/** Host i18n adapter: `messages[componentKey]` overrides a component's labels (ICU templates). */
export { FlowMessagesProvider } from './internal/labels'

// Canvas surface
export * from './surface/types'
export { CanvasSurface, type CanvasSurfaceProps } from './surface/CanvasSurface'
export { useSurface, type SurfaceContextValue } from './surface/SurfaceContext'

// Component groups
export * from './nodes'
export * from './connectors'
export * from './decision'
export * from './provenance'
export * from './editor'
export * from './steps'
export * from './toolbar'
export * from './run'
export * from './forms'
export * from './expressions'
export * from './dialogs'
export * from './agents'
export * from './assistant'
export * from './report'
