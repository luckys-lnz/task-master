// Service Worker for background notifications
const CACHE_NAME = 'task-master-v1';
const NOTIFICATION_CACHE = 'notifications-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/notification.wav'
      ]);
    })
  );
});

// Activate event - clean up old caches and initialize
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== NOTIFICATION_CACHE)
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim(), // Take control of all pages immediately
      // Initialize notification system
      (async () => {
        // Sync stored notifications
        await syncStoredNotifications();
        
        // Set up periodic sync if supported
        if ('periodicSync' in self.registration) {
          try {
            // @ts-ignore - periodicSync is not in types yet
            await self.registration.periodicSync.register('periodic-notification-check', {
              minInterval: 60000 // Check every minute
            });
          } catch (error) {
            console.log('Periodic sync not supported or permission denied:', error);
          }
        }
      })()
    ])
  );
});

// Message handler - receive notification schedules from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { taskId, notificationType, scheduledTime, task } = event.data;
    
    // Store notification in IndexedDB for persistence
    storeNotification(taskId, notificationType, scheduledTime, task);
    
    // Calculate delay
    const delay = scheduledTime - Date.now();
    
    if (delay > 0) {
      // Schedule notification - use setTimeout in Service Worker
      // Service Workers can use setTimeout and it works better in background than regular pages
      setTimeout(() => {
        fireNotification(task, notificationType);
        // Remove from storage after firing
        cancelNotification(taskId, notificationType);
      }, delay);
    } else if (delay > -60000) {
      // If time has passed but less than 1 minute ago, fire immediately
      // This handles cases where Service Worker was inactive
      fireNotification(task, notificationType);
      cancelNotification(taskId, notificationType);
    }
    // If more than 1 minute past, don't fire (missed notification)
  } else if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    // Cancel scheduled notification
    cancelNotification(event.data.taskId, event.data.notificationType);
  } else if (event.data && event.data.type === 'CLEAR_ALL_NOTIFICATIONS') {
    // Clear all scheduled notifications
    clearAllNotifications();
  } else if (event.data && event.data.type === 'SYNC_NOTIFICATIONS') {
    // Sync all notifications from stored data
    syncStoredNotifications();
  }
});

// Background sync for periodic notification checks
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncStoredNotifications());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-notification-check') {
    event.waitUntil(syncStoredNotifications());
  }
});

// Set up periodic notification check on service worker start
// This ensures notifications are checked even when no events fire
setInterval(() => {
  syncStoredNotifications().catch(console.error);
}, 60000); // Check every minute

// Store notification in IndexedDB
async function storeNotification(taskId, notificationType, scheduledTime, task) {
  try {
    const db = await openDB();
    if (!db) {
      console.warn('Database not available for storing notification');
      return;
    }
    
    const tx = db.transaction(['notifications'], 'readwrite');
    const store = tx.objectStore('notifications');
    
    const putRequest = store.put({
      id: `${taskId}-${notificationType}`,
      taskId,
      notificationType,
      scheduledTime,
      task: JSON.stringify(task),
      createdAt: Date.now()
    });
    
    await new Promise((resolve, reject) => {
      putRequest.onsuccess = () => resolve(putRequest.result);
      putRequest.onerror = () => reject(putRequest.error);
      // Transaction completes automatically after all requests
    });
  } catch (error) {
    console.error('Error storing notification:', error);
  }
}

// Cancel notification
async function cancelNotification(taskId, notificationType) {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }
    
    const tx = db.transaction(['notifications'], 'readwrite');
    const store = tx.objectStore('notifications');
    
    const deleteRequest = store.delete(`${taskId}-${notificationType}`);
    
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      // Transaction completes automatically after all requests
    });
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

