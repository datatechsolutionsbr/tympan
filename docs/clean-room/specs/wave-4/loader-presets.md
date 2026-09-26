# LoaderPresets (preset mechanism for BrandLoader)

Wave 4 · utility · Status: specified

## Purpose
Lets one app (or several apps built on the library) register named appearance presets for BrandLoader (wave 2) and pick one by name, instead of the library shipping presets for particular products. The library ships exactly one preset, `default`, built from the Fakhir tokens. No third-party or other-product brand is included.

## Anatomy
- **Preset**: `{ id, name, mark, tone, label? }` where `mark` is a node (usually BrandMark or an image supplied by the host), `tone` is a ToneName (see ToneTint) used for the pulse ring and the name colour, and `label` is an optional default loading phrase key for the I18nAdapter.
- **Registry**: an in-memory map from id to preset, created by `createLoaderPresets(presets)` and made available through a provider (`LoaderPresetProvider`). Without a provider, only `default` exists.
- **BrandLoader integration**: BrandLoader gains an optional `preset` property (id). Explicit properties (`name`, `mark`, `label`) override the preset's values; unknown ids fall back to `default` with a development warning.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| createLoaderPresets | (presets: Preset[]) => Registry | | Validates ids are unique and tones are known tone names. |
| LoaderPresetProvider | { registry: Registry; children } | | Makes the registry available. |
| useLoaderPreset | (id?: string) => Preset | 'default' | Resolves a preset. |
| preset (on BrandLoader) | string | 'default' | Chosen preset id. |

The `default` preset: mark = BrandMark, name = the brand name from BrandMark, tone = `accent`.

## States
Registry empty (only default); populated; unknown id (fallback plus warning in development builds, silent in production).

## Keyboard and ARIA
Unchanged from BrandLoader: status role with the label; the mark is decorative. A preset may not change roles or names beyond supplying the label.

## Responsive, touch, motion, forced colours
Unchanged from BrandLoader. A preset cannot add animation: the pulse is the BrandLoader's own, opacity only, stopped under reduced motion. Tone tints follow ToneTint rules for reduced transparency and forced colours.

## Acceptance tests
- Given no provider, when BrandLoader renders, then it shows the Fakhir mark and the accent tone.
- Given a registry with preset "archive" whose tone is `categorical-3`, when BrandLoader has preset "archive", then it uses that preset's mark and tone.
- Given preset "archive" and an explicit `name`, when rendered, then the explicit name wins.
- Given an unknown id in development, when rendered, then the default is used and one warning is logged.
- Given two presets with the same id, when the registry is created, then it throws a descriptive error.
- Given a tone that is not a tone name, when the registry is created, then it throws.
