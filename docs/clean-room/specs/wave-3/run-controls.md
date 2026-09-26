# RunControls

Wave 3 · canvas · Status: specified

## Purpose
A compact cluster over the canvas that starts or stops a run, optionally publishes the flow, opens run history and shows autosave status.

## Anatomy
- **Save status slot**: host-provided indicator (usually SaveStatus).
- **History button**: icon button that opens past runs (optional).
- **Publish button**: text button (optional).
- **Run/stop button**: one button whose action and label switch with the run state.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| isRunning | boolean | required | switches the main button between run and stop |
| onRun, onStop | () => void | required | main button actions |
| onOpenHistory | () => void | none | when absent the history button is not rendered |
| onPublish | () => void | none | when absent the publish button is not rendered |
| isPublishing | boolean | false | publish button busy and disabled |
| saveStatus | node | none | content of the status slot |
| labels | { run, stop, history, publish, publishing } | i18n | visible names |
| placement | 'overlay' or 'inline' | 'overlay' | overlay pins to the canvas top end; inline lets the host position it |

## States
Idle (run); running (stop, danger emphasis per §2.10, with a spinner inside the button); publishing (busy, disabled, label switches); hover, focus-visible, pressed.

## Keyboard and ARIA
APG Button pattern; RAC Button. The run/stop control keeps the same element when switching so focus is not lost, and its accessible name changes with the label. The history button is icon-only and has an accessible name plus a visible tooltip (RAC TooltipTrigger). Busy publish exposes aria-busy. A polite live region announces "run started" and "run stopped".

## Responsive, touch, motion, forced colours
- Each control has a 44 px hit area; on narrow screens the cluster moves into the canvas toolbar.
- The primary gradient (§2.3 `--fk-cta`) is used for Run only when it is the single primary action of the view.
- Reduced motion: the running spinner is replaced by a static running glyph. Forced colours: stop state carries its word, not only a colour.

## Acceptance tests
- Given not running, when the main button is activated, then onRun is called and not onStop.
- Given running, when the main button is activated, then onStop is called and the name reads stop.
- Given onOpenHistory is absent, when rendered, then no history button exists.
- Given isPublishing, when rendered, then the publish button is disabled and shows the publishing label.
- Given a saveStatus node, when rendered, then it appears before the other controls in reading order.
