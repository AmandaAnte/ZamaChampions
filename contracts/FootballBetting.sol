// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FootballBetting is SepoliaConfig {
    uint256 public constant FOOT_POINT_RATIO = 100000; // 1 ETH = 100000 FootPoint
    uint256 public constant BET_AMOUNT = 10; // 每注10积分

    enum BetType { HOME_WIN, AWAY_WIN, DRAW }
    enum GameStatus { BETTING_OPEN, BETTING_CLOSED, SETTLED }

    struct Game {
        string homeTeam;
        string awayTeam;
        uint256 startTime;
        GameStatus status;
        BetType result;
        euint32 totalHomeBets;
        euint32 totalAwayBets;
        euint32 totalDrawBets;
        mapping(address => euint32) userHomeBets;
        mapping(address => euint32) userAwayBets;
        mapping(address => euint32) userDrawBets;
    }

    address public owner;
    mapping(address => euint32) private userFootPoints;
    mapping(uint256 => Game) public games;
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
        euint32 encryptedPoints = FHE.asEuint32(footPointsToAdd);
        
        userFootPoints[msg.sender] = FHE.add(userFootPoints[msg.sender], encryptedPoints);
        
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
        game.totalHomeBets = FHE.asEuint32(0);
        game.totalAwayBets = FHE.asEuint32(0);
        game.totalDrawBets = FHE.asEuint32(0);
        
        emit GameCreated(gameId, homeTeam, awayTeam, startTime);
    }

    function placeBet(
        uint256 gameId,
        BetType betType,
        externalEuint32 encryptedBetCount,
        bytes calldata inputProof
    ) external gameExists(gameId) bettingOpen(gameId) {
        euint32 betCount = FHE.fromExternal(encryptedBetCount, inputProof);
        euint32 totalBetAmount = FHE.mul(betCount, BET_AMOUNT);
        
        ebool hasSufficientPoints = FHE.le(totalBetAmount, userFootPoints[msg.sender]);
        
        euint32 actualBetAmount = FHE.select(hasSufficientPoints, totalBetAmount, FHE.asEuint32(0));
        euint32 actualBetCount = FHE.select(hasSufficientPoints, betCount, FHE.asEuint32(0));
        
        userFootPoints[msg.sender] = FHE.sub(userFootPoints[msg.sender], actualBetAmount);
        
        Game storage game = games[gameId];
        
        if (betType == BetType.HOME_WIN) {
            game.userHomeBets[msg.sender] = FHE.add(game.userHomeBets[msg.sender], actualBetCount);
            game.totalHomeBets = FHE.add(game.totalHomeBets, actualBetCount);
            FHE.allowThis(game.userHomeBets[msg.sender]);
            FHE.allow(game.userHomeBets[msg.sender], msg.sender);
        } else if (betType == BetType.AWAY_WIN) {
            game.userAwayBets[msg.sender] = FHE.add(game.userAwayBets[msg.sender], actualBetCount);
            game.totalAwayBets = FHE.add(game.totalAwayBets, actualBetCount);
            FHE.allowThis(game.userAwayBets[msg.sender]);
            FHE.allow(game.userAwayBets[msg.sender], msg.sender);
        } else {
            game.userDrawBets[msg.sender] = FHE.add(game.userDrawBets[msg.sender], actualBetCount);
            game.totalDrawBets = FHE.add(game.totalDrawBets, actualBetCount);
            FHE.allowThis(game.userDrawBets[msg.sender]);
            FHE.allow(game.userDrawBets[msg.sender], msg.sender);
        }
        
        FHE.allowThis(userFootPoints[msg.sender]);
        FHE.allow(userFootPoints[msg.sender], msg.sender);
        
        emit BetPlaced(gameId, msg.sender, betType);
    }

    function getUserBets(uint256 gameId, address user) external view gameExists(gameId) returns (euint32, euint32, euint32) {
        Game storage game = games[gameId];
        return (game.userHomeBets[user], game.userAwayBets[user], game.userDrawBets[user]);
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

    function claimWinnings(uint256 gameId) external gameExists(gameId) {
        require(games[gameId].status == GameStatus.SETTLED, "Game not settled");
        
        Game storage game = games[gameId];
        BetType result = game.result;
        
        euint32 userWinningBets;
        euint32 totalWinningBets;
        euint32 totalLosingBets;
        
        if (result == BetType.HOME_WIN) {
            userWinningBets = game.userHomeBets[msg.sender];
            totalWinningBets = game.totalHomeBets;
            totalLosingBets = FHE.add(game.totalAwayBets, game.totalDrawBets);
        } else if (result == BetType.AWAY_WIN) {
            userWinningBets = game.userAwayBets[msg.sender];
            totalWinningBets = game.totalAwayBets;
            totalLosingBets = FHE.add(game.totalHomeBets, game.totalDrawBets);
        } else {
            userWinningBets = game.userDrawBets[msg.sender];
            totalWinningBets = game.totalDrawBets;
            totalLosingBets = FHE.add(game.totalHomeBets, game.totalAwayBets);
        }
        
        ebool hasWinningBets = FHE.gt(userWinningBets, FHE.asEuint32(0));
        ebool hasWinners = FHE.gt(totalWinningBets, FHE.asEuint32(0));
        
        euint32 originalBetAmount = FHE.mul(userWinningBets, BET_AMOUNT);
        
        euint32 shareOfLosingBets = FHE.select(
            hasWinners,
            FHE.div(FHE.mul(totalLosingBets, userWinningBets), totalWinningBets),
            FHE.asEuint32(0)
        );
        
        euint32 rewardAmount = FHE.mul(shareOfLosingBets, BET_AMOUNT);
        euint32 totalReward = FHE.add(originalBetAmount, rewardAmount);
        
        euint32 finalReward = FHE.select(hasWinningBets, totalReward, FHE.asEuint32(0));
        
        userFootPoints[msg.sender] = FHE.add(userFootPoints[msg.sender], finalReward);
        
        if (result == BetType.HOME_WIN) {
            game.userHomeBets[msg.sender] = FHE.asEuint32(0);
        } else if (result == BetType.AWAY_WIN) {
            game.userAwayBets[msg.sender] = FHE.asEuint32(0);
        } else {
            game.userDrawBets[msg.sender] = FHE.asEuint32(0);
        }
        
        FHE.allowThis(userFootPoints[msg.sender]);
        FHE.allow(userFootPoints[msg.sender], msg.sender);
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

    function getGameTotalBets(uint256 gameId) external view gameExists(gameId) returns (euint32, euint32, euint32) {
        Game storage game = games[gameId];
        return (game.totalHomeBets, game.totalAwayBets, game.totalDrawBets);
    }

    function withdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}