/** Two calm, fixed glows behind the glass (spec: wave-2/ambient-backdrop.md; design direction §2.5). */
export function AmbientBackdrop({ className }: { className?: string }) {
  const glows = ['upper', 'lower'] as const
  return (
    <div className={className ? `ty-ambient ${className}` : 'ty-ambient'} aria-hidden="true">
      {glows.map((where) => (
        <span key={where} className="ty-ambient__glow" data-glow={where} />
      ))}
    </div>
  )
}
