# ZamaChampions - Encrypted Football Betting Platform

![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-^0.8.24-blue.svg)
![Node.js](https://img.shields.io/badge/node.js->=20-green.svg)
![React](https://img.shields.io/badge/react-^18.2.0-blue.svg)

ZamaChampions is a revolutionary decentralized football betting platform built on Zama's Fully Homomorphic Encryption (FHE) technology. The platform ensures complete privacy for user bets and balances while maintaining transparency in match results and payouts.

## 🏆 Project Overview

ZamaChampions leverages cutting-edge FHE technology to create a truly confidential betting experience where:
- User balances are encrypted and private
- Bet directions and amounts remain confidential
- Only match results and aggregate statistics are revealed
- Fair distribution of winnings based on encrypted bet pools

### Key Features

- **🔒 Complete Privacy**: All user data encrypted with Zama FHE
- **💰 ETH to Points Conversion**: 1 ETH = 100,000 FootPoints (encrypted)
- **🎯 Fixed Betting Units**: 100 points per bet with unlimited betting quantity
- **⚽ Match Management**: Create matches with flexible betting windows  
- **🏆 Smart Payouts**: Proportional winnings distribution based on encrypted pools
- **🔐 Async Decryption**: Secure result revelation using Zama's decryption oracle

## 🛠️ Technology Stack

### Smart Contract Layer
- **Framework**: Hardhat with TypeScript
- **Solidity Version**: ^0.8.24
- **FHE Library**: @fhevm/solidity ^0.7.0
- **Oracle Integration**: @zama-fhe/oracle-solidity ^0.1.0
- **Network**: Sepolia Testnet (FHEVM-enabled)

### Frontend Application
- **Framework**: React 18 + Vite
- **Web3 Integration**: 
  - wagmi ^2.12.11
  - viem ^2.20.0
  - @rainbow-me/rainbowkit ^2.1.6
- **FHE SDK**: @zama-fhe/relayer-sdk ^0.1.2
- **UI Components**: Lucide React icons
- **Date Handling**: date-fns ^3.6.0

### Development Tools
- **Testing**: Hardhat + Chai + Mocha
- **Linting**: ESLint + Prettier + Solhint
- **Type Safety**: TypeScript 5+
- **Coverage**: Solidity Coverage

## 🏗️ Project Structure

```
ZamaChampions/
├── contracts/                 # Smart contracts
│   └── FootballBetting.sol   # Main betting contract with FHE
├── deploy/                   # Deployment scripts
│   ├── deploy.ts            # General deployment script
│   └── FootballBetting.ts   # Contract-specific deployment
├── test/                     # Contract tests
├── tasks/                    # Custom Hardhat tasks
├── app/                     # Frontend React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript definitions
│   └── package.json         # Frontend dependencies
├── docs/                    # Documentation
│   ├── zama_llm.md         # Zama FHE development guide
│   └── zama_doc_relayer.md # Relayer SDK documentation
├── hardhat.config.ts        # Hardhat configuration
├── CLAUDE.md               # Claude AI instructions
└── package.json            # Root dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7 or higher
- **MetaMask**: Browser wallet for interaction
- **Sepolia ETH**: For transactions and point purchases

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ZamaChampions.git
   cd ZamaChampions
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd app
   npm install
   cd ..
   ```

4. **Environment setup**
   ```bash
   # Set your mnemonic for deployment
   npx hardhat vars set MNEMONIC
   
   # Set Infura API key for network access
   npx hardhat vars set INFURA_API_KEY
   
   # Optional: Set Etherscan API key for verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

### Development Workflow

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Run tests**
   ```bash
   npm run test
   ```

3. **Deploy to local network**
   ```bash
   # Terminal 1: Start local node
   npx hardhat node
   
   # Terminal 2: Deploy contracts
   npx hardhat deploy --network localhost
   ```

4. **Deploy to Sepolia testnet**
   ```bash
   npx hardhat deploy --network sepolia
   ```

5. **Start frontend development server**
   ```bash
   cd app
   npm run dev
   ```

6. **Run frontend in production mode**
   ```bash
   cd app
   npm run build
   npm run preview
   ```

## 📋 Smart Contract Features

### FootballBetting.sol

The main contract implements a comprehensive betting system with FHE encryption:

#### Core Functionality

**Point Management**
- `buyPoints()`: Convert ETH to encrypted FootPoints (1 ETH = 100,000 points)
- `getUserPoints(address)`: View encrypted user balance

**Match Management (Owner Only)**
- `createMatch()`: Create new match with betting timeframe
- `finishMatch()`: Set match result and trigger decryption
- Parameters: home team, away team, match name, betting windows

**Betting System**
- `placeBet()`: Place encrypted bets (direction + amount)
- Bet directions: 1=Home Win, 2=Away Win, 3=Draw
- Fixed cost: 100 points per bet unit
- Encrypted bet tracking and pool accumulation

**Settlement System**
- `settleBet()`: Claim winnings after match completion
- Proportional payout based on winning pool distribution
- Automatic point distribution to winners

#### Security Features

- **Access Control Lists (ACL)**: Proper FHE permissions management
- **Async Decryption**: Oracle-based secure result revelation  
- **Input Validation**: Comprehensive checks on all parameters
- **Reentrancy Protection**: Safe external calls and state updates

#### FHE Integration

**Encrypted Data Types**
- `euint32`: User points and bet amounts
- `euint8`: Bet directions (1, 2, 3)
- `ebool`: Conditional logic flags

**Key Operations**
- Encrypted arithmetic for point calculations
- Conditional selections for bet categorization
- Secure comparisons for balance validation
- Homomorphic operations on encrypted bet pools

## 🎮 Frontend Application

### Core Components

**User Interface**
- **Wallet Connection**: RainbowKit integration for seamless Web3 onboarding
- **Point Management**: Real-time encrypted balance display and ETH conversion
- **Match Browser**: Live and upcoming matches with betting status
- **Bet Placement**: Secure encrypted bet submission interface
- **Settlement Dashboard**: Track and claim winnings

**FHE Integration**
- **Input Encryption**: Client-side encryption before contract submission  
- **User Decryption**: Secure balance and bet information decryption
- **Relayer Communication**: Seamless interaction with Zama's infrastructure

### Key Features

**Responsive Design**
- Mobile-first approach with desktop optimization
- Clean, intuitive interface for betting operations
- Real-time updates on match status and betting pools

**Security Implementation**
- Client-side input validation before encryption
- Secure key generation and management
- Proper error handling for failed transactions

## 📊 Game Mechanics

### Point System
- **Conversion Rate**: 1 ETH = 100,000 FootPoints
- **Bet Unit**: 100 points per bet (fixed)
- **Unlimited Betting**: Users can place multiple bet units per match
- **Encrypted Storage**: All balances stored as encrypted values

### Betting Process
1. **Purchase Points**: Convert ETH to encrypted FootPoints
2. **Browse Matches**: View available matches within betting windows
3. **Place Bets**: Submit encrypted bet direction and quantity
4. **Wait for Results**: Match completion triggers automatic processing
5. **Claim Winnings**: Settle bets after result decryption

### Payout Calculation
```
User Winnings = (Total Prize Pool × User Bet Amount) ÷ Total Winning Bets
```
- Fair distribution based on proportional stake
- All calculations performed on decrypted values
- Automatic point distribution to user accounts

## 🔧 Available Scripts

### Root Package Scripts
| Command | Description |
|---------|-------------|
| `npm run compile` | Compile all smart contracts |
| `npm run test` | Run contract test suite |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate test coverage report |
| `npm run lint` | Run all linting checks |
| `npm run clean` | Clean build artifacts |

### Frontend Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint frontend code |

## 🌐 Network Configuration

### Sepolia Testnet (Primary)
- **Network ID**: 11155111
- **RPC URL**: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- **Block Explorer**: https://sepolia.etherscan.io

### FHEVM Configuration
```typescript
// Contract Addresses on Sepolia
FHEVM_EXECUTOR_CONTRACT: "0x848B0066793BcC60346Da1F49049357399B8D595"
ACL_CONTRACT: "0x687820221192C5B662b25367F70076A37bc79b6c"
KMS_VERIFIER_CONTRACT: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC"
INPUT_VERIFIER_CONTRACT: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4"
DECRYPTION_ORACLE_CONTRACT: "0xa02Cda4Ca3a71D7C46997716F4283aa851C28812"

// Gateway Configuration  
GATEWAY_CHAIN_ID: 55815
RELAYER_URL: "https://relayer.testnet.zama.cloud"
```

## 🧪 Testing

### Contract Testing
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run coverage

# Run tests on Sepolia
npm run test:sepolia
```

### Test Categories
- **Unit Tests**: Individual contract function testing
- **Integration Tests**: End-to-end betting workflows
- **FHE Tests**: Encryption/decryption validation
- **Access Control Tests**: Permission and security validation

### Frontend Testing
```bash
cd app
npm run lint  # Code quality checks
```

## 📖 Usage Examples

### Smart Contract Interaction

**Deploy and Setup**
```javascript
// Deploy contract
const contract = await ethers.deployContract("FootballBetting");

// Create a match (owner only)
await contract.createMatch(
    "Manchester United",
    "Liverpool FC", 
    "Premier League Match",
    bettingStart,
    bettingEnd,
    matchTime
);
```

**User Operations**
```javascript
// Buy points
await contract.buyPoints({ value: ethers.parseEther("0.1") });

// Place encrypted bet
const input = fhevm.createEncryptedInput(contractAddress, userAddress);
input.add8(1);  // Home win
input.add32(5); // 5 bet units
const encryptedInput = await input.encrypt();

await contract.placeBet(
    matchId,
    encryptedInput.handles[0], // bet direction
    encryptedInput.handles[1], // bet amount  
    encryptedInput.inputProof
);

// Settle bet after match
await contract.settleBet(matchId);
```

### Frontend Integration
```typescript
// Initialize FHEVM instance
const instance = await createInstance(SepoliaConfig);

// Encrypt user input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(betDirection);
input.add32(betAmount);
const encryptedInput = await input.encrypt();

// Submit transaction
const tx = await contract.placeBet(
    matchId,
    encryptedInput.handles[0],
    encryptedInput.handles[1], 
    encryptedInput.inputProof
);

// Decrypt user balance
const encryptedBalance = await contract.getUserPoints(userAddress);
const decryptedBalance = await instance.userDecrypt(
    encryptedBalance,
    privateKey,
    publicKey,
    signature,
    contractAddress,
    userAddress
);
```

## 🔒 Security Considerations

### Smart Contract Security
- **Access Controls**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking
- **Reentrancy Protection**: Safe state updates and external calls
- **Integer Overflow Protection**: Safe arithmetic operations
- **ACL Management**: Proper FHE permission handling

### FHE Security
- **Encrypted Storage**: All sensitive data encrypted at rest
- **Secure Computation**: Homomorphic operations on encrypted data
- **Key Management**: Distributed key generation through Zama KMS
- **Oracle Integration**: Trusted decryption through verified oracles

### Frontend Security
- **Input Sanitization**: Client-side validation before encryption
- **Secure Communication**: HTTPS endpoints for all external calls
- **Key Protection**: Secure client-side key generation and storage
- **Error Handling**: Safe error messages without data leakage

## 🚧 Known Limitations

- **Gas Costs**: FHE operations consume more gas than standard operations
- **Decryption Delays**: Asynchronous decryption requires waiting periods
- **Testnet Only**: Currently deployed on Sepolia testnet
- **Match Creation**: Limited to contract owner (could be extended to DAO)
- **Bet Modification**: No bet cancellation once placed

## 🔮 Future Enhancements

### Platform Features
- **Multi-Sport Support**: Expand beyond football to other sports
- **Live Betting**: Real-time betting during matches
- **Complex Bets**: Over/under, handicap, and combination bets
- **Tournament Betting**: Season-long and championship wagering
- **Social Features**: Leaderboards and achievement system

### Technical Improvements
- **Layer 2 Integration**: Deploy on FHE-enabled L2 for lower costs
- **DAO Governance**: Decentralized match creation and management
- **Oracle Integration**: Multiple sports data providers
- **Mobile Apps**: Native iOS and Android applications
- **Advanced Analytics**: Encrypted betting pattern analysis

## 📚 Documentation

### Comprehensive Guides
- **[Zama FHE Development Guide](docs/zama_llm.md)**: Complete FHEVM development reference
- **[Relayer SDK Documentation](docs/zama_doc_relayer.md)**: Frontend integration guide
- **[Project Instructions](CLAUDE.md)**: Development guidelines and architecture

### External Resources
- **[FHEVM Documentation](https://docs.zama.ai/fhevm)**: Official Zama documentation
- **[Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)**: FHEVM Hardhat integration
- **[Community Forum](https://community.zama.ai/c/fhevm/15)**: Developer discussions and support
- **[Discord Channel](https://discord.com/invite/fhe-org)**: Real-time community support

## 📝 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions to ZamaChampions! Please follow these guidelines:

1. **Fork the repository** and create your feature branch
2. **Follow coding standards** established in the project
3. **Add tests** for new functionality
4. **Update documentation** for any API changes
5. **Submit pull requests** with clear descriptions

### Development Standards
- Follow existing code style and formatting
- Maintain comprehensive test coverage
- Document all public functions and interfaces
- Use meaningful commit messages
- Ensure security best practices

## 🆘 Support

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/ZamaChampions/issues)
- **Documentation**: Comprehensive guides in `/docs` directory
- **Community Support**: 
  - [Zama Community Forum](https://community.zama.ai/c/fhevm/15)
  - [Discord Channel](https://discord.com/invite/fhe-org)

### Common Issues
- **Wallet Connection**: Ensure MetaMask is configured for Sepolia testnet
- **Transaction Failures**: Check gas limits and network congestion
- **Encryption Errors**: Verify proper FHEVM SDK initialization
- **Decryption Delays**: Allow sufficient time for oracle processing

## 🙏 Acknowledgments

- **Zama Team**: For pioneering FHE technology and comprehensive developer tools
- **Hardhat Team**: For robust smart contract development framework
- **React Community**: For modern frontend development ecosystem
- **Open Source Contributors**: For libraries and tools that make this project possible

---

**Built with ❤️ using Zama's Fully Homomorphic Encryption technology**

*ZamaChampions - Where Privacy Meets Fair Play* ⚽🏆