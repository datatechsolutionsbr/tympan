// Registry of gallery pages: wave 1 plus one page per wave 2/4 group, filed
// under the sidebar categories of the documentation layout.
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

export type GalleryCategory = 'Foundations' | 'Application UI' | 'Data display' | 'Marketing'

export const GALLERY_CATEGORIES: GalleryCategory[] = ['Foundations', 'Application UI', 'Data display', 'Marketing']

export interface GalleryPage {
  id: string
  title: string
  category: GalleryCategory
  description: string
  Component: ComponentType<{ scope: string }>
}

export const GALLERY_PAGES: GalleryPage[] = [
  {
    id: 'core',
    title: 'Core',
    category: 'Foundations',
    description: 'Text, buttons, fields, tags, notices, tabs, the data table and overlays: the wave-1 building blocks.',
    Component: Showcase,
  },
  {
    id: 'platform',
    title: 'Touch and utilities',
    category: 'Foundations',
    description: 'Swipe rows, pull to refresh, safe areas, cascade grids, formatters and motion.',
    Component: PlatformShowcase,
  },
  {
    id: 'shell',
    title: 'Shell and research',
    category: 'Application UI',
    description: 'Editorial page header, rail navigation, dock, stage and stat strips, activity feed and the docked evidence panel.',
    Component: ShellShowcase,
  },
  {
    id: 'forms-a',
    title: 'Choices and filters',
    category: 'Application UI',
    description: 'Theme and state switches, one-time codes, search and filter fields, choice tiles and cards, chip groups.',
    Component: FormsAShowcase,
  },
  {
    id: 'forms-b',
    title: 'Pickers and forms',
    category: 'Application UI',
    description: 'Category tabs, tag, currency, date and wheel pickers, locale and image pickers, and framed form layouts.',
    Component: FormsBShowcase,
  },
  {
    id: 'overlays-nav',
    title: 'Overlays and navigation',
    category: 'Application UI',
    description: 'App navigation, flyouts, command palette, launcher, modals and confirms, popovers, steps and wizards.',
    Component: OverlaysNavShowcase,
  },
  {
    id: 'data-a',
    title: 'Lists and records',
    category: 'Data display',
    description: 'Section and list panels, rows, badges, history, disclosure lists, Markdown and the notification center.',
    Component: DataAShowcase,
  },
  {
    id: 'data-b',
    title: 'Metrics and cards',
    category: 'Data display',
    description: 'Stat and metric tiles, tweened numbers, deltas, and record, agent, profile, contact, insight and ticker cards.',
    Component: DataBShowcase,
  },
  {
    id: 'charts-geo',
    title: 'Charts and regions',
    category: 'Data display',
    description: 'Charts with a table view, report views, region maps and the Brazilian region theme registry.',
    Component: ChartsGeoShowcase,
  },
  {
    id: 'auth-brand',
    title: 'Auth, brand and pages',
    category: 'Marketing',
    description: 'Brand mark, auth frame and federated sign-in, loaders, HTTP error page, banners and legal documents.',
    Component: AuthBrandShowcase,
  },
  {
    id: 'showcase',
    title: 'Public pages',
    category: 'Marketing',
    description: 'Showcase headings, reveal numbers and highlight stats, ruled grids, feature mosaics and tiles.',
    Component: ShowcaseShowcase,
  },
]
