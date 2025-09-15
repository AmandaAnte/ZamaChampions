import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { initFHEVM } from './utils/fhe'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MatchList from './components/MatchList'
import AdminPanel from './components/AdminPanel'

function App() {
  const { address, isConnected } = useAccount()
  const [fhevmInitialized, setFhevmInitialized] = useState(false)
  const [fhevmInitializing, setFhevmInitializing] = useState(false)
  const [activeTab, setActiveTab] = useState<'matches' | 'admin' | 'dashboard'>('matches')

  const handleInitFHEVM = async () => {
    if (fhevmInitialized || fhevmInitializing) return

    setFhevmInitializing(true)
    try {
      await initFHEVM()
      setFhevmInitialized(true)
      console.log('FHEVM initialized successfully')
    } catch (error) {
      console.error('Failed to initialize FHEVM:', error)
    } finally {
      setFhevmInitializing(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">Champion Betting</h1>
          <p className="text-lg mb-8 text-gray">
            FHE-powered Encrypted Football Betting Platform
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fhevmInitialized={fhevmInitialized}
        fhevmInitializing={fhevmInitializing}
        onInitFHEVM={handleInitFHEVM}
      />

      <main className="main">
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'matches' && <MatchList />}
          {activeTab === 'admin' && <AdminPanel />}
        </div>
      </main>
    </div>
  )
}

export default App