export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Satchel
          </h1>
          <p className="text-xl text-gray-400">
            NFT Badge Authorization for Algorand
          </p>
        </header>

        <section className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
              <div className="text-3xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold mb-2">Earn Badges</h2>
              <p className="text-gray-400">
                Complete criteria defined by app developers to earn unique badges
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
              <div className="text-3xl mb-4">🎨</div>
              <h2 className="text-xl font-semibold mb-2">Receive NFTs</h2>
              <p className="text-gray-400">
                Badges are minted as NFTs on Algorand and sent to your wallet
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
              <div className="text-3xl mb-4">🚀</div>
              <h2 className="text-xl font-semibold mb-2">Unlock Features</h2>
              <p className="text-gray-400">
                Show your badges on Satchel-compatible sites to unlock exclusive features
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center mt-16 text-gray-500">
          <p>Built on Algorand • Powered by NFTs</p>
        </footer>
      </div>
    </main>
  )
}
