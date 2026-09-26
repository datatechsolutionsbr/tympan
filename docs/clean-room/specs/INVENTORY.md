# Inventory: fork exports → clean-room names

> History note: the fork (`packages/ui`, `packages/workflow`) was deleted on
> branch `ui/platform-ds`; this inventory records its exports at the time.

Date: 2026-09-26. Sources read: `packages/ui/src/index.ts` and
`packages/workflow/src/index.ts` (public barrels) plus the component files that
are not re-exported but exist in the fork. "Apps" was checked with a search of
`~/datatech/fakhir/apps/**` source (excluding build output).

**Finding on app usage.** Today no app imports anything from `@fakhir/ui`
except its stylesheet. `apps/platform` imports four symbols from
`@fakhir/workflow` (node card, node header, node icon bubble, auto-layout) in
the provenance canvas. `apps/platform/src/components/ui.tsx` holds small local
equivalents of button, text field, select, field, card, page header, spinner,
loading, notice, empty state and a visually-hidden helper; these are marked
"local eq." below and are the first candidates to be replaced by wave 1.

Legend. Category: primitive, form, overlay, navigation, data display,
feedback, layout, chart, canvas, marketing, utility. Wave: 1 core on tokens,
2 remaining UI, 3 workflow and canvas, 4 the items formerly marked "drop
unless needed" plus the four pieces whose open decisions were resolved
(complete port: nothing is dropped any more). Apps: `yes` = imported by an app,
`local eq.` = the app has its own copy, `no` = unused by apps.

## Implementation status (2026-09-26)

| Wave | Specs | Status in `@fakhir/ui` |
|---|---|---|
| 1 | 36 | implemented (branch `ds/clean-room`) |
| 2 | 89 | implemented on `ds/wave-2` (88 files; `wave-2/floating-action-bar.md` is superseded and built from its wave-4 version) |
| 3 | 63 | not in this package: the canvas specs go to `packages/flow` (separate worktree) |
| 4 | 25 + 9 | 20 implemented on `ds/wave-2`; 5 canvas specs (run-view-modes, rule-action-catalog, data-source-node, node-state-styles, flow-palette-tokens) left to `packages/flow`; 9 research-shell specs added by the implementer (below) and implemented |

Research-shell specs added on `ds/wave-2` (written by the implementer from the
approved storyboards and the design direction; they have no fork
counterpart): `wave-4/app-frame-rail.md`, `wave-4/page-header-editorial.md`,
`wave-4/evidence-panel.md`, `wave-4/resizable-split.md`,
`wave-4/stat-strip.md`, `wave-4/stage-strip.md`, `wave-4/attention-list.md`,
`wave-4/activity-feed.md`, `wave-4/phase-bar.md`.

Per-component provenance and test counts: `packages/ui/PROVENANCE.md`.

## @fakhir/ui

