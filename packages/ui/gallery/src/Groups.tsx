// Registry of gallery pages: wave 1 plus one page per wave 2/4 group.
import type { ComponentType } from 'react'
import { AuthBrandShowcase } from './showcase/auth-brand'
import { ChartsGeoShowcase } from './showcase/charts-geo'
import { DataAShowcase } from './showcase/data-a'
import { DataBShowcase } from './showcase/data-b'
import { FormsAShowcase } from './showcase/forms-a'
import { FormsBShowcase } from './showcase/forms-b'
import { OverlaysNavShowcase } from './showcase/overlays-nav'
import { PlatformShowcase } from './showcase/platform'
import { ShellShowcase } from './showcase/shell'
import { ShowcaseShowcase } from './showcase/showcase'
import { Showcase } from './Showcase'

export interface GalleryPage {
  id: string
  title: string
  Component: ComponentType<{ scope: string }>
}

export const GALLERY_PAGES: GalleryPage[] = [
  { id: 'core', title: 'Core', Component: Showcase },
  { id: 'shell', title: 'Shell and research', Component: ShellShowcase },
  { id: 'forms-a', title: 'Choices and filters', Component: FormsAShowcase },
  { id: 'forms-b', title: 'Pickers and forms', Component: FormsBShowcase },
  { id: 'overlays-nav', title: 'Overlays and navigation', Component: OverlaysNavShowcase },
  { id: 'data-a', title: 'Lists and records', Component: DataAShowcase },
  { id: 'data-b', title: 'Metrics and cards', Component: DataBShowcase },
  { id: 'charts-geo', title: 'Charts and regions', Component: ChartsGeoShowcase },
  { id: 'auth-brand', title: 'Auth, brand and pages', Component: AuthBrandShowcase },
  { id: 'platform', title: 'Touch and utilities', Component: PlatformShowcase },
  { id: 'showcase', title: 'Public pages', Component: ShowcaseShowcase },
]
