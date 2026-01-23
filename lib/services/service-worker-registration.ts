/**
 * Service Worker Registration
 * Handles registration and communication with the service worker for background notifications
 */

export class ServiceWorkerRegistration {
  private static registration: ServiceWorkerRegistration | null = null;
  private swRegistration: globalThis.ServiceWorkerRegistration | null = null;

  private constructor() {}

  static async getInstance(): Promise<ServiceWorkerRegistration> {
    if (!ServiceWorkerRegistration.registration) {
      ServiceWorkerRegistration.registration = new ServiceWorkerRegistration();
      await ServiceWorkerRegistration.registration.init();
    }
    return ServiceWorkerRegistration.registration;
  }

  private async init() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('Service Worker registered:', this.swRegistration);

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      this.swRegistration = registration;
      console.log('Service Worker is ready');

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_FIRED') {
          // Handle notification fired event
          // The service worker already showed the browser notification
          // We can trigger toast notifications here if needed
          this.handleNotificationFired(event.data);
        }
      });

      // Set up periodic background sync if supported
      if ('periodicSync' in this.swRegistration) {
        try {
          const status = await navigator.permissions.query({
            // @ts-ignore - periodicSync is not in types yet
            name: 'periodic-background-sync' as PermissionName
          });
          
          if (status.state === 'granted') {
            // Periodic sync will be registered by the service worker
            console.log('Periodic background sync is available');
          }
        } catch (error) {
          console.log('Periodic background sync not available:', error);
        }
      }

      // Set up background sync
      if ('sync' in this.swRegistration) {
        console.log('Background sync is available');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Schedule a notification in the service worker
   */
  async scheduleNotification(
    taskId: string,
    notificationType: string,
    scheduledTime: number,
    task: any
  ) {
    if (!this.swRegistration) {
      // Try to get registration
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          this.swRegistration = await navigator.serviceWorker.ready;
        } catch (error) {
          console.warn('Service Worker is not available');
          return;
        }
      } else {
        return;
      }
    }

    const activeWorker = this.swRegistration.active || this.swRegistration.waiting || this.swRegistration.installing;
    if (!activeWorker) {
      console.warn('Service Worker is not active');
      return;
    }

    try {
      activeWorker.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        taskId,
        notificationType,
        scheduledTime,
        task
      });
    } catch (error) {
      console.error('Error scheduling notification in service worker:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(taskId: string, notificationType: string) {
    if (!this.swRegistration) {
      return;
    }

    const activeWorker = this.swRegistration.active || this.swRegistration.waiting || this.swRegistration.installing;
    if (!activeWorker) {
      return;
    }

    try {
      activeWorker.postMessage({
        type: 'CANCEL_NOTIFICATION',
        taskId,
        notificationType
      });
    } catch (error) {
      console.error('Error canceling notification in service worker:', error);
    }
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllNotifications() {
    if (!this.swRegistration) {
      return;
    }

    const activeWorker = this.swRegistration.active || this.swRegistration.waiting || this.swRegistration.installing;
    if (!activeWorker) {
      return;
    }

    try {
      activeWorker.postMessage({
        type: 'CLEAR_ALL_NOTIFICATIONS'
      });
    } catch (error) {
      console.error('Error clearing notifications in service worker:', error);
    }
  }

  /**
   * Sync notifications with service worker
   */
  async syncNotifications() {
    if (!this.swRegistration) {
      return;
    }

    const activeWorker = this.swRegistration.active || this.swRegistration.waiting || this.swRegistration.installing;
    if (!activeWorker) {
      return;
    }

    try {
      activeWorker.postMessage({
        type: 'SYNC_NOTIFICATIONS'
      });
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync() {
    if (!this.swRegistration || !('sync' in this.swRegistration)) {
      return;
    }

    try {
      // @ts-ignore - sync is not in types yet
      await this.swRegistration.sync.register('sync-notifications');
    } catch (error) {
      console.error('Error requesting background sync:', error);
    }
  }

  /**
   * Handle notification fired event from service worker
   */
  private handleNotificationFired(data: {
    taskId: string;
    notificationType: string;
    title: string;
    body: string;
  }) {
    // Import toast dynamically to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('@/components/ui/use-toast').then(({ toast }) => {
        toast({
          title: data.title,
          description: data.body,
          variant: data.notificationType === 'due-now' || data.notificationType === 'overdue' 
            ? 'destructive' 
            : 'default'
        });
      });

      // Try to play sound
      this.playNotificationSound();
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound() {
    try {
      const audio = new Audio('/notification.wav');
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Fallback sound
        const fallback = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBACg==");
        fallback.volume = 0.5;
        fallback.play().catch(() => {});
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Check if service worker is supported and active
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  /**
   * Check if service worker is ready
   */
  isReady(): boolean {
    return this.swRegistration !== null && this.swRegistration.active !== null;
  }
}
