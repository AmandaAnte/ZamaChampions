import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HeaderProps {
  activeTab: 'matches' | 'admin' | 'dashboard'
  setActiveTab: (tab: 'matches' | 'admin' | 'dashboard') => void
  fhevmInitialized: boolean
  fhevmInitializing: boolean
  onInitFHEVM: () => Promise<void>
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, fhevmInitialized, fhevmInitializing, onInitFHEVM }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">⚽ Champion Betting</div>

          <nav className="flex gap-4">
            <button
              className={`button ${activeTab === 'dashboard' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`button ${activeTab === 'matches' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('matches')}
            >
              Matches
            </button>
            <button
              className={`button ${activeTab === 'admin' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('admin')}
            >
              Create Match
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {!fhevmInitialized && (
              <button
                onClick={onInitFHEVM}
                disabled={fhevmInitializing}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                {fhevmInitializing ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    Initializing....
                  </>
                ) : (
                  <>
                    🔐Init FHE
                  </>
                )}
              </button>
            )}
            {fhevmInitialized && (
              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                ✅ FHE Ready
              </span>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header