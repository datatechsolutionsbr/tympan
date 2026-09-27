// The plate of the home page: horizon, almucantars (circles of equal altitude) and azimuth lines,
// projected stereographically for latitude 23.53° S, as on a real tympan. Drawn from the same geometry
// as the approved landing page, in theme colours.
import { useId } from 'react'

const C = 200
const R = 180
const PHI = (-23.53 * Math.PI) / 180
const K = R * Math.tan(Math.PI / 4 - (23.44 * Math.PI) / 180 / 2) // equator radius in plate units

/** Almucantar of altitude h (radians): centre y and radius on the meridian. */
function almucantar(h: number) {
  const lat = Math.abs(PHI)
  const y1 = K * Math.tan((Math.PI / 2 - (lat + (Math.PI / 2 - h))) / 2)
  const y2 = K * Math.tan((Math.PI / 2 - (lat - (Math.PI / 2 - h))) / 2)
  const top = -y2
  const bot = -y1
  return { cy: C + (top + bot) / 2, r: Math.abs(top - bot) / 2 }
}

export function Placa({ rotulo }: { rotulo: string }) {
  const id = useId().replace(/:/g, '')
  const aro = `aro-${id}`
  const horizonte = `horizonte-${id}`
  const alms = []
  for (let h = 0; h <= 80; h += 10) {
    const a = almucantar((h * Math.PI) / 180)
    if (!isFinite(a.r) || a.r > R * 3) continue
    alms.push({ h, ...a })
  }
  const zy = almucantar((89.9 * Math.PI) / 180).cy
  const hz = almucantar(0)
  const azimutes = []
  for (let az = 15; az < 180; az += 15) {
    const r2 = (R * 1.6) / Math.max(Math.sin((az * Math.PI) / 180), 0.18)
    azimutes.push({ az, cx: C + Math.cos((az * Math.PI) / 180) * r2, r: r2 })
  }
  const marcas = Array.from({ length: 72 }, (_, i) => {
    const ang = (i * 5 * Math.PI) / 180
    const l = i % 6 === 0 ? 10 : 5
    return { i, x1: C + Math.cos(ang) * (R + 12), y1: C + Math.sin(ang) * (R + 12), x2: C + Math.cos(ang) * (R + 12 - l), y2: C + Math.sin(ang) * (R + 12 - l) }
  })
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={rotulo} className="ty-site-placa__svg">
      <defs>
        <clipPath id={aro}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        <clipPath id={horizonte}>
          <circle cx={C} cy={hz.cy} r={Math.min(hz.r, R * 2)} />
        </clipPath>
      </defs>
      <circle cx={C} cy={C} r={R + 12} fill="var(--ty-surface-solid)" stroke="var(--ty-line-strong)" strokeWidth={1} />
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--ty-ink-3)" strokeWidth={1.2} />
      <circle cx={C} cy={C} r={K} fill="none" stroke="var(--ty-line-strong)" strokeWidth={0.8} strokeDasharray="3 4" />
      {alms.map((a) => (
        <circle
          key={a.h}
          cx={C}
          cy={a.cy}
          r={a.r}
          fill="none"
          stroke={a.h === 0 ? 'var(--ty-accent)' : 'var(--ty-site-gravura)'}
          strokeWidth={a.h === 0 ? 1.6 : 0.9}
          clipPath={`url(#${aro})`}
        />
      ))}
      <g clipPath={`url(#${aro})`}>
        {azimutes.map((z) => (
          <circle key={z.az} cx={z.cx} cy={zy} r={z.r} fill="none" stroke="var(--ty-site-gravura-suave)" strokeWidth={0.8} clipPath={`url(#${horizonte})`} />
        ))}
      </g>
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--ty-line-strong)" strokeWidth={0.8} />
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--ty-line-strong)" strokeWidth={0.8} />
      <circle cx={C} cy={zy} r={3.2} fill="var(--ty-accent)" />
      {marcas.map((m) => (
        <line key={m.i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="var(--ty-ink-3)" strokeWidth={m.i % 6 === 0 ? 1.2 : 0.6} />
      ))}
    </svg>
  )
}
