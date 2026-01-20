"use client"

import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeleteTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskTitle?: string
  onConfirm: () => void
}

export function DeleteTaskDialog({ 
  open, 
  onOpenChange, 
  taskTitle,
  onConfirm 
}: DeleteTaskDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1
                }}
                className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30"
              >
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </motion.div>
              <AlertDialogTitle className="text-xl font-bold text-left">
                Delete Task
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left pt-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                {taskTitle && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground mb-1">Task to delete:</p>
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {taskTitle}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-6">
            <AlertDialogCancel className="mt-0">
              Cancel
            </AlertDialogCancel>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              >
                Delete Task
              </AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