| Fork export(s) | New name | Category | Wave | Apps | Spec |
|---|---|---|---|---|---|
| Button, TouchTarget, IconButton, internal button style helper | Button (with icon-only mode and hit area) | primitive | 1 | local eq. | wave-1/button.md |
| link component (not in barrel), TextLink | Link | navigation | 1 | no | wave-1/link.md |
| Text, Strong, Code | Text | primitive | 1 | no | wave-1/text.md |
| Heading, Subheading | Heading | primitive | 1 | no | wave-1/heading.md |
| Input, SearchInput, PasswordInput, FormInput | TextField (plain, search, password) | form | 1 | local eq. | wave-1/text-field.md |
| Textarea, FormTextarea | TextArea | form | 1 | no | wave-1/text-area.md |
| Select, FormSelect | NativeSelect | form | 1 | local eq. | wave-1/native-select.md |
| DropdownSelect | ListboxSelect | form | 1 | no | wave-1/listbox-select.md |
| Switch, ToggleSwitch, LabeledToggle, FormToggle, ThemeSwitch | Switch | form | 1 | no | wave-1/switch.md |
| FormCheckbox | Checkbox | form | 1 | no | wave-1/checkbox.md |
| Fieldset, Legend, FieldGroup, Field, Label, FieldLabel, Description, ErrorMessage, FormField | Field and FieldGroup | form | 1 | local eq. | wave-1/field.md |
| Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Container, ManagementSurface | Surface | layout | 1 | local eq. | wave-1/surface.md |
| CardDivider, Divider | Separator | layout | 1 | no | wave-1/separator.md |
| Badge | Tag | data display | 1 | no | wave-1/tag.md |
| StatusBadge (and status tone map) | StatusPill | feedback | 1 | no | wave-1/status-pill.md |
| Avatar, AvatarButton | Avatar | data display | 1 | no | wave-1/avatar.md |
| Alert | InlineNotice | feedback | 1 | local eq. | wave-1/inline-notice.md |
| Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions | ModalDialog | overlay | 1 | no | wave-1/modal-dialog.md |
| Sheet | Drawer | overlay | 1 | no | wave-1/drawer.md |
| Flyout, InfoPopover | Popover | overlay | 1 | no | wave-1/popover.md |
| ContextMenu | ActionMenu | overlay | 1 | no | wave-1/action-menu.md |
| Tabs, TabsList, TabsTrigger, TabsContent | Tabs | navigation | 1 | no | wave-1/tabs.md |
| SegmentedControl, CompactSegmentedControl | SegmentedControl | form | 1 | no | wave-1/segmented-control.md |
| Table, TableHead, TableBody, TableRow, TableHeader, TableCell, SortableTableHeader, AnimatedTableRow, SelectableTableRow, TableSkeleton, TableSkeletonRow, TableEmptyState | DataTable | data display | 1 | no | wave-1/data-table.md |
| Pagination, DataPagination | Pagination | navigation | 1 | no | wave-1/pagination.md |
| Spinner, InlineSpinner, LoadingOverlay | Spinner | feedback | 1 | local eq. | wave-1/spinner.md |
| Progress | ProgressBar | feedback | 1 | no | wave-1/progress-bar.md |
| CardGridSkeleton, StatCardSkeleton, RegionFilterSkeleton, BrandFilterSkeleton, AnalysisSkeleton, SectionHeaderSkeleton, PageLoadingState, shimmer helpers | Skeleton and PageLoadingState | feedback | 1 | local eq. | wave-1/skeleton.md |
| EmptyState, NoResultsState, NoDataState, OfflineState, PageEmptyState | EmptyState | feedback | 1 | local eq. | wave-1/empty-state.md |
| ErrorState, PageErrorState | ErrorState | feedback | 1 | no | wave-1/error-state.md |
| Breadcrumb | Breadcrumbs | navigation | 1 | no | wave-1/breadcrumbs.md |
| PageHeading, PageHeader, HeroBlock | PageHeader | layout | 1 | local eq. | wave-1/page-header.md |
| SectionHeader, PageSectionHeader, CardSectionHeader | SectionHeading | layout | 1 | no | wave-1/section-heading.md |
| DynamicIsland, DynamicIslandNotification, NotificationProvider, useNotifications | Toast (region, queue and hook) | feedback | 1 | no | wave-1/toast.md |
| SkipToContent | SkipLink | navigation | 1 | no | wave-1/skip-link.md |
| AppShell | AppFrame | layout | 1 | no | wave-1/app-frame.md |
| FloatingActionButton, CreateActionButton | FloatingActionButton | primitive | 2 | no | wave-2/floating-action-button.md |
| SectionCard, HeroSection | SectionPanel | layout | 2 | no | wave-2/section-panel.md |
| ListCard, ListCardItem, FeedItemCard | ListPanel | data display | 2 | no | wave-2/list-panel.md |
| ListItem | ListRow | data display | 2 | no | wave-2/list-row.md |
| ItemSummary | SummaryRow | data display | 2 | no | wave-2/summary-row.md |
| NotificationBadge | CountBadge | feedback | 2 | no | wave-2/count-badge.md |
| NotificationBellButton (notification history part of the provider) | NotificationCenter | feedback | 2 | no | wave-2/notification-center.md |
| ProfileAvatar | ProfileAvatar | data display | 2 | no | wave-2/profile-avatar.md |
| ImageUpload | ImagePicker | form | 2 | no | wave-2/image-picker.md |
| GlassModal | SectionedModal | overlay | 2 | no | wave-2/sectioned-modal.md |
| SettingsModal, PreferenceSection | SettingsDialog and PreferenceGroup | overlay | 2 | no | wave-2/settings-dialog.md |
| ConfirmProvider, useConfirm | ConfirmService | overlay | 2 | no | wave-2/confirm-service.md |
| DynamicIslandConfirm (ui and workflow copies) | CompactConfirm | overlay | 2 | no | wave-2/compact-confirm.md |
| DetailsPopover | DetailsPopover | overlay | 2 | no | wave-2/details-popover.md |
| FlyoutMenu, FlyoutNavGrid, FlyoutQuickActions | NavigationFlyout | navigation | 2 | no | wave-2/navigation-flyout.md |
| NavTrigger | ToolbarTrigger | navigation | 2 | no | wave-2/toolbar-trigger.md |
| AppNavigation, navigation builders (buildDockActions, buildLaunchpadItems, buildFlyoutNavItems, filterByPermission, NavigationItem types) | AppNavigation | navigation | 2 | no | wave-2/app-navigation.md |
| LaunchpadGrid | AppLauncherGrid | navigation | 2 | no | wave-2/app-launcher-grid.md |
| Dock, DockContainer, DockSkeleton | FloatingActionBar | navigation | 4 (was 2) | no | wave-4/floating-action-bar.md (supersedes wave-2/floating-action-bar.md) |
| CommandPalette, fuzzyMatch, useRecentCommands, recordRecent, orderRecentIds, recent constants | CommandPalette and recent-command store | overlay | 2 | no | wave-2/command-palette.md |
| SearchBar | SearchBar | form | 2 | no | wave-2/search-bar.md |
| LiquidFilterInput | FilterField | form | 2 | no | wave-2/filter-field.md |
| ActiveFilterChips | FilterChips | form | 2 | no | wave-2/filter-chips.md |
| FilterTileButton, FilterSectionHeader | FilterTile | form | 2 | no | wave-2/filter-tile.md |
| SelectionCard | ChoiceCard | form | 2 | no | wave-2/choice-card.md |
| PickerTile | ChoiceTile | form | 2 | no | wave-2/choice-tile.md |
| OptionGrid | ChoiceGrid | form | 2 | no | wave-2/choice-grid.md |
| ChipPicker | ChipGroup | form | 2 | no | wave-2/chip-group.md |
| BooleanFlagsPicker | FlagSetPicker | form | 2 | no | wave-2/flag-set-picker.md |
| CategoryTab, CategoryTabs, CategoryBadge | CategoryTabs | navigation | 2 | no | wave-2/category-tabs.md |
| TagInput | TagField | form | 2 | no | wave-2/tag-field.md |
| FormPriceInput | CurrencyField | form | 2 | no | wave-2/currency-field.md |
| DatePicker, internal picker button parts | DateField | form | 2 | no | wave-2/date-field.md |
| TimePicker | TimeField | form | 2 | no | wave-2/time-field.md |
| MonthPicker | MonthField | form | 2 | no | wave-2/month-field.md |
| WheelPicker, MultiColumnPicker | WheelPicker | form | 2 | no | wave-2/wheel-picker.md |
| LanguagePicker, LanguageSwitcher | LocalePicker | form | 2 | no | wave-2/locale-picker.md |
| ThemeToggle, ThemeToggleCompact | ThemeSwitcher | form | 2 | no | wave-2/theme-switcher.md |
| StatusToggle | StateSwitch | form | 2 | no | wave-2/state-switch.md |
| OtpInput | OneTimeCodeField | form | 2 | no | wave-2/one-time-code-field.md |
| PasswordStrengthMeter | PasswordStrength | feedback | 2 | no | wave-2/password-strength.md |
| BackupCodeGrid | RecoveryCodeList | data display | 2 | no | wave-2/recovery-code-list.md |
| SocialLoginButtons | FederatedSignIn | form | 2 | no | wave-2/federated-sign-in.md |
| AuthLayout | AuthFrame | layout | 2 | no | wave-2/auth-frame.md |
| HeroPanel | BrandPanel | layout | 2 | no | wave-2/brand-panel.md |
| CopyableId | CopyIdentifier | data display | 2 | no | wave-2/copy-identifier.md |
| ExpandableHistoryList | HistoryList | data display | 2 | no | wave-2/history-list.md |
| CollapsibleGroupedList | GroupedDisclosureList | data display | 2 | no | wave-2/grouped-disclosure-list.md |
| StatCard | StatTile | data display | 2 | no | wave-2/stat-tile.md |
| MetricCard | MetricTile | data display | 2 | no | wave-2/metric-tile.md |
| CountUp | TweenedNumber | data display | 2 | no | wave-2/tweened-number.md |
| GrowthIndicator, PriceChangeBadge | DeltaIndicator | data display | 2 | no | wave-2/delta-indicator.md |
| AgentAnalysisCard | AgentOutputCard | data display | 2 | no | wave-2/agent-output-card.md |
| ChartRenderer, chart spec helpers (computeSeries, computeDomain, xScale, yScale, chart types) | Chart | chart | 2 | no | wave-2/chart.md |
| DashboardView, validateDashboardSpec, dashboard section types | ReportView | chart | 2 | no | wave-2/report-view.md |
| streaming dashboard (not in barrel), useRunEvents, runEventsMachine | LiveReportView and run-event stream | chart | 2 | no | wave-2/live-report-view.md |
| input request form (not in barrel) | SchemaRequestForm | form | 2 | no | wave-2/schema-request-form.md |
| MarkdownRenderer | MarkdownView | data display | 2 | no | wave-2/markdown-view.md |
| InteractiveGeoMap, GeoMapCanvas, useGeoMapState, MapZoomControls, GeoMapLegend | RegionMap | chart | 2 | no | wave-2/region-map.md |
| StepProgress, StepIndicator | StepList | navigation | 2 | no | wave-2/step-list.md |
| StepFormPage | WizardPage | layout | 2 | no | wave-2/wizard-page.md |
| PageIndicator, ExpandingPageIndicator, ProgressIndicator, DotIndicator | PageDots | navigation | 2 | no | wave-2/page-dots.md |
| Form, FormGrid, InlineForm, FormSection, BaseForm | FormLayout | layout | 2 | no | wave-2/form-layout.md |
| FormActions, FormActionsRow | FormActions | layout | 2 | no | wave-2/form-actions.md |
| EntityCard, EntityCardActions (and its hover constant) | RecordCard | data display | 2 | no | wave-2/record-card.md |
| LegalShell | LegalDocumentFrame | layout | 2 | no | wave-2/legal-document-frame.md |
| ProfileIdentityCard | ProfileSummary | data display | 2 | no | wave-2/profile-summary.md |
| ContactCard, OfficeCard, ContactSection | ContactCard | data display | 2 | no | wave-2/contact-card.md |
| SubscriptionPaywall | UpgradeGate | feedback | 2 | no | wave-2/upgrade-gate.md |
| NotFoundPage, BadRequestPage, ServerErrorPage | HttpErrorPage | feedback | 2 | no | wave-2/http-error-page.md |
| BrandedLoader | BrandLoader | feedback | 2 | no | wave-2/brand-loader.md (presets: wave-4/loader-presets.md) |
| AppLogo, brand module (app themes, logo files, default app id) | BrandMark | primitive | 2 | no | wave-2/brand-mark.md |
| NavigationProgress | RouteProgress | feedback | 2 | no | wave-2/route-progress.md |
| CookieConsent | ConsentBanner | feedback | 2 | no | wave-2/consent-banner.md |
| DevModeBanner | EnvironmentBanner | feedback | 2 | no | wave-2/environment-banner.md |
| Ambient | AmbientBackdrop | layout | 2 | no | wave-2/ambient-backdrop.md |
| SwipeableRow, DeleteSwipeAction, ArchiveSwipeAction, EditSwipeAction, FavoriteSwipeAction | SwipeRow | data display | 2 | no | wave-2/swipe-row.md |
| PullToRefreshContainer, CircularRefreshIndicator, DotRefreshIndicator, usePullToRefresh, PullToRefreshIndicator | PullToRefresh | feedback | 2 | no | wave-2/pull-to-refresh.md |
| EdgeSwipeIndicator, EdgeSwipeProvider | EdgeSwipeBack | navigation | 2 | no | wave-2/edge-swipe-back.md |
| ForceTouchMenu | LongPressMenu | overlay | 2 | no | wave-2/long-press-menu.md |
| SafeArea, SafeAreaView, SafeAreaSpacer, BottomSafeArea | SafeAreaInset | layout | 2 | no | wave-2/safe-area-inset.md |
| useHaptic, triggerHaptic | Haptics | utility | 2 | no | wave-2/haptics.md |
| useViewTransition, withViewTransition, supportsViewTransitions | ViewTransition | utility | 2 | no | wave-2/view-transition.md |
| useEntityList | EntityListLoader | utility | 2 | no | wave-2/entity-list-loader.md |
| RouterProvider, useRouter, usePathname, useLink, useLocationKey | RouterAdapter | utility | 2 | no | wave-2/router-adapter.md |
| I18nProvider, useTranslations, useLocale, useFormatter, createI18nFromMessages | I18nAdapter | utility | 2 | no | wave-2/i18n-adapter.md |
| motion tokens (duration, ease, spring, motionTokens) and animation presets (springPresets, buttonPress, slideUp, fadeScale, prefersReducedMotion, getTransition, …) | MotionFoundation | utility | 2 | no | wave-2/motion-foundation.md |
| formatCurrency, formatPercentage, formatDate, getStatusColor, country-config formatters (formatCountryCurrency, formatAddress, getCountryConfig, registerCountry, getAllCountries) | Formatters | utility | 2 | no | wave-2/formatters.md |
| APIError, isAPIError, getAPIErrorStatus, getAPIErrorCode, HttpResponseError, run domain types | ApiErrorModel | utility | 2 | no | wave-2/api-error-model.md |

