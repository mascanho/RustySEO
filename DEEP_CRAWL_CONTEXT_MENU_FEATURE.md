# Deep Crawl Queries Context Menu Feature

## Overview

This feature adds right-click context menu functionality to query keywords in the Deep Crawl queries tab, providing the same functionality as the shallow crawl queries. Users can now right-click on any query keyword to access various actions including adding queries to tracking, copying, and opening search results in different search engines.

## Location

The context menu is implemented in the Deep Crawl queries section, specifically in:
- **Path**: `RustySEO/app/global/_components/Sidebar/GSCRankingInfo/RankingInfo.tsx`
- **Context Menu Component**: `RustySEO/app/global/_components/Sidebar/GSCRankingInfo/DeepCrawlQueryContextMenu.tsx`

## Features

### Core Functionality

1. **Add to Tracking** - Adds the selected query keyword to the tracking dashboard
2. **Copy Query** - Copies the query text to clipboard
3. **Open in Search Console** - Opens the query in Google Search Console with proper filters
4. **SERP Results** - Opens search results for the query in various search engines
5. **Backlinks** - Provides links to popular backlink analysis tools

### Context Menu Options

#### Primary Actions
- **Copy Query**: Copies the query keyword to clipboard
- **Add to Tracking**: Adds query data (including clicks, impressions, position) to the keyword tracking system
- **Open in Search Console**: Opens the query in Google Search Console with proper resource ID and filters

#### SERP Results Submenu
- **Google**: Opens Google search results for the query
- **Bing**: Opens Bing search results for the query  
- **Yahoo**: Opens Yahoo search results for the query
- **Yandex**: Opens Yandex search results for the query
- **DuckDuckGo**: Opens DuckDuckGo search results for the query

#### Backlinks Submenu
- **Ahrefs**: Link to Ahrefs (placeholder)
- **Moz**: Link to Moz (placeholder)
- **Majestic**: Link to Majestic (placeholder)

## Implementation Details

### Components Modified

1. **RankingInfo.tsx**
   - Added import for `DeepCrawlQueryContextMenu`
   - Wrapped query text in the context menu component
   - Added credentials state management
   - Integrated with existing data flow

2. **DeepCrawlQueryContextMenu.tsx** (New)
   - Created dedicated context menu component using Radix UI Context Menu
   - Implements all the same functionality as shallow crawl queries
   - Handles tracking integration via Tauri commands
   - Provides consistent styling with the rest of the application

### Technical Integration

- **Tauri Commands**: Uses `add_gsc_data_to_kw_tracking_command` for adding keywords to tracking
- **Event System**: Emits `keyword-tracked` events for real-time updates
- **Store Integration**: Works with `useRankinInfoStore` and `useGlobalCrawlStore`
- **Toast Notifications**: Provides user feedback for actions
- **Browser Integration**: Opens external URLs using Tauri's shell plugin

### Styling

The context menu follows the application's design system:
- Dark mode support with `dark:bg-brand-darker` and `dark:border-brand-dark`
- Hover effects with `hover:bg-brand-bright hover:text-white`
- Consistent text sizing with `text-xs`
- Proper spacing and separators for visual hierarchy

## Usage

1. **Access**: Navigate to the Deep Crawl queries tab in the sidebar
2. **Trigger**: Right-click on any query keyword in the queries list
3. **Select**: Choose from the available context menu options
4. **Feedback**: Toast notifications will confirm successful actions

## Data Flow

1. User right-clicks on a query keyword
2. Context menu appears with available actions
3. User selects an action (e.g., "Add to Tracking")
4. Component calls appropriate Tauri command with query data
5. Backend processes the request and updates the tracking database
6. Frontend receives confirmation and shows toast notification
7. Event is emitted to update any listening components

## Error Handling

- Graceful handling of missing credentials for Search Console integration
- Error messages via toast notifications for failed operations
- Console logging for debugging purposes
- Fallback values for missing query data

## Keyword Tracking Database Synchronization

### Issues Fixed

1. **Refresh Functionality**: Fixed the deep crawl tracking refresh button that was calling a non-existent `refresh_keywords_data` command. Now uses the correct `match_tracked_with_gsc_command`.

2. **Database Consistency**: Ensured both shallow and deep crawl tracking use the same database operations and backend logic:
   - Both systems now read from the `keywords` table as primary source
   - Enhanced with `summarized_data` table for historical comparisons
   - Delete operations now properly clean up both tables

3. **Data Synchronization**: 
   - Added `sync_keyword_tables_command` to ensure database consistency
   - Both tracking systems now use identical data fetching patterns
   - Proper error handling and data refresh after operations

4. **Unified User Experience**: 
   - Consistent delete behavior between shallow and deep crawl
   - Same success/error messages and toast notifications
   - Identical data refresh patterns after CRUD operations

### Database Tables

- **`keywords`** - Primary table for keyword tracking data (used by both systems)
- **`summarized_data`** - Generated table for historical comparison metrics  
- **`keywords_tracked_gsc`** - Temporary table for GSC matching operations

## Future Enhancements

- Integration with actual backlink tools APIs
- Bulk operations for multiple queries
- Custom search engine configuration
- Query performance analytics
- Export functionality for tracked queries

## Dependencies

- **@radix-ui/react-context-menu**: Context menu component system
- **@tauri-apps/api/core**: Tauri command invocation
- **@tauri-apps/api/event**: Event system for real-time updates
- **@tauri-apps/plugin-shell**: Browser window opening
- **sonner**: Toast notifications
- **react-icons**: Icon components

## Compatibility

- Compatible with existing shallow crawl query functionality
- Maintains consistency with application styling and UX patterns
- Works with both site and domain-level Search Console properties
- Supports both light and dark themes