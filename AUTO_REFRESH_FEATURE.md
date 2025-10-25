# Auto-Refresh Feature for HLS Rewards

## Overview
Added automatic polling to refresh HLS rewards and liquidity data in real-time without requiring manual page refresh.

---

## Changes Made

### File Modified:
- `src/components/StakedSummaryBar.tsx`

### What Changed:

1. **Extracted `fetchData` function** using `useCallback`
   - Reusable function for fetching liquidity and APY data
   - Properly memoized with dependencies (`isAuthenticated`, `address`)

2. **Added Auto-Refresh Polling** (Lines 137-148)
   - Polls backend every **3 minutes** for updated data
   - Only runs when user is authenticated
   - Automatically cleans up interval on unmount or auth change

3. **Import Update**
   - Added `useCallback` to React imports

---

## How It Works

### Initial Load
```typescript
useEffect(() => {
  fetchData(); // Loads data when component mounts or address changes
}, [fetchData]);
```

### Auto-Refresh Polling
```typescript
useEffect(() => {
  if (!isAuthenticated) return;

  const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
  const intervalId = setInterval(() => {
    fetchData(); // Refreshes data every 3 minutes
  }, POLL_INTERVAL_MS);

  return () => clearInterval(intervalId); // Cleanup on unmount
}, [isAuthenticated, fetchData]);
```

---

## User Experience

### Before:
- ❌ User had to manually refresh the page to see updated rewards
- ❌ "Accrued HLS" and "Effective APY" remained stale
- ❌ Hourly estimates didn't update automatically

### After:
- ✅ Data refreshes automatically every 3 minutes
- ✅ Real-time updates for:
  - Accrued HLS (claimable after TGE)
  - Estimated Daily HLS
  - Hourly HLS estimates
  - Effective (Blended) APY
  - Base APY
  - Liquidity positions by chain
- ✅ No page refresh required
- ✅ Smooth, non-intrusive updates (no UI flicker)

---

## Configuration

### Adjusting Poll Interval

To change the refresh frequency, modify the constant in `StakedSummaryBar.tsx`:

```typescript
const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

// Examples:
// 1 minute:  1 * 60 * 1000
// 2 minutes: 2 * 60 * 1000
// 5 minutes: 5 * 60 * 1000
```

**Recommended:** 2-5 minutes
- Too frequent (< 1 min): Unnecessary server load
- Too infrequent (> 10 min): Poor user experience

---

## Technical Details

### API Calls Made Every 3 Minutes:
1. `GET /api/liquidity/user` - User's liquidity summary
2. `GET /api/apy/summary?wallet={address}` - User's APY and rewards data

### Error Handling:
- Transient errors are caught and logged
- Previous data is retained on error (no UI flicker)
- Interval continues running even if a single fetch fails

### Performance:
- Uses `useCallback` to prevent unnecessary re-renders
- Minimal memory footprint (single interval per component)
- Automatic cleanup prevents memory leaks

---

## Data That Updates Automatically

### Accrued HLS Section:
- **Claimable HLS**: Total HLS earned (updated as cycles run)
- **USD Estimate**: Based on current HLS price
- **Estimated Daily HLS**: Projected daily earnings
- **Hourly HLS**: Projected hourly earnings

### APY Section:
- **Effective (Blended) APY**: Weighted average APY
- **Base APY**: Target APY from backend
- **Boosted vs Base breakdown**: Shows multiplier effect

### Liquidity Positions:
- **Total USD value**: Across all chains
- **Per-chain breakdown**: ETH, BNB, Arbitrum, Base, Optimism, Polygon
- **Token positions**: Individual asset holdings

---

## Testing

### Verify Auto-Refresh is Working:

1. Open Dashboard while authenticated
2. Note the "Accrued HLS" value
3. Wait 3 minutes (without refreshing page)
4. Value should update automatically to reflect new cycle rewards

### Check Browser Console:
```javascript
// Should see API calls every 3 minutes:
// GET /api/liquidity/user
// GET /api/apy/summary?wallet=0x...
```

### Manual Testing:
```typescript
// Temporarily reduce interval to 10 seconds for testing
const POLL_INTERVAL_MS = 10 * 1000; // 10 seconds (for testing only)
```

---

## Known Behavior

### What Updates:
- ✅ HLS rewards (accumulate as cycles run)
- ✅ APY percentages (if backend config changes)
- ✅ Liquidity balances (if new deposits confirmed)
- ✅ USD values (if token prices change)

### What Doesn't Update (By Design):
- ❌ Historical reward history (static once created)
- ❌ Past cycle data (immutable)

---

## Deployment Notes

- ✅ No breaking changes
- ✅ Backward compatible
- ✅ No environment variables needed
- ✅ No database changes required
- ✅ Works with existing backend API

---

## Future Enhancements

### Potential Improvements:
1. **Smart Polling**: Increase frequency when rewards cycle is about to run
2. **Visual Indicator**: Show "Last updated: 2 min ago" timestamp
3. **WebSocket Support**: Real-time push updates instead of polling
4. **Pause on Inactive Tab**: Stop polling when tab is not visible
5. **Configurable Interval**: Allow users to choose refresh frequency

---

**Implemented:** October 25, 2025  
**Status:** ✅ Production Ready  
**Impact:** Improved user experience with real-time data updates

