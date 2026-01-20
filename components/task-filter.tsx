import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TodoFilterProps {
  onFilterChange: (filter: { category: string; priority: string; status: string; dueDate: string }) => void
  currentFilter: { category: string; priority: string; status: string; dueDate: string }
}

export function TodoFilter({ onFilterChange, currentFilter }: TodoFilterProps) {
  return (
    <div className="space-y-3 sm:space-y-4 transition-spring-fast">
      {/* Status Tabs - Mobile Optimized */}
      <Tabs
        defaultValue="active"
        value={currentFilter.status}
        className="w-full"
        onValueChange={(value: string) => {
          onFilterChange({ ...currentFilter, status: value })
        }}
      >
        <TabsList className="grid w-full grid-cols-3 transition-spring-fast h-9 sm:h-10">
          <TabsTrigger value="all" className="text-xs sm:text-sm font-medium">All</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm font-medium">Active</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm font-medium">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Dropdowns - Mobile First Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="category-filter" className="text-xs sm:text-sm font-medium">Category</Label>
          <Select
            defaultValue="all"
            value={currentFilter.category}
            onValueChange={(value) => onFilterChange({ ...currentFilter, category: value })}
          >
            <SelectTrigger id="category-filter" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">All Categories</SelectItem>
              <SelectItem value="work" className="text-sm">Work</SelectItem>
              <SelectItem value="personal" className="text-sm">Personal</SelectItem>
              <SelectItem value="shopping" className="text-sm">Shopping</SelectItem>
              <SelectItem value="health" className="text-sm">Health</SelectItem>
              <SelectItem value="finance" className="text-sm">Finance</SelectItem>
              <SelectItem value="education" className="text-sm">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="priority-filter" className="text-xs sm:text-sm font-medium">Priority</Label>
          <Select
            defaultValue="all"
            value={currentFilter.priority}
            onValueChange={(value) => onFilterChange({ ...currentFilter, priority: value })}
          >
            <SelectTrigger id="priority-filter" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">All Priorities</SelectItem>
              <SelectItem value="LOW" className="text-sm">Low</SelectItem>
              <SelectItem value="MEDIUM" className="text-sm">Medium</SelectItem>
              <SelectItem value="HIGH" className="text-sm">High</SelectItem>
              <SelectItem value="URGENT" className="text-sm">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="due-date-filter" className="text-xs sm:text-sm font-medium">Due Date</Label>
          <Select
            defaultValue="all"
            value={currentFilter.dueDate}
            onValueChange={(value) => onFilterChange({ ...currentFilter, dueDate: value })}
          >
            <SelectTrigger id="due-date-filter" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">All Dates</SelectItem>
              <SelectItem value="today" className="text-sm">Today</SelectItem>
              <SelectItem value="week" className="text-sm">This Week</SelectItem>
              <SelectItem value="overdue" className="text-sm">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}