### @fakhir/ui wave 4 (formerly dropped, now specified)

Marketing pieces are specified from the intent of design direction §2 and
§6 (public pages only: login and the public project page), not from the
template's look.

| Fork export(s) | New name | Category | Wave | Apps | Spec |
|---|---|---|---|---|---|
| RadiantHeading, RadiantSubheading, Lead | ShowcaseHeading (with Kicker and Lead) | marketing | 4 | no | wave-4/showcase-heading.md |
| AnimatedNumber | RevealNumber | marketing | 4 | no | wave-4/reveal-number.md |
| Gradient, GradientBackground | ShowcaseBackdrop and AccentBand | marketing | 4 | no | wave-4/showcase-backdrop.md |
| BentoCard | FeatureShowcaseCard | marketing | 4 | no | wave-4/feature-showcase-card.md |
| PlusGrid, PlusGridRow, PlusGridItem | RuledGrid (RuledGrid, RuledGridRow, RuledGridCell) | marketing | 4 | no | wave-4/ruled-grid.md |
| RadiantStatCard | HighlightStat | marketing | 4 | no | wave-4/highlight-stat.md |
| FeatureCard | FeatureTile | marketing | 4 | no | wave-4/feature-tile.md |
| RecommendationCard | InsightCard (generalised: proposal by an agent or rule, host actions) | data display | 4 | no | wave-4/insight-card.md |
| MarketPricesCard | TickerCard (generalised: named entries with value and change) | data display | 4 | no | wave-4/ticker-card.md |
| StaggerGrid | CascadeGrid (off by default; global `decorativeMotion` switch; reduced motion always off) | layout | 4 | no | wave-4/cascade-grid.md |
| GlassTestToggle | GlassCheckToggle (developer only) | utility | 4 | no | wave-4/glass-check-toggle.md |
| resolveGlassAccentRgb | ToneTint resolver | utility | 4 | no | wave-4/tone-tint-resolver.md |
| shimmer class helpers (shimmerClass, shimmerWhiteClass) | SkeletonFill | utility | 4 | no | wave-4/skeleton-fill.md |
| KORI_ERP_LOADER, WIRE_LOADER presets of the branded loader | LoaderPresets (generic mechanism; only the Fakhir preset ships) | utility | 4 | no | wave-4/loader-presets.md |
| registerSubdivisionTheme and query helpers (palette, flag URL, hex, gradient, colours, accent, validity) | RegionThemeRegistry | utility | 4 | no | wave-4/region-theme-registry.md |
| 30 per-country theme modules (palettes, accents, coordinates, map centre, macro-regions, flag URL templates, bound helpers) | RegionThemeData (format plus 30 country modules regenerated from public sources) | utility | 4 | no | wave-4/region-theme-data.md |
| country configuration data for the same 30 countries (names, emoji flag, languages, locale, currency, address, tax labels, geometry path, projection) | CountryProfileData | utility | 4 | no | wave-4/country-profile-data.md |
| iosColors, swipe constants, pageControlDot, legacy animation aliases (durations, durationsReduced, easings, springPresets and reduced copies, card hover and press presets, notification banner, listItem, staggerContainer, createMotionProps, getVariants) | LegacyAliasMap (decision record: no aliases shipped, mapped to tokens) | utility | 4 | no | wave-4/legacy-alias-map.md |

