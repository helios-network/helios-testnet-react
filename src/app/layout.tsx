import "@/styles/globals.scss";
import ContextProvider from "@/context";
import LayoutClientWrapper from "@/components/LayoutClientWrapper";
import type { Metadata, Viewport } from 'next';

// Define metadata for SEO and social sharing
export const metadata: Metadata = {
  title: 'Helios Testnet - Gamified Builder Experience',
  description: 'Join Helios Testnet to earn XP by completing on-chain activities, claiming from faucets, and inviting friends through our referral system. Experience the Interchain Proof of Stake and Reputation blockchain.',
  keywords: ['Helios', 'blockchain', 'testnet', 'crypto', 'web3', 'XP', 'rewards', 'staking', 'faucet', 'I-PoSR', 'referral'],
  applicationName: 'Helios Testnet',
  authors: [{ name: 'Helios Chain Labs' }],
  creator: 'Helios Chain Labs',
  publisher: 'Helios Chain Labs',
  metadataBase: new URL('https://testnet.helioschain.network'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon/favicon-16x16.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/favicon/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/favicon/android-chrome-512x512.png',
      }
    ]
  },
  openGraph: {
    type: 'website',
    url: 'https://testnet.helioschain.network',
    title: 'Helios Testnet - Earn XP Through Blockchain Activities',
    description: 'Helios is a blockchain with Interchain Proof of Stake and Reputation (I-PoSR) consensus. Join our testnet to farm XP points by completing on-chain activities.',
    siteName: 'Helios Testnet',
    images: [
      {
        url: '/images/helios-social-card.png',
        width: 1200,
        height: 630,
        alt: 'Helios Testnet',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helios Testnet - Gamified Builder Experience',
    description: 'Earn XP on Helios Testnet by claiming from faucets, completing on-chain activities, and using our referral system.',
    images: ['/images/helios-social-card.png'],
    creator: '@HeliosChain',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Define viewport settings
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F2F5FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* In static export mode, cookies will be null */}
        <ContextProvider cookies={null}>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
