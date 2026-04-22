/**
 * SiteBackground
 * Renders the fixed vitral/glassmorphism background layers.
 * Mounted once at app level so background doesn't remount on route changes.
 */
export default function SiteBackground() {
  return (
    <>
      <div className="bg-glass" />
      {/* bg-aurora removido — só page-shards animados pro fundo ficar mais limpo */}
      <div className="page-shards">
        <div className="shard s1" />
        <div className="shard s2" />
        <div className="shard s3" />
      </div>
      <div className="bg-grid" />
      <div className="bg-noise" />
    </>
  )
}
