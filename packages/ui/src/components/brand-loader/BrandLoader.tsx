import type { CSSProperties, ReactNode } from 'react'
import { useMessages } from '../../internal/provider'
import { loaderToneColour, useLoaderPreset } from '../loader-presets/LoaderPresets'

export interface BrandLoaderProps {
  /** Product name; the preset's or the brand's when omitted. */
  name?: string
  mark?: ReactNode
  /** Loading phrase, announced politely; the localised "Loading" when absent. */
  label?: string
  layout?: 'fullscreen' | 'inline'
  /** Registered preset id (wave-4/loader-presets.md). */
  preset?: string
  className?: string
}

/** First-paint loading screen with the brand mark (spec: wave-2/brand-loader.md). */
export function BrandLoader(props: BrandLoaderProps) {
  const copy = useMessages()
  const chosen = useLoaderPreset(props.preset)
  const statusText = props.label ?? chosen.label ?? copy.loading
  const toneStyle = { '--ty-loader-tone': loaderToneColour(chosen.tone) } as CSSProperties
  const root = ['ty-brand-loader', props.className].filter(Boolean).join(' ')

  return (
    <div className={root} role="status" data-layout={props.layout ?? 'fullscreen'} data-tone={chosen.tone} style={toneStyle}>
      <div className="ty-brand-loader__figure" aria-hidden="true">
        <span className="ty-brand-loader__pulse">{props.mark ?? chosen.mark}</span>
        <span className="ty-brand-loader__name">{props.name ?? chosen.name ?? copy.brand.productName}</span>
      </div>
      <p className="ty-brand-loader__label">{statusText}</p>
    </div>
  )
}
