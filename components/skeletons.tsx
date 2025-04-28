export function TodoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="w-[180px] h-10 bg-muted rounded animate-pulse" />
        <div className="w-[120px] h-10 bg-muted rounded animate-pulse" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <div className="w-2/3 h-6 bg-muted rounded animate-pulse" />
            <div className="w-1/4 h-6 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-full h-4 bg-muted rounded animate-pulse" />
          <div className="flex justify-between">
            <div className="w-1/3 h-4 bg-muted rounded animate-pulse" />
            <div className="w-1/4 h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