## @fakhir/workflow

| Fork export(s) | New name | Category | Wave | Apps | Spec |
|---|---|---|---|---|---|
| Workspace, internal canvas editor, WorkflowBuilderProvider, useWorkflowBuilderClient, useWorkflowBuilderClientOptional, bootstrap payload type | FlowEditor and FlowEditorProvider | canvas | 3 | no | wave-3/flow-editor.md |
| WorkflowPreviewCanvas, node execution status type | FlowPreview | canvas | 3 | no | wave-3/flow-preview.md |
| DraggableCommandBar | CanvasCommandBar | canvas | 3 | no | wave-3/canvas-command-bar.md |
| WorkflowRunControls | RunControls | canvas | 3 | no | wave-3/run-controls.md |
| applyDagreLayout, LayoutDirection | AutoLayout | utility | 3 | yes | wave-3/auto-layout.md |
| NodeCard, GraphNodeBadge, GraphNodeHeader, GraphNodeIconBubble, GraphNodeMeta, internal node-card and graph-node primitives | GraphNodeCard | canvas | 3 | yes | wave-3/graph-node-card.md |
| NodeRenderCatalogProvider, useNodeRenderCatalog, getNodeIconComponent, node catalog cache (setNodeCatalog, getCachedNodeCatalog, isNodeCatalogLoaded, getNodeCatalogEntry, nodeTypeExists, getNodeFieldEnum, resetNodeCatalog), createDefaultLogicNodeConfig, colour and icon constants (logic node and entity maps, execution accents) | NodeKindCatalog | utility | 3 | no | wave-3/node-kind-catalog.md |
| GenericFlowNode | GenericNode | canvas | 3 | no | wave-3/generic-node.md |
| AgentFlowNode, AgentCardBody | AgentNode | canvas | 3 | no | wave-3/agent-node.md |
| RuleFlowNode | RuleNode | canvas | 3 | no | wave-3/rule-node.md |
| NoteFlowNode | NoteNode | canvas | 3 | no | wave-3/note-node.md |
| GroupFlowNode | GroupNode | canvas | 3 | no | wave-3/group-node.md |
| datasource flow node (internal) | DataSourceNode | canvas | 4 (was 3) | no | wave-4/data-source-node.md (supersedes wave-3/data-source-node.md) |
| NodeRunningIndicator | NodeRunIndicator | canvas | 3 | no | wave-3/node-run-indicator.md |
| WorkflowHandle, WorkflowDynamicTargetHandles, WorkflowDynamicHandles | ConnectionPorts | canvas | 3 | no | wave-3/connection-ports.md |
| ConditionalEdge, floating edge geometry (internal) | ConditionalConnector | canvas | 3 | no | wave-3/conditional-connector.md |
| CustomConnectionLine | ConnectionPreviewLine | canvas | 3 | no | wave-3/connection-preview-line.md |
| EdgeInsertPopup | ConnectorInsertMenu | canvas | 3 | no | wave-3/connector-insert-menu.md |
| useHelpLines, help lines overlay (internal) | AlignmentGuides | canvas | 3 | no | wave-3/alignment-guides.md |
| NodePalette, NodeCatalogPaletteList, ModelProvider type | NodePalette | canvas | 3 | no | wave-3/node-palette.md |
| WorkflowListBar | FlowSwitcherBar | navigation | 3 | no | wave-3/flow-switcher-bar.md |
| VersionHistoryPanel | VersionHistoryPanel | data display | 3 | no | wave-3/version-history-panel.md |
| RunPanel | RunPanel | data display | 3 | no | wave-3/run-panel.md |
| VariableInspector | VariableInspector | data display | 3 | no | wave-3/variable-inspector.md |
| RunInputDialog | RunInputDialog | overlay | 3 | no | wave-3/run-input-dialog.md |
| PreviewPanel | RunPreviewPanel | data display | 3 | no | wave-3/run-preview-panel.md; coexistence with RunDrawer: wave-4/run-view-modes.md |
| WorkflowRunDrawer | RunDrawer | overlay | 3 | no | wave-3/run-drawer.md; coexistence with RunPreviewPanel: wave-4/run-view-modes.md |
| SaveStatusBadge | SaveStatus | feedback | 3 | no | wave-3/save-status.md |
| AutoSaveWorkspace | AutosaveController | utility | 3 | no | wave-3/autosave-controller.md |
| NodeContextMenu, SelectionContextMenu, getNodeDimensions, AlignDirection, DistributeDirection, PanelContextMenu | CanvasContextMenus | overlay | 3 | no | wave-3/canvas-context-menus.md |
| AgentModal | AgentEditorDialog | overlay | 3 | no | wave-3/agent-editor-dialog.md |
| agent new wizard page view (internal) | AgentCreationWizard | layout | 3 | no | wave-3/agent-creation-wizard.md |
| LogicNodeModal | NodeConfigDialog | overlay | 3 | no | wave-3/node-config-dialog.md |
| PipelineSettingsModal, PipelineSettingsPatch | FlowSettingsDialog | overlay | 3 | no | wave-3/flow-settings-dialog.md |
| RunReplayModal, ReplayInputVariables | RunReplayDialog | overlay | 3 | no | wave-3/run-replay-dialog.md |
| RunRewindModal, labels and node types | RunRewindDialog | overlay | 3 | no | wave-3/run-rewind-dialog.md |
| DslExportModal | DefinitionExportDialog | overlay | 3 | no | wave-3/definition-export-dialog.md |
| DslImportModal | DefinitionImportDialog | overlay | 3 | no | wave-3/definition-import-dialog.md |
| parseRunLineage, findForkPoint, diffRunTimelines, diffVariableMaps, normalizeTimelineStatus, canonicalStringify | RunLineageAndDiff | utility | 3 | no | wave-3/run-lineage-and-diff.md |
| OutputSchemaBuilder, defaultAgentOutputSchema | OutputSchemaBuilder | form | 3 | no | wave-3/output-schema-builder.md |
| StartNodeConfigForm | StartNodeForm | form | 3 | no | wave-3/start-node-form.md |
| AgentNodeConfigForm | AgentNodeForm | form | 3 | no | wave-3/agent-node-form.md |
| RuleNodeConfigForm | RuleNodeForm | form | 3 | no | wave-3/rule-node-form.md |
| datasource node config form (internal) | DataSourceNodeForm | form | 3 | no | wave-3/data-source-node-form.md |
| code node config form (internal), code operations reference | ComputeNodeForm | form | 3 | no | wave-3/compute-node-form.md |
| Monte Carlo node config form (internal) | SimulationNodeForm | form | 3 | no | wave-3/simulation-node-form.md |
| dashboard output node config form (internal) | ReportOutputNodeForm | form | 3 | no | wave-3/report-output-node-form.md |
| group node config form (internal) | GroupNodeForm | form | 3 | no | wave-3/group-node-form.md |
| schema config form, config form actions (internal) | SchemaConfigForm | form | 3 | no | wave-3/schema-config-form.md |
| variable list editor (internal) | VariableListEditor | form | 3 | no | wave-3/variable-list-editor.md |
| MCP servers field (internal) | ToolServerListField | form | 3 | no | wave-3/tool-server-list-field.md |
| AslExpressionBuilder, AslNode model, ASL_MAX_DEPTH, ASL_PREDICATE_OPS | ExpressionBuilder | form | 3 | no | wave-3/expression-builder.md |
| TraceViewer, runCodeDryRun, DryRunError, trace types | TraceTree and dry-run client | data display | 3 | no | wave-3/trace-tree.md |
| ExecutionTimelinePanel, attachAuditEvents, timeline types | ExecutionTimeline | data display | 3 | no | wave-3/execution-timeline.md |
| RuleForm, defaultRuleForm, RuleConditionBuilder, defaultRuleCondition, RuleActionBuilder, defaultRuleAction, normalizeRuleCondition, rule types | RuleEditor | form | 3 | no | wave-3/rule-editor.md; action kinds: wave-4/rule-action-catalog.md |
| useWorkflowStore, useModalStore, useCanUndo, useCanRedo, useHasCopied, useContextMenu, useEditingNodeId, useSelectedNodeCount, useIsRunning, useNodeResults, store types | FlowEditorState | utility | 3 | no | wave-3/flow-editor-state.md |
| useUndoRedo, useClipboard, useCanvasShortcuts | EditorShortcuts (history, clipboard, keys) | utility | 3 | no | wave-3/editor-shortcuts.md |
| useCanvasSelectionActions | SelectionArrange | utility | 3 | no | wave-3/selection-arrange.md |
| AgentAvatar, AgentCard, getAgentTier, dicebearAvatarUrl, resolveAgentAvatar | AgentIdentity | data display | 3 | no | wave-3/agent-identity.md |
| useWorkflowExecution, useWorkflowRunPresentation, applyWorkflowExecutionEventToStore, resetWorkflowRunPresentation (re-exports of run events and API errors from ui) | RunExecutionState | utility | 3 | no | wave-3/run-execution-state.md |
| NavigatorConversation, useNavigatorChat, messageText, NavigatorMarkdown, chat types | AssistantChat | data display | 3 | no | wave-3/assistant-chat.md |
| NavigatorVizBlock, parseNavigatorViz, vizEnvelopeToDashboardSpec | AssistantVisualBlock | chart | 3 | no | wave-3/assistant-visual-block.md |
| ConversationalShell, ConversationMeta, groupConversationsByDate | ConversationShell | layout | 3 | no | wave-3/conversation-shell.md |
| contract and node data types (WorkflowGraph, WorkflowEdge, EdgeCondition, node data types, AgentNodeConfig, …) | derived from the Fakhir OpenAPI contract, not specified here | utility | 3 | yes (types) | n/a |

