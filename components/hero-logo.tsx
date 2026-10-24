export function HeroLogo({ animated = false }: { animated?: boolean }) {
  return (
    <div className={`hero-logo-visual ${animated ? 'hero-logo-animated' : ''}`}>
      <div className="hero-logo-glow" />
      <div className="hero-logo-ring" />
      <img src="/logo.webp" alt="Demo Day sports logo" className="hero-logo-image" />
      <span className="hero-logo-node hero-logo-node-top" />
      <span className="hero-logo-node hero-logo-node-right" />
      <span className="hero-logo-node hero-logo-node-bottom" />
      <span className="hero-logo-node hero-logo-node-left" />
    </div>
  )
}
