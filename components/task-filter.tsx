import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TodoFilterProps {
  onFilterChange: (filter: { category: string; priority: string; status: string; dueDate: string }) => void
  currentFilter: { category: string; priority: string; status: string; dueDate: string }
}

export function TodoFilter({ onFilterChange, currentFilter }: TodoFilterProps) {
  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="active"
        value={currentFilter.status} // Added this to ensure highlighting matches current status
        className="w-full"
        onValueChange={(value: string) => {
          onFilterChange({ ...currentFilter, status: value })
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-1">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            defaultValue="all"
            value={currentFilter.category}
            onValueChange={(value) => onFilterChange({ ...currentFilter, category: value })}
          >
            <SelectTrigger id="category-filter" className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="education">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select
            defaultValue="all"
            value={currentFilter.priority}
            onValueChange={(value) => onFilterChange({ ...currentFilter, priority: value })}
          >
            <SelectTrigger id="priority-filter" className="w-[180px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="due-date-filter">Due Date</Label>
          <Select
            defaultValue="all"
            value={currentFilter.dueDate}
            onValueChange={(value) => onFilterChange({ ...currentFilter, dueDate: value })}
          >
            <SelectTrigger id="due-date-filter" className="w-[180px]">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}