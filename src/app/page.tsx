export default function Home() {
  return (
    <div>
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to Satchel</h1>
        <p className="text-xl text-gray-400 mb-8">
          NFT badge authorization system for Algorand wallets
        </p>
        <div className="flex justify-center gap-4">
          <a href="/badges" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium">
            View Badges
          </a>
          <a href="/create" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">
            Create Badge
          </a>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-semibold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-3">Wallet Management</h3>
            <p className="text-gray-400">Connect via Pera Wallet, Defly Wallet, Exodus, or WalletConnect. One-click wallet connection with balance display.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-3">Badge Management</h3>
            <p className="text-gray-400">Create, search, update, and manage badges. Define criteria as manual approval or webhook-triggered.</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-3">Webhook System</h3>
            <p className="text-gray-400">Register webhook endpoints for automatic badge issuance. Built-in testing tool for verifying integrations.</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-semibold text-center mb-8">How It Works</h2>
        <div className="bg-gray-800 max-w-3xl mx-auto p-6 rounded-lg border border-gray-700">
          <ol className="list-decimal list-inside space-y-4 text-gray-300">
            <li><strong className="text-white">Create Badge</strong> — Define a badge with name, description, and criteria</li>
            <li><strong className="text-white">Earn Badge</strong> — Complete criteria or receive webhook signal</li>
            <li><strong className="text-white">Receive NFT</strong> — Algorand ASA minted and sent to your wallet</li>
            <li><strong className="text-white">Connect Wallet</strong> — Use your badge on any Satchel-compatible app</li>
            <li><strong className="text-white">Unlock Features</strong> — Apps verify on-chain badge ownership and grant access</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
