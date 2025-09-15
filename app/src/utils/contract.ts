export const FOOTBALL_BETTING_ABI =
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "HandlesAlreadySavedForRequestID",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidKMSSignatures",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoHandleFoundForRequestID",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnsupportedHandleType",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winAmount",
        "type": "uint256"
      }
    ],
    "name": "BetSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestID",
        "type": "uint256"
      }
    ],
    "name": "DecryptionFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      }
    ],
    "name": "DecryptionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "homeTeam",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "awayTeam",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "matchName",
        "type": "string"
      }
    ],
    "name": "MatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "result",
        "type": "uint8"
      }
    ],
    "name": "MatchFinished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "homeWinTotal",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "awayWinTotal",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "drawTotal",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "totalBetAmount",
        "type": "uint32"
      }
    ],
    "name": "MatchTotalsDecrypted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pointsAmount",
        "type": "uint256"
      }
    ],
    "name": "PointsPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "UserDecryptionRequested",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BET_UNIT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ETH_TO_POINTS_RATE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyPoints",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "homeTeam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "awayTeam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "matchName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "bettingStartTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bettingEndTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "matchTime",
        "type": "uint256"
      }
    ],
    "name": "createMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "homeWinTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "awayWinTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "drawTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "totalBetAmount",
        "type": "uint32"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      }
    ],
    "name": "decryptMatchTotalsCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "betDirection",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "betAmount",
        "type": "uint32"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      }
    ],
    "name": "decryptUserBetCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "result",
        "type": "uint8"
      }
    ],
    "name": "finishMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      }
    ],
    "name": "getMatch",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "homeTeam",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "awayTeam",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "matchName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "bettingStartTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "bettingEndTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "matchTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isFinished",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "result",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "isResultDecrypted",
            "type": "bool"
          }
        ],
        "internalType": "struct FootballBetting.Match",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      }
    ],
    "name": "getMatchBets",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint32",
            "name": "homeWinTotal",
            "type": "bytes32"
          },
          {
            "internalType": "euint32",
            "name": "awayWinTotal",
            "type": "bytes32"
          },
          {
            "internalType": "euint32",
            "name": "drawTotal",
            "type": "bytes32"
          },
          {
            "internalType": "euint32",
            "name": "totalBetAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "isTotalDecrypted",
            "type": "bool"
          },
          {
            "internalType": "uint32",
            "name": "decryptedHomeWinTotal",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "decryptedAwayWinTotal",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "decryptedDrawTotal",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "decryptedTotalBetAmount",
            "type": "uint32"
          }
        ],
        "internalType": "struct FootballBetting.MatchBets",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserBet",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint8",
            "name": "betDirection",
            "type": "bytes32"
          },
          {
            "internalType": "euint32",
            "name": "betAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "hasSettled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isDecrypted",
            "type": "bool"
          }
        ],
        "internalType": "struct FootballBetting.UserBet",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserPoints",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "matchBets",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "homeWinTotal",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "awayWinTotal",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "drawTotal",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "totalBetAmount",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isTotalDecrypted",
        "type": "bool"
      },
      {
        "internalType": "uint32",
        "name": "decryptedHomeWinTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "decryptedAwayWinTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "decryptedDrawTotal",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "decryptedTotalBetAmount",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "matchCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "matches",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "homeTeam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "awayTeam",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "matchName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "bettingStartTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bettingEndTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "matchTime",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isFinished",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "result",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isResultDecrypted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint8",
        "name": "encryptedBetDirection",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "encryptedBetCount",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "matchId",
        "type": "uint256"
      }
    ],
    "name": "settleBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userBets",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "betDirection",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "betAmount",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "hasSettled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isDecrypted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const