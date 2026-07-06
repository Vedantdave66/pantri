export function SkeletonCard({ height = 64 }) {
  return <div className="skeleton" style={{ height }} />
}

export function SkeletonList({ rows = 4, height = 64 }) {
  return (
    <div style={{ padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  )
}
