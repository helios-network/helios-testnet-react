# Helios Testnet App

A Next.js application for interacting with the Helios blockchain testnet. This application provides essential tools for builders to test the Helios testnet, including a faucet for claiming test tokens and a referral system to track engagement.

## Features

### Test Token Faucet
- Request testnet HLS tokens and other supported tokens
- View claim history and eligibility status
- Cooldown periods to prevent abuse

### Referral System
- Generate unique invite codes
- Track referrals through a leaderboard
- Earn rewards for successful referrals

### Web3 Integration
- Connect with popular Web3 wallets 
- Interact directly with the Helios testnet blockchain
- View transaction status and history

## Helios Testnet Information

- **Chain ID**: 42000
- **Network Name**: Helios Testnet
- **RPC URL**: https://testnet1.helioschainlabs.org/
- **Explorer**: https://explorer.helioschainlabs.org/
- **Native Currency**: 
  - **Name**: Helios
  - **Symbol**: HLS
  - **Decimals**: 18

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/helios-testnet-react.git
cd helios-testnet-react
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Connecting to Helios Testnet

To connect your wallet to the Helios testnet:

1. Open your wallet (MetaMask, etc.)
2. Add a custom network with the following details:
   - Network Name: Helios Testnet
   - RPC URL: https://testnet1.helioschainlabs.org/
   - Chain ID: 42000
   - Currency Symbol: HLS
   - Block Explorer: https://explorer.helioschainlabs.org/

## Development

This project uses:

- [Next.js](https://nextjs.org/) - React framework
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [TailwindCSS](https://tailwindcss.com/) - For styling
- [Framer Motion](https://www.framer.com/motion/) - For animations

## Building for Production

```bash
npm run build
# or
yarn build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the Helios team.
