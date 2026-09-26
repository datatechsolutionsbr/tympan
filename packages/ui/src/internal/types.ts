import type { ComponentType, SVGProps } from 'react'

/** Any icon component (lucide-react or the host's own), rendered decoratively. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>
