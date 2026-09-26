# ToolServerListField

Wave 3 · form · Status: specified

## Purpose
Let an author attach zero or more external tool servers (Model Context Protocol servers) to an agent, each reached either by a remote address or by a local command.

## Anatomy
- Header: field label and an "add server" action.
- Empty note when no server is listed.
- Server entries, each a small fieldset with:
  - tool-name prefix field (namespaces the tools this server exposes);
  - remote address field (URL);
  - local command field;
  - command arguments field (space-separated, stored as a list);
  - remove action.
- Exported helper `cleanToolServers(list)`: trims every field, drops empty arguments, drops entries that have neither address nor command, and returns `undefined` when nothing remains.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `ToolServer[]` | required | `{ prefix?, url?, command?, args?: string[], headers? }` per entry. |
| onChange | `(list: ToolServer[]) => void` | required | Called on every edit, add or remove (raw, uncleaned). |
| labels | `ToolServerListLabels` | from i18n adapter | Field names, placeholders, add, remove, empty note. |
| allowCommand | `boolean` | true | Hosts that forbid local processes hide the command and argument fields. |

Headers are preserved but not edited here (secrets belong to the credential screens).

## States
- Empty, one or more entries.
- Entry incomplete (no address and no command): caution hint on that entry ("will be ignored on save").
- Address malformed: inline error after blur.

## Keyboard and ARIA
- Each entry is a `fieldset` with a legend "Server ‹n›" (visually hidden if the design hides it).
- Text inputs are RAC `TextField` with visible labels (the source relies on placeholders; not acceptable).
- Remove has an accessible name including the entry number; after removal focus goes to the next entry's first field or to the add action.
- Add moves focus to the new entry's prefix field and announces "server added" politely.

## Responsive, touch, motion, forced colours
- Address and command fields stack on narrow widths; side by side from the medium breakpoint.
- 44 px targets for add and remove; monospace only for command and arguments (design direction §2.2 allows mono for identifiers).
- No motion.

## Acceptance tests
- Given an empty list, when "add server" is activated, then `onChange` receives one blank entry and focus is in its prefix field.
- Given an entry with arguments text "run -p tool", then the stored args are ["run","-p","tool"].
- Given entries [blank, {url:" https://x "}], when `cleanToolServers` runs, then it returns one entry with url "https://x".
- Given only blank entries, then `cleanToolServers` returns undefined.
- Given `allowCommand` false, then command and argument fields are absent.
- Given two entries, when the first is removed, then focus moves to the remaining entry's first field.
