# Settings Refresh Improvements

## Overview

This document describes the improvements made to the settings refresh system in RustySEO, specifically addressing issues where PSI (PageSpeed Insights) and other configuration changes were not reflected in the Console Log component.

## Problem

The Console Log component was only fetching configuration data once on mount, meaning:
- Changes to PSI API keys were not reflected until app restart
- GA4, Clarity, and AI Model configuration changes were not visible
- The UI showed stale data after configuration updates

## Solution

### 1. Created a Centralized Settings Store

**File:** `store/SettingsStore.ts`

A new Zustand store that manages all application settings state:
- **PSI Settings** (API key, bulk enable/disable)
- **GA4 ID**
- **Microsoft Clarity API**
- **AI Model**
- **Last Updated timestamp** (triggers reactivity)

**Key Features:**
- Centralized settings management
- Automatic refresh capability
- Reactive updates via `lastUpdated` timestamp
- Error handling for all backend calls

### 2. Updated Console Log Component

**File:** `app/global/_components/Sidebar/ConsoleLog/ConsoleLog.tsx`

**Changes:**
- Now uses `SettingsStore` instead of local state
- Periodic refresh every 30 seconds (configurable)
- Automatic updates when settings change
- Combined refresh function for all configurations

**Benefits:**
- Real-time reflection of setting changes
- Reduced code duplication
- Better state management
- Automatic UI updates

### 3. Integrated Settings Refresh Triggers

Updated components that modify settings to trigger immediate refreshes:

#### `app/components/PageSpeedInsigthsApi.tsx`
- Triggers settings refresh after adding PSI API key
- Ensures Console Log updates immediately

#### `app/components/ui/Footer/CrawlerType.tsx`
- Triggers settings refresh after toggling PSI bulk mode
- Synchronizes UI state across components

#### `app/components/ui/TopMenuBar/Configurations/PagespeedInsigthsApi.tsx`
- Uses SettingsStore for reactive API key display
- Shows current key state without manual refresh

## Refresh Strategy

### Automatic Refresh
- **Interval:** 30 seconds
- **Scope:** All configuration settings (PSI, GA4, Clarity, AI Model, GSC)
- **Method:** `refreshAllConfigurations()`

### Manual Refresh
- **Trigger:** When user modifies settings
- **Method:** `triggerRefresh()` from SettingsStore
- **Components:** PageSpeedInsigthsApi, CrawlerType

### On-Demand Refresh
- **Trigger:** Component mount
- **Method:** `refreshSettings()` called in useEffect

## Architecture

```
┌─────────────────────────────────────┐
│        SettingsStore                │
│  (Centralized State Management)     │
│                                     │
│  - pageSpeedKey                     │
│  - pageSpeedBulk                    │
│  - ga4Id                            │
│  - clarityApi                       │
│  - aiModel                          │
│  - lastUpdated                      │
│                                     │
│  Actions:                           │
│  - refreshSettings()                │
│  - triggerRefresh()                 │
└──────────────┬──────────────────────┘
               │
               ├─────────────┬──────────────┬────────────────┐
               ↓             ↓              ↓                ↓
        ┌─────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐
        │ ConsoleLog  │ │ PSI API  │ │ CrawlerType │ │ PSI Config│
        │  Component  │ │   Modal  │ │  Component  │ │  Display  │
        └─────────────┘ └──────────┘ └─────────────┘ └──────────┘
```

## Usage Example

### Accessing Settings in a Component

```tsx
import useSettingsStore from "@/store/SettingsStore";

function MyComponent() {
  const { 
    pageSpeedKey, 
    ga4Id, 
    refreshSettings,
    triggerRefresh 
  } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Trigger refresh after user action
  const handleSaveSettings = async () => {
    await saveSettingsToBackend();
    triggerRefresh(); // Updates all subscribed components
  };

  return (
    <div>
      PSI Key: {pageSpeedKey || "Not configured"}
    </div>
  );
}
```

### Adding a New Setting

1. Add the setting to `SettingsStore.ts` state
2. Add getter/setter actions
3. Update `refreshSettings()` to fetch the new setting
4. Components automatically receive updates via the store

## Performance Considerations

- **Polling Interval:** 30 seconds balances responsiveness with backend load
- **Memoization:** `useMemo` prevents unnecessary log regeneration
- **Batch Updates:** All settings refresh in a single batch operation
- **Error Handling:** Failed refreshes don't break the UI

## Future Improvements

1. **Event-Based Updates:** Use Tauri events instead of polling
2. **Selective Refresh:** Only refresh changed settings
3. **Loading States:** Show loading indicators during refresh
4. **Offline Support:** Cache settings locally
5. **User Preferences:** Configurable refresh interval

## Troubleshooting

### Settings Not Updating

1. Check browser console for errors
2. Verify backend commands are working (`load_api_keys`, etc.)
3. Check `lastUpdated` timestamp in SettingsStore
4. Ensure `refreshSettings()` is called on mount

### Slow Updates

1. Reduce polling interval (currently 30s)
2. Use `triggerRefresh()` for immediate updates
3. Check network latency to backend

### Stale Data

1. Clear browser cache and restart app
2. Check if `lastUpdated` is incrementing
3. Verify component dependencies include `lastUpdated`

## Related Files

- `store/SettingsStore.ts` - Settings state management
- `app/global/_components/Sidebar/ConsoleLog/ConsoleLog.tsx` - Main consumer
- `app/components/PageSpeedInsigthsApi.tsx` - PSI API key modal
- `app/components/ui/Footer/CrawlerType.tsx` - PSI bulk toggle
- `app/components/ui/TopMenuBar/Configurations/PagespeedInsigthsApi.tsx` - PSI config display

## Testing

To verify settings refresh is working:

1. Open Console Log in sidebar
2. Navigate to PSI settings
3. Add or modify API key
4. Observe Console Log updates within 30 seconds (or immediately if trigger is called)
5. Verify badge changes from ERROR to OK

## Benefits

✅ Real-time UI updates  
✅ Reduced code duplication  
✅ Centralized state management  
✅ Better user experience  
✅ Easier maintenance  
✅ Scalable architecture  
