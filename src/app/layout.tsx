import "@/styles/globals.scss";
import ContextProvider from "@/context";
import LayoutClientWrapper from "@/components/LayoutClientWrapper";
import type { Metadata, Viewport } from 'next';

// Get the site URL from environment variable or use a default
const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://helioschain.network';

// Define metadata for SEO and social sharing
export const metadata: Metadata = {
  title: 'Helios Beta Mainnet',
  description: 'We are live on Helios Beta Mainnet. Earn XP and HLS in our pre-TGE campaign by participating to help secure the Interchain Proof of Stake and Reputation (I-PoSR) consensus.',
  keywords: ['Helios', 'blockchain', 'beta mainnet', 'crypto', 'web3', 'XP', 'HLS', 'rewards', 'staking', 'I-PoSR', 'pre-TGE', 'referral'],
  applicationName: 'Helios Beta Mainnet',
  authors: [{ name: 'Helios Chain Labs' }],
  creator: 'Helios Chain Labs',
  publisher: 'Helios Chain Labs',
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    title: 'Helios Beta Mainnet',
    description: 'Helios Beta Mainnet is live. Earn XP and HLS by joining our pre-TGE campaign and help secure I-PoSR consensus.',
    siteName: 'Helios Beta Mainnet',
    images: [
      {
        url: '/images/newthumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Helios Beta Mainnet',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helios Beta Mainnet',
    description: 'Earn XP and HLS on Helios Beta Mainnet by participating in our pre-TGE campaign to secure I-PoSR consensus.',
    images: ['/images/newthumbnail.png'],
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
