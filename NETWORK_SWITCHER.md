# Network Switcher Component

## Overview
The Network Switcher is a powerful dropdown component that allows users to easily switch between all supported blockchain networks in the Helios application.

## Features

### 🌐 Supported Networks

#### Mainnet Networks
1. **Helios** - The native Helios blockchain
2. **Ethereum** - Ethereum mainnet
3. **BNB Chain** - Binance Smart Chain mainnet
4. **Arbitrum One** - Arbitrum Layer 2
5. **Base** - Coinbase's L2 network
6. **Optimism** - Optimistic Ethereum L2
7. **Polygon** - Polygon PoS mainnet

#### Testnet Networks
1. **Ethereum Sepolia** - Ethereum testnet
2. **BNB Testnet** - BSC testnet
3. **Arbitrum Sepolia** - Arbitrum testnet
4. **Base Sepolia** - Base testnet
5. **Optimism Sepolia** - Optimism testnet
6. **Polygon Amoy** - Polygon testnet (replacing Mumbai)

## UI/UX Design

### Trigger Button
- Shows current network icon and name
- Colored border matching network brand color
- Chevron icon indicating dropdown state
- Hover effects for better interactivity

### Dropdown Panel
- **Desktop**: Appears below trigger button (360px wide)
- **Mobile**: Full-width bottom sheet (80vh max height)
- Backdrop blur for focus
- Smooth animations (framer-motion)

### Filter Tabs
Three filter options:
- **All Networks**: Shows all 14 networks
- **Mainnet**: Shows only production networks
- **Testnet**: Shows only test networks

### Network List Items
Each network displays:
- Network icon (with fallback to Helios icon)
- Network full name
- Testnet badge (orange, for testnet networks)
- Native currency symbol
- Checkmark icon (for currently connected network)
- Color-coded left border (brand color)

### Loading State
- Full overlay with spinner
- "Switching network..." message
- Prevents multiple simultaneous switches

## Technical Implementation

### Dependencies
- `wagmi` - Blockchain wallet integration
- `framer-motion` - Smooth animations
- `lucide-react` - Icons (if needed for future features)

### Network Addition Flow
1. User clicks on a network
2. Component checks if already connected (do nothing if true)
3. Attempts to switch using wagmi's `switchChain`
4. If wagmi fails (custom/unknown network):
   - Requests `wallet_switchEthereumChain`
   - If network not in wallet (error 4902):
     - Requests `wallet_addEthereumChain` with full config
   - User approves in wallet popup
5. Success: dropdown closes, UI updates
6. Failure: Error alert, button re-enabled

### Network Configuration
Each network has:
```typescript
{
  id: number;              // Chain ID
  name: string;            // Full network name
  shortName: string;       // Display name in trigger
  icon: string;            // Icon URL (TrustWallet/official)
  category: 'mainnet' | 'testnet';
  color: string;           // Brand color (hex)
  rpcUrls: string[];       // RPC endpoints
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

### Icon Sources
- **TrustWallet Assets**: Most networks use official icons from TrustWallet's GitHub repo
- **Base**: Official Base brand kit SVG
- **Helios**: Local `/images/helios-icon.svg`
- **Fallback**: If icon fails to load, defaults to Helios icon

## Integration Points

### Header Component
- Located between balance display and wallet button
- Hidden on mobile (can be added to mobile menu if needed)
- `<NetworkSwitcher />` renders autonomously

### Wagmi Configuration (`wagmi.ts`)
All networks are imported and added to the `networks` array:
```typescript
export const networks = [
  heliosChain, 
  mainnet, 
  sepolia,
  bsc,
  bscTestnet,
  // ... etc
];
```

### AppKit Context (`context/index.tsx`)
Networks array passed to `createAppKit`:
```typescript
const modal = createAppKit({
  // ...
  networks,
  defaultNetwork: heliosChain,
  // ...
});
```

## Styling

### SCSS Module (`NetworkSwitcher.module.scss`)
- Follows Helios design system
- Colors: `#002DCB` (primary blue), `#E2EBFF` (borders), `#060F32` (text)
- Smooth transitions on all interactive elements
- Scrollable network list with custom scrollbar
- Responsive breakpoint at 640px for mobile layout

