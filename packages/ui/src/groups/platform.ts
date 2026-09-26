// Public exports of the "platform" group (re-exported by src/index.ts).

// Utilities
export {
  duration as motionDuration,
  ease as motionEase,
  motionPresets,
  getPreset,
  prefersReducedMotion,
  resolveTransition,
  DecorativeMotion,
  useDecorativeMotion,
  DECORATIVE_MOTION_DEFAULT,
  type DurationStep,
  type EaseStep,
  type MotionPreset,
  type MotionPresetName,
  type MotionTransition,
} from '../utilities/motion-foundation/motion'
export { playHaptic, cancelHaptic, hapticsSupported, useHaptics, HapticsPreference, type HapticPattern, type HapticsApi } from '../utilities/haptics/haptics'
export {
  runWithTransition,
  supportsViewTransitions,
  useViewTransition,
  VIEW_TRANSITION_MARKER,
  type ViewTransitionHandle,
  type ViewTransitionKind,
  type ViewTransitionOptions,
} from '../utilities/view-transition/viewTransition'
export {
  RouterAdapterProvider,
  useRouterAdapter,
  useRouter,
  usePathname,
  useLink,
  useLocationKey,
  FallbackAnchor,
  type NavigationAdapter,
  type NavigationCommands,
  type RouteAnchor,
  type RouteAnchorProps,
} from '../utilities/router-adapter/RouterAdapter'
export {
  I18nAdapterProvider,
  createI18nValue,
  createFormatter,
  useTranslations,
  useLocale,
  useFormatter,
  type I18nAdapterValue,
  type TranslateFn,
  type MessageTree,
  type LocaleFormatter,
} from '../utilities/i18n-adapter/I18nAdapter'
export { formatMessage, type MessageParams } from '../utilities/i18n-adapter/icu'
export { useEntityListLoader, type ListLoaderOptions, type ListLoaderResult } from '../utilities/entity-list-loader/useEntityListLoader'
export {
  formatMoney,
  formatPercent,
  formatDateTime,
  formatAddress,
  registerCountry,
  getCountry,
  listCountries,
  toneForStatus,
  useFormatters,
  DEFAULT_PLACEHOLDER,
  type CountryConfig,
  type DateInput,
  type StatusTone as SemanticStatusTone,
} from '../utilities/formatters/formatters'
export {
  ApiError,
  HttpResponseError,
  ProblemError,
  isApiError,
  statusOf,
  codeOf,
  isKnownRunEvent,
  createRunEventConsumer,
  runStatusFromContract,
  nodeStatusFromContract,
  eventTypeFromContract,
  KNOWN_RUN_EVENT_TYPES,
  type SerializedApiError,
  type ProblemDocument,
  type NodeStatus,
  type RunStatus,
  type VariableValue,
  type ExecutionEvent,
  type KnownRunEventType,
  type RunEventHandlers,
} from '../utilities/api-error-model/apiErrors'

// Components
export * from '../components/swipe-row/SwipeRow'
export * from '../components/pull-to-refresh/PullToRefresh'
export * from '../components/edge-swipe-back/EdgeSwipeBack'
export * from '../components/safe-area-inset/SafeAreaInset'
export * from '../components/glass-check-toggle/GlassCheckToggle'
export * from '../components/cascade-grid/CascadeGrid'
