# Service Worker Setup for Background Notifications

## Overview

The notification system now uses a **Service Worker** to ensure notifications work reliably even when:
- The browser tab is in the background
- The browser tab is closed (on desktop)
- The mobile browser tab is backgrounded

## How It Works

1. **Service Worker Registration**: Automatically registers when the app loads
2. **Background Execution**: Service Worker runs independently of the main page
3. **Persistent Storage**: Notifications are stored in IndexedDB for reliability
4. **Periodic Checks**: Service Worker checks for due notifications every minute
5. **Fallback**: If Service Worker is not available, falls back to setTimeout (works when tab is active)

## Files Created

1. **`public/sw.js`** - Service Worker script that handles background notifications
2. **`lib/services/service-worker-registration.ts`** - Service Worker registration and communication
3. **`components/service-worker-register.tsx`** - Client component that registers the Service Worker

## Browser Support

### Desktop Browsers
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Limited support (Service Workers work, but background execution is limited)

### Mobile Browsers
- ✅ Chrome (Android): Full support
- ⚠️ Safari (iOS): Limited support - Service Workers work but background execution is restricted
- ✅ Firefox (Android): Full support

## Testing

### 1. Verify Service Worker Registration

Open browser DevTools → Application → Service Workers
- You should see the service worker registered and active

### 2. Test Background Notifications

1. Create a test task that starts in 6 minutes
2. Close the browser tab (or switch to another tab)
3. Wait 1 minute
4. You should receive a browser notification even though the tab is closed

### 3. Check Service Worker Logs

Open DevTools → Application → Service Workers → Click "Inspect" on the service worker
- Check the console for service worker logs
- You should see notification scheduling messages

## Troubleshooting

### Service Worker Not Registering

1. **Check HTTPS**: Service Workers require HTTPS (or localhost)
2. **Check Browser Support**: Verify your browser supports Service Workers
3. **Check Console**: Look for registration errors in the browser console

### Notifications Not Firing in Background

1. **Check Permissions**: Ensure notification permissions are granted
2. **Check Service Worker Status**: Verify the service worker is active
3. **Check IndexedDB**: Open DevTools → Application → IndexedDB → Check "TaskMasterNotifications" database
4. **Check Periodic Sync**: Some browsers require periodic background sync permission

### Mobile Notifications Not Working

- **iOS Safari**: Limited background execution - notifications may be delayed
- **Android Chrome**: Should work reliably
- **Solution**: Consider implementing push notifications from a server for better mobile support

## Permissions Required

1. **Notification Permission**: User must grant notification permissions
2. **Periodic Background Sync** (optional): For more reliable background checks
   - Chrome: Automatically requests when needed
   - Other browsers: May require manual permission

## Next Steps (Optional Enhancements)

1. **Push Notifications**: Implement server-side push notifications for even better reliability
2. **Web Push API**: Use Web Push Protocol for cross-platform notifications
3. **PWA Installation**: Make the app installable as a PWA for better mobile support

## Debugging

Enable debug mode in browser console:
```javascript
window.__DEBUG_NOTIFICATIONS__ = true;
```

This will log all notification scheduling and firing events.