### Key Classes
- `.triggerButton` - Main button with border and hover effects
- `.dropdown` - Floating panel with shadow and rounded corners
- `.networkItem` - Individual network button with hover state
- `.testnetBadge` - Orange badge for testnet identification
- `.switchingOverlay` - Loading state overlay

## User Experience Enhancements

1. **Visual Feedback**: 
   - Current network highlighted with checkmark and colored border
   - Hover states on all clickable elements
   - Smooth animations for dropdown open/close

2. **Error Prevention**:
   - Disabled state while switching
   - Can't click current network again
   - Clear indication of testnet vs mainnet

3. **Accessibility**:
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation supported (inherited from button elements)

4. **Mobile Optimization**:
   - Bottom sheet on mobile
   - Touch-friendly button sizes
   - Scrollable list for many networks

5. **Performance**:
   - Conditional rendering (only when open)
   - Lazy image loading with error handling
   - Efficient state management

## Future Enhancements

### Potential Features
- [ ] Recently used networks at top
- [ ] Search/filter by network name
- [ ] Network status indicators (RPC health)
- [ ] Custom network addition UI
- [ ] Favorite/pin networks
- [ ] Network-specific gas price display
- [ ] Multi-chain balance aggregation
- [ ] Quick switch between mainnet ↔ testnet pairs

### Accessibility Improvements
- [ ] Full keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus trap in dropdown
- [ ] Escape key to close

### Analytics
- [ ] Track most-used networks
- [ ] Monitor switch success/failure rates
- [ ] User preferences for default network

## Testing Checklist

- [x] Switching to each mainnet network
- [x] Switching to each testnet network
- [x] Switching from unknown network
- [x] Adding custom network (Helios)
- [x] User declining switch in wallet
- [x] User declining add network
- [x] Clicking current network (should do nothing)
- [x] Mobile responsive layout
- [x] Icon fallback on load error
- [x] Filter buttons (All/Mainnet/Testnet)
- [x] Dropdown closes on backdrop click
- [x] Dropdown closes on successful switch
- [x] Loading state during switch
- [x] Network list scrollable when many items
- [x] No linter errors
- [x] Works with MetaMask
- [ ] Works with WalletConnect
- [ ] Works with Coinbase Wallet
- [ ] Works with other EVM wallets

## Known Limitations

1. **Wallet Support**: Some wallets may not support all networks or may have different behaviors for `wallet_addEthereumChain`
2. **RPC Reliability**: Public RPC endpoints can be slow or rate-limited
3. **Icon Loading**: External icons depend on third-party CDNs (TrustWallet GitHub)
4. **Wagmi Support**: Some networks may need to be added manually if not in wagmi's default list

## Troubleshooting

### Network won't switch
- Check if wallet supports the network
- Verify RPC URL is accessible
- Try adding network manually in wallet first

### Icon not loading
- Check network CDN availability
- Verify icon URL is correct
- Fallback should show Helios icon

### Dropdown not appearing
- Ensure wallet is connected (component hidden if not)
- Check z-index conflicts with other UI elements
- Verify framer-motion is installed

## Maintenance

### Adding a New Network
1. Add network config to `NETWORKS` array in `NetworkSwitcher.tsx`
2. Import network from `@reown/appkit/networks` in `wagmi.ts` (if available)
3. Add to `networks` array in `wagmi.ts`
4. Test switching and adding flow
5. Update this documentation

### Updating Network Details
- RPC URLs and explorers may change
- Keep icons up to date with official branding
- Monitor network ID changes (rare but possible for testnets)

---

**Component Location**: `/src/components/NetworkSwitcher.tsx`  
**Styles Location**: `/src/components/NetworkSwitcher.module.scss`  
**Created**: October 20, 2025  
**Version**: 1.0

