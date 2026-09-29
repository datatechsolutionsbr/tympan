import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-tag-field>`: the TagField's single source (spec: wave-2/tag-field.md).
 *
 * Self-rendering like the theme palette: the field is data-driven (the pills
 * repeat per committed value, the suggestion popup per matching option) and
 * stateful (the draft, the popup, the highlight), which the declarative
 * anatomy cannot express, so the element owns its whole subtree and wrappers
 * render an empty host. Collections cross the attribute boundary as JSON
 * (`value`, `suggestions`, `suggestion-labels`), the `theme-labels`
 * precedent; the committed list stays controlled — the element asks for
 * changes with `ty-change` and never writes its own `value`.
 *
 * `validate` (normalise or reject an entry) is a function, so it cannot be an
 * attribute: hosts assign it as a property on the element. The remove
 * control's name is the `remove-label` template (`{value}` filled with the
 * pill's display text).
 *
 * Examples stay empty: the parity renderers could only produce the empty
 * host of a self-rendering element (the theme-palette precedent).
 */
export const tagFieldDefinition = {
  tag: 'ty-tag-field',
  name: 'TyTagField',
  kind: 'self-rendering',
  doc: 'Short values typed into removable pills, optionally assisted by (or restricted to) a suggestion list. Enter or comma commits the draft (or the highlighted suggestion), Backspace on an empty entry removes the last pill; duplicates (case-insensitive), values past `max` and — with `allow-free-text="false"` — values outside `suggestions` are refused. With suggestions the entry is an APG combobox with list autocomplete (active descendant, wrap-around arrows).',
  props: {
    value: { type: 'string', attribute: 'value', doc: 'JSON array of the committed values (controlled); the element asks for changes with `ty-change`, it never writes its own.' },
    suggestions: { type: 'string', attribute: 'suggestions', doc: 'JSON array of known values; turns the entry into a combobox.' },
    suggestionLabels: { type: 'string', attribute: 'suggestion-labels', doc: 'JSON object of display text per value, used in the popup and on the pills.' },
    allowFreeText: { type: 'string', attribute: 'allow-free-text', doc: '`true` or `false`; unset: free text is allowed. `false`: only values present in `suggestions` are accepted (the `show-arrow` precedent for a default-true switch).' },
    max: { type: 'number', attribute: 'max', doc: 'Maximum pills; the entry is disabled at the limit and re-enabled when one is removed.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Disables the entry and every remove control.' },
    tone: { type: 'enum', values: ['neutral', 'accent'], default: 'neutral', attribute: 'tone', doc: 'Pill tint; `accent` fills with the theme accent.' },
    categoryIndex: { type: 'number', attribute: 'category-index', doc: 'A categorical token (1 to 8) as the pill tint, shown as a small colour square; normalised into range on upgrade, wins over `tone`.' },
    label: { type: 'string', attribute: 'label', doc: 'Visible label above the field, targeting the entry; if absent, `accessibleLabel` is required.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the entry when there is no visible label.' },
    placeholder: { type: 'string', attribute: 'placeholder', doc: 'Hint in the entry.' },
    helperText: { type: 'string', attribute: 'helper-text', doc: 'Help text below the field, linked as the entry\'s description.' },
    errorText: { type: 'string', attribute: 'error-text', doc: 'Marks the field invalid; shown below the helper text and linked as description.' },
    removeLabel: { type: 'string', default: 'Remove {value}', attribute: 'remove-label', doc: 'Accessible name template of each remove control; `{value}` is the pill\'s display text.' },
    chosenLabel: { type: 'string', default: '{field}: chosen values', attribute: 'chosen-label', doc: 'Accessible name template of the pill list; `{field}` is the label (or accessible label).' },
    suggestionsLabel: { type: 'string', default: 'Suggestions', attribute: 'suggestions-label', doc: 'Accessible name of the suggestion popup.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the root (`data-testid`).' },
  },
  events: [
    { type: 'ty-change', kind: 'custom', detail: { value: 'string' }, reactProp: 'onChange', doc: 'A value was added or removed; `value` is the next list as a JSON array. Controlled: the host writes it back to the `value` attribute.' },
  ],
  examples: [],
} as const satisfies ElementDefinition
