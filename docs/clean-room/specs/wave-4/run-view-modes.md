# RunViewModes (RunPreviewPanel and RunDrawer together)

Wave 4 · canvas · Status: specified

## Purpose
Resolves the open question of wave 3: **both** run views are kept, as two modes of one feature. RunPreviewPanel (wave 3) is the compact floating mode for glancing at a run while editing; RunDrawer (wave 3) is the docked full mode for inspecting a run in depth (metrics, tokens, tools, per-node breakdown). This spec defines how they coexist inside FlowEditor, how a person moves between them, and what they share.

## Anatomy
- **Run view setting**: `mode` is `'panel' | 'drawer'`; `open` is a boolean. Only one mode is visible at a time.
- **Shared selection**: the selected run id, the selected node id within it and the active tab (Live or History) live in RunExecutionState, not inside either view, so switching mode keeps them.
- **Switch control**: RunPreviewPanel's header gains an "expand" control that switches to the drawer; RunDrawer's header gains a "compact view" control that switches to the panel. Both keep focus on the equivalent control in the new mode.
- **Entry points**: RunControls' "run details" button opens the current mode; starting a run opens the view only if the host asks (`openOnRun`); a failed run always opens the drawer on the failing node (design direction §3.10: failure is salient).
- **Shared data**: both call the same `loadRuns(flowId)` and use the same status normalisation and "not reported" wording; both show an error with retry when the loader rejects (the panel gains retry, which wave 3 lacked).

## Properties and events
Owned by FlowEditor (or its provider):

| Name | Type | Default | Meaning |
|---|---|---|---|
| runView | { mode: 'panel' \| 'drawer'; open: boolean } | { mode: 'drawer', open: false } | Controlled or uncontrolled. |
| onRunViewChange | (next) => void | none | Notified on every change. |
| openOnRun | boolean | false | Open the current mode when a run starts. |
| preferredModeStore | { get(): mode \| null; set(mode): void } | none | Host adapter to remember the person's last mode per device (§2.9 style preference). |
| loadRuns | (flowId) => Promise<Run[]> | required | Shared loader. |
| labels | object of strings | from I18nAdapter | Includes the two switch controls and the retry. |

## States
Closed; panel open; drawer open; switching (selection preserved); run failed (drawer forced, failing node expanded); phone width (see below).

## Keyboard and ARIA
- The panel is a labelled `region`; the drawer a labelled `complementary` landmark (both non-modal).
- An editor shortcut (registered through EditorShortcuts, host-configurable, exposed with `aria-keyshortcuts` on the run details button) toggles the view open and closed; another moves focus into the open view and back to the canvas.
- Switching mode moves focus to the switch control of the new mode, and a polite announcement names the new mode.
- Escape inside either view closes it and returns focus to the element that opened it (run details button or canvas).

## Responsive, touch, motion, forced colours
- At or above 1024: both modes available; the drawer pushes the canvas at 1280 and above and overlays between 1024 and 1279 (§2.8).
- Below 1024: the panel mode is not offered; any open view is the drawer's full-screen bottom sheet, and the switch controls are hidden.
- Mode switch uses `--fk-dur-base` for the drawer entrance; no movement under reduced motion.
- Forced colours: as in the two wave-3 specs.

## Acceptance tests
- Given the panel is open with run R and node N selected, when "expand" is activated, then the drawer opens with R and N selected and the panel is gone.
- Given the drawer is open, when "compact view" is activated, then the panel opens and focus is on its "expand" control.
- Given a run fails while the panel is open, when the failure is reported, then the drawer opens on the failing node.
- Given a viewport under 1024, when run details is activated, then the full-screen sheet opens and no switch control is present.
- Given a preferredModeStore returning panel, when run details is first activated, then the panel opens.
- Given loadRuns rejects in panel mode, when History shows, then an error with retry appears, and retry calls loadRuns again.
- Given either view is open, when Escape is pressed inside it, then it closes and focus returns to the opener.
