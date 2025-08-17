// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FootballBetting is SepoliaConfig {
    uint256 public constant FOOT_POINT_RATIO = 100000; // 1 ETH = 100000 FootPoint

    enum BetType { HOME_WIN, AWAY_WIN, DRAW }
    enum GameStatus { BETTING_OPEN, BETTING_CLOSED, SETTLED }

    struct Game {
        string homeTeam;
        string awayTeam;
        uint256 startTime;
        GameStatus status;
        BetType result;
    }

    address public owner;
    mapping(address => euint32) private userFootPoints;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => euint32)) public userHomeBets;
    mapping(uint256 => mapping(address => euint32)) public userAwayBets;
    mapping(uint256 => mapping(address => euint32)) public userDrawBets;
    uint256 public gameCounter;

    event GameCreated(uint256 indexed gameId, string homeTeam, string awayTeam, uint256 startTime);
    event BetPlaced(uint256 indexed gameId, address indexed user, BetType betType);
    event GameClosed(uint256 indexed gameId);
    event GameSettled(uint256 indexed gameId, BetType result);
    event PointsRewarded(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier gameExists(uint256 gameId) {
        require(gameId < gameCounter, "Game does not exist");
        _;
    }

    modifier bettingOpen(uint256 gameId) {
        require(games[gameId].status == GameStatus.BETTING_OPEN, "Betting is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function depositETHForPoints() external payable {
        require(msg.value > 0, "Must send ETH");
        
        uint256 footPointsToAdd = msg.value * FOOT_POINT_RATIO / 1 ether;
        
        userFootPoints[msg.sender] = FHE.add(userFootPoints[msg.sender], uint32(footPointsToAdd));
        
        FHE.allowThis(userFootPoints[msg.sender]);
        FHE.allow(userFootPoints[msg.sender], msg.sender);
    }

    function getUserFootPoints() external view returns (euint32) {
        return userFootPoints[msg.sender];
    }

    function createGame(
        string calldata homeTeam,
        string calldata awayTeam,
        uint256 startTime
    ) external onlyOwner {
        require(startTime > block.timestamp, "Start time must be in the future");
        
        uint256 gameId = gameCounter++;
        Game storage game = games[gameId];
        game.homeTeam = homeTeam;
        game.awayTeam = awayTeam;
        game.startTime = startTime;
        game.status = GameStatus.BETTING_OPEN;
        
        emit GameCreated(gameId, homeTeam, awayTeam, startTime);
    }

    function placeBet(
        uint256 gameId,
        BetType betType,
        externalEuint32 encryptedBetCount,
        bytes calldata inputProof
    ) external gameExists(gameId) bettingOpen(gameId) {
        euint32 betCount = FHE.fromExternal(encryptedBetCount, inputProof);
        
        // Add the bet to user's total for this bet type
        if (betType == BetType.HOME_WIN) {
            userHomeBets[gameId][msg.sender] = FHE.add(userHomeBets[gameId][msg.sender], betCount);
            FHE.allowThis(userHomeBets[gameId][msg.sender]);
            FHE.allow(userHomeBets[gameId][msg.sender], msg.sender);
        } else if (betType == BetType.AWAY_WIN) {
            userAwayBets[gameId][msg.sender] = FHE.add(userAwayBets[gameId][msg.sender], betCount);
            FHE.allowThis(userAwayBets[gameId][msg.sender]);
            FHE.allow(userAwayBets[gameId][msg.sender], msg.sender);
        } else {
            userDrawBets[gameId][msg.sender] = FHE.add(userDrawBets[gameId][msg.sender], betCount);
            FHE.allowThis(userDrawBets[gameId][msg.sender]);
            FHE.allow(userDrawBets[gameId][msg.sender], msg.sender);
        }
        
        emit BetPlaced(gameId, msg.sender, betType);
    }

    function getUserBets(uint256 gameId, address user) 
        external 
        view 
        gameExists(gameId) 
        returns (euint32, euint32, euint32) 
    {
        return (userHomeBets[gameId][user], userAwayBets[gameId][user], userDrawBets[gameId][user]);
    }

    function closeBetting(uint256 gameId) external onlyOwner gameExists(gameId) {
        require(games[gameId].status == GameStatus.BETTING_OPEN, "Betting already closed");
        games[gameId].status = GameStatus.BETTING_CLOSED;
        emit GameClosed(gameId);
    }

    function settleGame(uint256 gameId, BetType result) external onlyOwner gameExists(gameId) {
        require(games[gameId].status == GameStatus.BETTING_CLOSED, "Game not ready for settlement");
        
        Game storage game = games[gameId];
        game.status = GameStatus.SETTLED;
        game.result = result;
        
        emit GameSettled(gameId, result);
    }

    function getGameInfo(uint256 gameId) external view gameExists(gameId) returns (
        string memory homeTeam,
        string memory awayTeam,
        uint256 startTime,
        GameStatus status
    ) {
        Game storage game = games[gameId];
        return (game.homeTeam, game.awayTeam, game.startTime, game.status);
    }

    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}