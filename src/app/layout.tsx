import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Satchel - NFT Badge Authorization',
  description: 'Earn badges, receive NFTs, and unlock features across the Algorand ecosystem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