### @fakhir/workflow wave 4 (formerly dropped or pending, now specified)

| Fork export(s) | New name | Category | Wave | Apps | Spec |
|---|---|---|---|---|---|
| AnthropicModelIcon, AmazonNovaIcon, MetaLlamaIcon, OpenAIModelIcon, GoogleGeminiIcon, getModelIcon | ThirdPartyMarkSlot and ProviderMark (marks from an openly licensed set supplied by the host; never redrawn; text name always shown) | primitive | 4 | no | wave-4/third-party-mark-slot.md |
| DEFAULT_NODE_GRADIENT, LOGIC_NODE_GRADIENTS, LOGIC_NODE_BADGE_COLORS, LOGIC_NODE_BADGE_SOFT_COLORS, MINIMAP_NODE_COLORS, NODE_EXECUTION_ACCENT_COLORS, getNodeExecutionAccent(Rgb), LOGIC_NODE_HANDLE_COLORS, GRAPH_*_EDGE_COLOR, CATEGORY_COLORS, CATEGORY_PILL_COLORS, ADJUSTMENT_GRADIENT, ADJUSTMENT_PILL, entity colour getters | FlowPaletteTokens | utility | 4 | no | wave-4/flow-palette-tokens.md |
| NODE_SELECTED_CLASS, NODE_HOVER_CLASS, NODE_BORDER_COLORS, getNodeStateClass | NodeStateStyles | utility | 4 | no | wave-4/node-state-styles.md |
| PreviewPanel together with WorkflowRunDrawer (pending decision: keep both) | RunViewModes | canvas | 4 | no | wave-4/run-view-modes.md |
| rule action kinds of RuleActionBuilder (pending decision: host catalog) | RuleActionCatalog (default generic set plus host kinds) | form | 4 | no | wave-4/rule-action-catalog.md |
| datasource flow node dialect logo map (pending decision: logos) | part of DataSourceNode via ThirdPartyMarkSlot | canvas | 4 | no | wave-4/data-source-node.md |
| Dock keyboard access (pending decision: right-click-only menus) | part of FloatingActionBar | navigation | 4 | no | wave-4/floating-action-bar.md |

## Counts

| | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Dropped |
|---|---|---|---|---|---|
| Spec files | 36 | 89 | 63 | 25 | 0 |

Wave 4 breaks down as 21 specs for formerly dropped items (7 marketing
pieces; 2 generalised cards; CascadeGrid; GlassCheckToggle; 3 token and
utility specs for style helpers: ToneTint, SkeletonFill, NodeStateStyles;
LoaderPresets; RegionThemeRegistry; RegionThemeData; CountryProfileData;
LegacyAliasMap;
ThirdPartyMarkSlot; FlowPaletteTokens) and 4 resolutions of pending decisions
(RunViewModes, FloatingActionBar full, RuleActionCatalog, DataSourceNode
full). Two wave-2/3 files are superseded by their wave-4 versions
(`wave-2/floating-action-bar.md`, `wave-3/data-source-node.md`) and stay only
for history; build from wave 4.

(Counts are of spec files; each groups one or more fork exports. Fork size for
reference: about 150 exported UI symbols excluding per-country data, about 76
exported workflow components, hooks and helpers.)
