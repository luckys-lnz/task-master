/**
 * Debug script for notifications
 * 
 * Run this in your browser console to debug notification issues
 * 
 * Usage:
 * 1. Enable debug mode: window.__DEBUG_NOTIFICATIONS__ = true
 * 2. Check scheduled notifications: NotificationService.getInstance().getScheduledNotifications()
 * 3. Manually trigger a notification: NotificationService.getInstance().debugTriggerNotification('task-id', 'start-5min-before')
 */

// Enable debug logging
window.__DEBUG_NOTIFICATIONS__ = true;

// Get notification service instance
const notificationService = NotificationService.getInstance();

// Helper function to check notification status
function checkNotificationStatus() {
  console.log('=== Notification Service Status ===');
  console.log('Scheduled notifications:', notificationService.getScheduledNotifications());
  console.log('Notification permission:', Notification.permission);
  
  // Get current tasks from the dashboard
  // This assumes you're on the dashboard page
  const dashboard = document.querySelector('[data-dashboard]');
  if (dashboard) {
    console.log('Dashboard found');
  }
  
  return {
    scheduled: notificationService.getScheduledNotifications(),
    permission: Notification.permission
  };
}

// Helper to manually trigger notification for a task
function triggerNotification(taskId, type = 'start-5min-before') {
  notificationService.debugTriggerNotification(taskId, type);
}

// Helper to check a specific task's notification schedule
function checkTaskNotifications(taskId) {
  const status = notificationService.getScheduledNotifications();
  const taskStatus = status.find(s => s.taskId === taskId);
  console.log(`Task ${taskId} has ${taskStatus ? taskStatus.count : 0} scheduled notifications`);
  return taskStatus;
}

// Export helpers to window for easy access
window.checkNotificationStatus = checkNotificationStatus;
window.triggerNotification = triggerNotification;
window.checkTaskNotifications = checkTaskNotifications;

console.log('✅ Notification debug helpers loaded!');
console.log('Available commands:');
console.log('  - checkNotificationStatus() - Check all scheduled notifications');
console.log('  - checkTaskNotifications(taskId) - Check notifications for a specific task');
console.log('  - triggerNotification(taskId, type) - Manually trigger a notification');
console.log('  - window.__DEBUG_NOTIFICATIONS__ = true/false - Toggle debug logging');