// Clear all notifications
async function clearAllNotifications() {
  try {
    const db = await openDB();
    if (!db) {
      return;
    }
    
    const tx = db.transaction(['notifications'], 'readwrite');
    const store = tx.objectStore('notifications');
    
    const clearRequest = store.clear();
    
    await new Promise((resolve, reject) => {
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
      // Transaction completes automatically after all requests
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Sync stored notifications - check and fire any that are due, and re-schedule future ones
async function syncStoredNotifications() {
  try {
    const db = await openDB();
    if (!db) {
      console.warn('Database not available');
      return;
    }
    
    // Check if object store exists
    if (!db.objectStoreNames.contains('notifications')) {
      // Object store doesn't exist yet, nothing to sync
      return;
    }
    
    const tx = db.transaction(['notifications'], 'readonly');
    const store = tx.objectStore('notifications');
    const request = store.getAll();
    
    // Wait for the request to complete and get the result
    let notifications;
    try {
      notifications = await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          try {
            const result = request.result;
            // getAll() should always return an array, but be defensive
            if (result === null || result === undefined) {
              resolve([]);
              return;
            }
            if (Array.isArray(result)) {
              resolve(result);
            } else {
              // If for some reason it's not an array, wrap it
              console.warn('getAll() returned non-array:', result, typeof result);
              resolve([result]);
            }
          } catch (err) {
            console.error('Error processing getAll result:', err);
            resolve([]);
          }
        };
        request.onerror = () => {
          console.error('Error getting notifications:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in Promise for getAll:', error);
      return;
    }
    
    // Ensure notifications is an array (triple check)
    if (!notifications) {
      console.warn('Notifications is null/undefined');
      return;
    }
    
    if (!Array.isArray(notifications)) {
      console.warn('Notifications is not an array after Promise:', notifications, typeof notifications);
      return;
    }
    
    // If no notifications, return early
    if (notifications.length === 0) {
      return;
    }
    
    const now = Date.now();
    
    // Process notifications (transaction will complete automatically)
    for (const notification of notifications) {
      if (!notification || typeof notification !== 'object') {
        console.warn('Invalid notification object:', notification);
        continue;
      }
      const delay = notification.scheduledTime - now;
      
      if (delay <= 0 && delay > -60000) {
        // Fire notification if it's due (or up to 1 minute past)
        const task = JSON.parse(notification.task);
        fireNotification(task, notification.notificationType);
        
        // Remove from storage
        const deleteTx = db.transaction(['notifications'], 'readwrite');
        const deleteStore = deleteTx.objectStore('notifications');
        const deleteReq = deleteStore.delete(notification.id);
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
        });
      } else if (delay > 0) {
        // Re-schedule future notifications (in case Service Worker was restarted)
        const task = JSON.parse(notification.task);
        setTimeout(() => {
          fireNotification(task, notification.notificationType);
          // Remove from storage after firing
          cancelNotification(notification.taskId, notification.notificationType);
        }, delay);
      } else {
        // More than 1 minute past, remove stale notification
        const deleteTx = db.transaction(['notifications'], 'readwrite');
        const deleteStore = deleteTx.objectStore('notifications');
        const deleteReq = deleteStore.delete(notification.id);
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
        });
      }
    }
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Fire notification
async function fireNotification(task, notificationType) {
  // Check if task should still notify (not muted, not snoozed, etc.)
  if (task.status === 'COMPLETED') return;
  if (task.notificationsMuted) return;
  if (task.snoozedUntil) {
    const snoozeDate = new Date(task.snoozedUntil);
    if (snoozeDate > new Date()) return;
  }
  
  // Build notification message
  let title = '';
  let body = '';
  
  if (notificationType === 'start-5min-before') {
    title = 'Task Starting Soon';
    const startDate = task.startTime ? new Date(task.startTime) : null;
    const startDateStr = startDate ? formatDate(startDate) : '';
    const startTimeStr = startDate ? formatTime(startDate) : '';
    body = `"${task.title}" starts in 5 mins (${startDateStr} at ${startTimeStr})`;
  } else if (notificationType === '5min-before') {
    title = 'Task Due Soon';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    const dueTimeStr = task.dueTime || (dueDate ? formatTime(dueDate) : '');
    body = `"${task.title}" is due in 5 minutes (${dueDateStr} at ${dueTimeStr})`;
  } else if (notificationType === '15min-before') {
    title = 'Task Due Soon';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    const dueTimeStr = task.dueTime || (dueDate ? formatTime(dueDate) : '');
    body = `"${task.title}" is due in 15 minutes (${dueDateStr} at ${dueTimeStr})`;
  } else if (notificationType === '30min-before') {
    title = 'Task Due Soon';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    const dueTimeStr = task.dueTime || (dueDate ? formatTime(dueDate) : '');
    body = `"${task.title}" is due in 30 minutes (${dueDateStr} at ${dueTimeStr})`;
  } else if (notificationType === 'due-now') {
    title = 'Task Due Now';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    const dueTimeStr = task.dueTime || (dueDate ? formatTime(dueDate) : '');
    body = `"${task.title}" is due now (${dueDateStr} at ${dueTimeStr})`;
  } else if (notificationType === 'overdue') {
    title = 'Task Overdue';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    const dueTimeStr = task.dueTime || (dueDate ? formatTime(dueDate) : '');
    body = `"${task.title}" was due ${dueDateStr} at ${dueTimeStr}`;
  }
  
  // Show browser notification
  const notificationId = `${task.id}-${notificationType}`;
  
  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: notificationId,
    requireInteraction: false,
    silent: false,
    data: {
      taskId: task.id,
      notificationType
    }
  });
  
  // Play sound (if possible)
  playNotificationSound();
  
  // Notify all clients (tabs) about the notification
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'NOTIFICATION_FIRED',
      taskId: task.id,
      notificationType,
      title,
      body
    });
  });
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If a window is already open, focus it
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard');
      }
    })
  );
});

// Helper functions
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

function playNotificationSound() {
  // Try to play sound via fetch and AudioContext
  // Note: Service Workers can't directly create Audio elements
  // We'll rely on the client-side to play sounds when notified
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskMasterNotifications', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
        store.createIndex('taskId', 'taskId', { unique: false });
      }
    };
  });
}
