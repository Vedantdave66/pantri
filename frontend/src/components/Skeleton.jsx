export function SkeletonCard({ height = 76 }) {
  return <div className="skeleton" style={{ height }} />
}

export function SkeletonList({ rows = 4, height = 76 }) {
  return (
    <div className="card-list">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  )
}
