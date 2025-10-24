export function RoomLegend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-green-500" />
        <span>Paid</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-amber-500" />
        <span>Partial</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-red-500" />
        <span>Overdue</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-blue-500" />
        <span>Pending</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gray-400" />
        <span>Vacant</span>
      </div>
    </div>
  )
}
