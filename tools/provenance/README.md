# Provenance similarity check (run outside the clean room)

The clean-room packages (`packages/tokens`, `packages/design-system`,
`packages/flow-canvas`) were written without access to the forked component
library. Two layers guard that:

1. **In-repo guardrails** (run by `npm run check`):
   - `npm run check:no-tailwind` (`tools/guardrails/no-tailwind.mjs`): no
     Tailwind or class-variance-authority dependency in either package or its
     lockfile entries, no shadcn registry file, no Tailwind CSS directives, and
     every static class token in TS/TSX is `fk-` prefixed (no utility classes).
   - `npm run check:provenance` (`tools/guardrails/provenance.mjs`): hard-fail
     markers (slot data-attribute selectors, the fork's hit-area component
     name, `--btn-*` properties, arbitrary forced-colours variants, colour API
     strings, `Headless.*` namespaces, marketing template component names,
     commercial template names) and any import of the forked packages.

2. **Similarity comparison against the fork** (not implemented here, on
   purpose: nothing in this repository may read the fork). The coordinator runs
   it from outside the clean room, with read access to both trees:

   - **Token winnowing (MOSS-style).** Normalise each source file (strip
     comments and whitespace, replace identifiers and literals with
     placeholders), tokenise, hash every k-gram with **k = 12**, and keep the
     winnowed fingerprints (window w = k + 3). For every clean-room file,
     compute *containment* = |fingerprints shared with any fork file| /
     |fingerprints of the clean-room file|.
   - **AST similarity.** Parse TSX/TS with the TypeScript compiler API, emit
     the multiset of node-kind paths of depth 3 for each function or component,
     and compute the Jaccard index between each clean-room unit and its most
     similar fork unit.
   - **CSS.** Normalise declarations (property name + value with numbers
     rounded) and apply the same k-gram containment to the declaration stream.

   **Thresholds for manual review:** containment **≥ 0.25** or AST Jaccard
   **≥ 0.35** on any file or unit. A hit is reviewed by someone who did not
   write the code; true positives are rewritten from the spec by a different
   implementer. Generated files (`dist/`), lockfiles and test fixtures are
   excluded. Library boilerplate that both trees take from React Aria
   Components documentation is expected to match and is noted, not rewritten.

Results of each run go in `docs/clean-room/similarity-<date>.md` (written by
the coordinator, not by the implementer).
