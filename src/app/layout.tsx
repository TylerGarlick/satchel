'use client';

import { ClientLayout } from './ClientLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <ClientLayout>
          <nav className="bg-gray-800 p-4 mb-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <a href="/" className="text-xl font-bold">Satchel</a>
              <div className="flex gap-4">
                <a href="/badges" className="text-gray-300 hover:text-white">Badges</a>
                <a href="/create" className="text-gray-300 hover:text-white">Create</a>
                <a href="/webhooks" className="text-gray-300 hover:text-white">Webhooks</a>
                <a href="/settings" className="text-gray-300 hover:text-white">Settings</a>
              </div>
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto px-4 pb-8">
            {children}
          </main>
          
          <footer className="bg-gray-800 p-4 mt-8 text-center">
            <p className="text-gray-400 text-sm mb-2">
              Satchel - NFT Badge Authorization for Algorand
            </p>
            <p className="text-amber-600 text-xs">
              ⚠️ Satchel provides authorization, not authentication. Badges can be transferred. {' '}
              <a href="/SECURITY_DISCLAIMER" className="underline hover:text-amber-400">Security Info</a>
            </p>
          </footer>
        </ClientLayout>
      </body>
    </html>
  );
}
