// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool, externalEuint32, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FootballBetting is SepoliaConfig {
    address public owner;
    
    // 用户积分映射 (加密的)
    mapping(address => euint32) private userPoints;
    
    // 比赛结构
    struct Match {
        uint256 id;
        string homeTeam;
        string awayTeam;
        string matchName;
        uint256 bettingStartTime;
        uint256 bettingEndTime;
        uint256 matchTime;
        bool isActive;
        bool isFinished;
        uint8 result; // 1: 主场赢, 2: 客场赢, 3: 平局, 0: 未结束
        bool isResultDecrypted;
    }
    
    // 用户押注结构
    struct UserBet {
        euint8 betDirection; // 加密的押注方向: 1: 主场赢, 2: 客场赢, 3: 平局
        euint32 betAmount;   // 加密的押注数量
        bool hasSettled;     // 是否已结算
        bool isDecrypted;    // 是否已解密
    }
    
    // 比赛押注统计
    struct MatchBets {
        euint32 homeWinTotal;     // 主场赢总押注
        euint32 awayWinTotal;     // 客场赢总押注  
        euint32 drawTotal;        // 平局总押注
        euint32 totalBetAmount;   // 总押注积分
        bool isTotalDecrypted;    // 总数是否已解密
        uint32 decryptedHomeWinTotal;
        uint32 decryptedAwayWinTotal;
        uint32 decryptedDrawTotal;
        uint32 decryptedTotalBetAmount;
    }
    
    // 存储所有比赛
    mapping(uint256 => Match) public matches;
    // 比赛押注统计
    mapping(uint256 => MatchBets) public matchBets;
    // 用户在特定比赛的押注 matchId => user => UserBet
    mapping(uint256 => mapping(address => UserBet)) public userBets;
    // 比赛计数器
    uint256 public matchCounter;
    
    // 常量
    uint256 public constant BET_UNIT = 100; // 每注100积分
    uint256 public constant ETH_TO_POINTS_RATE = 100000; // 1 ETH = 100000 积分
    
    // 事件
    event PointsPurchased(address indexed user, uint256 ethAmount, uint256 pointsAmount);
    event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, string matchName);
    event BetPlaced(uint256 indexed matchId, address indexed user);
    event MatchFinished(uint256 indexed matchId, uint8 result);
    event BetSettled(uint256 indexed matchId, address indexed user, uint256 winAmount);
    event DecryptionRequested(uint256 indexed matchId);
    event UserDecryptionRequested(uint256 indexed matchId, address indexed user);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validMatch(uint256 matchId) {
        require(matchId > 0 && matchId <= matchCounter, "Invalid match ID");
        require(matches[matchId].isActive, "Match is not active");
        _;
    }
    
    modifier bettingOpen(uint256 matchId) {
        require(block.timestamp >= matches[matchId].bettingStartTime, "Betting not started yet");
        require(block.timestamp <= matches[matchId].bettingEndTime, "Betting period ended");
        require(!matches[matchId].isFinished, "Match is finished");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        matchCounter = 0;
    }
    
    // 充值ETH获取积分
    function buyPoints() external payable {
        require(msg.value > 0, "Must send ETH to buy points");
        
        uint256 pointsToAdd = msg.value * ETH_TO_POINTS_RATE;
        require(pointsToAdd <= type(uint32).max, "Points amount too large");
        
        euint32 currentPoints = userPoints[msg.sender];
        if (!FHE.isInitialized(currentPoints)) {
            currentPoints = FHE.asEuint32(0);
        }
        
        euint32 newPoints = FHE.add(currentPoints, uint32(pointsToAdd));
        userPoints[msg.sender] = newPoints;
        
        // 设置ACL权限
        FHE.allowThis(userPoints[msg.sender]);
        FHE.allow(userPoints[msg.sender], msg.sender);
        
        emit PointsPurchased(msg.sender, msg.value, pointsToAdd);
    }
    
    // 创建比赛
    function createMatch(
        string memory homeTeam,
        string memory awayTeam,
        string memory matchName,
        uint256 bettingStartTime,
        uint256 bettingEndTime,
        uint256 matchTime
    ) external onlyOwner {
        require(bettingStartTime < bettingEndTime, "Invalid betting time range");
        require(bettingEndTime < matchTime, "Match time must be after betting end time");
        require(bettingStartTime > block.timestamp, "Betting start time must be in future");
        
        matchCounter++;
        
        matches[matchCounter] = Match({
            id: matchCounter,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            matchName: matchName,
            bettingStartTime: bettingStartTime,
            bettingEndTime: bettingEndTime,
            matchTime: matchTime,
            isActive: true,
            isFinished: false,
            result: 0,
            isResultDecrypted: false
        });
        
        // 初始化比赛押注统计
        matchBets[matchCounter] = MatchBets({
            homeWinTotal: FHE.asEuint32(0),
            awayWinTotal: FHE.asEuint32(0),
            drawTotal: FHE.asEuint32(0),
            totalBetAmount: FHE.asEuint32(0),
            isTotalDecrypted: false,
            decryptedHomeWinTotal: 0,
            decryptedAwayWinTotal: 0,
            decryptedDrawTotal: 0,
            decryptedTotalBetAmount: 0
        });
        
        // 设置ACL权限
        FHE.allowThis(matchBets[matchCounter].homeWinTotal);
        FHE.allowThis(matchBets[matchCounter].awayWinTotal);
        FHE.allowThis(matchBets[matchCounter].drawTotal);
        FHE.allowThis(matchBets[matchCounter].totalBetAmount);
        
        emit MatchCreated(matchCounter, homeTeam, awayTeam, matchName);
    }
    
    // 用户押注
    function placeBet(
        uint256 matchId,
        externalEuint8 encryptedBetDirection,
        externalEuint32 encryptedBetCount,
        bytes calldata inputProof
    ) external validMatch(matchId) bettingOpen(matchId) {
        // 验证并转换外部加密输入
        euint8 betDirection = FHE.fromExternal(encryptedBetDirection, inputProof);
        euint32 betCount = FHE.fromExternal(encryptedBetCount, inputProof);
        
        // 检查用户是否已经在此比赛中押注
        require(!FHE.isInitialized(userBets[matchId][msg.sender].betDirection), "Already bet on this match");
        
        // 计算总押注金额
        euint32 totalBetAmount = FHE.mul(betCount, uint32(BET_UNIT));
        
        // 检查用户积分是否足够
        euint32 currentPoints = userPoints[msg.sender];
        require(FHE.isInitialized(currentPoints), "No points available");
        
        ebool hasEnoughPoints = FHE.ge(currentPoints, totalBetAmount);
        
        // 扣除积分
        euint32 newPoints = FHE.select(hasEnoughPoints, 
            FHE.sub(currentPoints, totalBetAmount), 
            currentPoints
        );
        userPoints[msg.sender] = newPoints;
        
        // 记录用户押注
        userBets[matchId][msg.sender] = UserBet({
            betDirection: betDirection,
            betAmount: betCount,
            hasSettled: false,
            isDecrypted: false
        });
        
        // 更新比赛押注统计
        MatchBets storage matchBet = matchBets[matchId];
        
        // 根据押注方向更新对应统计
        // 使用FHE.select来条件性地添加押注
        ebool isHomeWin = FHE.eq(betDirection, FHE.asEuint8(1));
        ebool isAwayWin = FHE.eq(betDirection, FHE.asEuint8(2));
        ebool isDraw = FHE.eq(betDirection, FHE.asEuint8(3));
        
        euint32 homeWinAddition = FHE.select(isHomeWin, betCount, FHE.asEuint32(0));
        euint32 awayWinAddition = FHE.select(isAwayWin, betCount, FHE.asEuint32(0));
        euint32 drawAddition = FHE.select(isDraw, betCount, FHE.asEuint32(0));
        
        matchBet.homeWinTotal = FHE.add(matchBet.homeWinTotal, homeWinAddition);
        matchBet.awayWinTotal = FHE.add(matchBet.awayWinTotal, awayWinAddition);
        matchBet.drawTotal = FHE.add(matchBet.drawTotal, drawAddition);
        matchBet.totalBetAmount = FHE.add(matchBet.totalBetAmount, totalBetAmount);
        
        // 设置ACL权限
        FHE.allowThis(userPoints[msg.sender]);
        FHE.allow(userPoints[msg.sender], msg.sender);
        
        FHE.allowThis(userBets[matchId][msg.sender].betDirection);
        FHE.allow(userBets[matchId][msg.sender].betDirection, msg.sender);
        FHE.allowThis(userBets[matchId][msg.sender].betAmount);
        FHE.allow(userBets[matchId][msg.sender].betAmount, msg.sender);
        
        FHE.allowThis(matchBet.homeWinTotal);
        FHE.allowThis(matchBet.awayWinTotal);
        FHE.allowThis(matchBet.drawTotal);
        FHE.allowThis(matchBet.totalBetAmount);
        
        emit BetPlaced(matchId, msg.sender);
    }
    
    // 项目方结束押注并输入比赛结果
    function finishMatch(uint256 matchId, uint8 result) external onlyOwner validMatch(matchId) {
        require(result >= 1 && result <= 3, "Invalid result: 1=home win, 2=away win, 3=draw");
        require(block.timestamp > matches[matchId].bettingEndTime, "Betting period not ended yet");
        require(!matches[matchId].isFinished, "Match already finished");
        
        matches[matchId].result = result;
        matches[matchId].isFinished = true;
        
        emit MatchFinished(matchId, result);
    }
    
    // 请求解密比赛押注统计
    function requestDecryptMatchTotals(uint256 matchId) external onlyOwner validMatch(matchId) {
        require(matches[matchId].isFinished, "Match not finished yet");
        require(!matchBets[matchId].isTotalDecrypted, "Already decrypted");
        
        MatchBets storage matchBet = matchBets[matchId];
        
        // 准备要解密的密文
        bytes32[] memory cts = new bytes32[](4);
        cts[0] = FHE.toBytes32(matchBet.homeWinTotal);
        cts[1] = FHE.toBytes32(matchBet.awayWinTotal);
        cts[2] = FHE.toBytes32(matchBet.drawTotal);
        cts[3] = FHE.toBytes32(matchBet.totalBetAmount);
        
        // 请求解密
        FHE.requestDecryption(cts, this.decryptMatchTotalsCallback.selector);
        
        emit DecryptionRequested(matchId);
    }
    
    // 解密回调函数
    function decryptMatchTotalsCallback(
        uint256 requestId,
        uint32 homeWinTotal,
        uint32 awayWinTotal,
        uint32 drawTotal,
        uint32 totalBetAmount,
        bytes[] memory signatures
    ) public {
        FHE.checkSignatures(requestId, signatures);
        
        // 找到对应的比赛ID（简化实现，实际应该存储requestId到matchId的映射）
        for (uint256 i = 1; i <= matchCounter; i++) {
            if (matches[i].isFinished && !matchBets[i].isTotalDecrypted) {
                matchBets[i].decryptedHomeWinTotal = homeWinTotal;
                matchBets[i].decryptedAwayWinTotal = awayWinTotal;
                matchBets[i].decryptedDrawTotal = drawTotal;
                matchBets[i].decryptedTotalBetAmount = totalBetAmount;
                matchBets[i].isTotalDecrypted = true;
                break;
            }
        }
    }
    
    // 用户结算押注
    function settleBet(uint256 matchId) external validMatch(matchId) {
        require(matches[matchId].isFinished, "Match not finished yet");
        require(matchBets[matchId].isTotalDecrypted, "Match totals not decrypted yet");
        require(FHE.isInitialized(userBets[matchId][msg.sender].betDirection), "No bet found");
        require(!userBets[matchId][msg.sender].hasSettled, "Already settled");
        
        UserBet storage userBet = userBets[matchId][msg.sender];
        
        // 请求解密用户的押注信息
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(userBet.betDirection);
        cts[1] = FHE.toBytes32(userBet.betAmount);
        
        FHE.requestDecryption(cts, this.decryptUserBetCallback.selector);
        
        emit UserDecryptionRequested(matchId, msg.sender);
    }
    
    // 用户押注解密回调函数
    function decryptUserBetCallback(
        uint256 requestId,
        uint8 betDirection,
        uint32 betAmount,
        bytes[] memory signatures
    ) public {
        FHE.checkSignatures(requestId, signatures);
        
        // 简化实现：遍历寻找对应的用户和比赛
        // 实际应该存储requestId到user和matchId的映射
        for (uint256 matchId = 1; matchId <= matchCounter; matchId++) {
            if (matches[matchId].isFinished && matchBets[matchId].isTotalDecrypted) {
                for (uint256 i = 0; i < 10; i++) { // 简化实现，实际应该有更好的方法
                    address user = address(uint160(i)); // 这里需要实际的用户地址映射
                    UserBet storage userBet = userBets[matchId][user];
                    
                    if (FHE.isInitialized(userBet.betDirection) && !userBet.hasSettled && !userBet.isDecrypted) {
                        // 检查是否获胜
                        uint8 matchResult = matches[matchId].result;
                        if (betDirection == matchResult) {
                            // 计算奖励
                            uint32 winningPool;
                            uint32 totalWinners;
                            
                            if (matchResult == 1) { // 主场赢
                                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                                totalWinners = matchBets[matchId].decryptedHomeWinTotal;
                            } else if (matchResult == 2) { // 客场赢
                                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                                totalWinners = matchBets[matchId].decryptedAwayWinTotal;
                            } else { // 平局
                                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                                totalWinners = matchBets[matchId].decryptedDrawTotal;
                            }
                            
                            if (totalWinners > 0) {
                                uint32 userWinAmount = (winningPool * betAmount) / totalWinners;
                                
                                // 增加用户积分
                                euint32 currentPoints = userPoints[user];
                                if (!FHE.isInitialized(currentPoints)) {
                                    currentPoints = FHE.asEuint32(0);
                                }
                                
                                euint32 newPoints = FHE.add(currentPoints, userWinAmount);
                                userPoints[user] = newPoints;
                                
                                // 设置ACL权限
                                FHE.allowThis(userPoints[user]);
                                FHE.allow(userPoints[user], user);
                                
                                emit BetSettled(matchId, user, userWinAmount);
                            }
                        }
                        
                        userBet.hasSettled = true;
                        userBet.isDecrypted = true;
                        break;
                    }
                }
            }
        }
    }
    
    // 查看用户积分
    function getUserPoints(address user) external view returns (euint32) {
        return userPoints[user];
    }
    
    // 查看比赛信息
    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
    
    // 查看比赛押注统计
    function getMatchBets(uint256 matchId) external view returns (MatchBets memory) {
        return matchBets[matchId];
    }
    
    // 查看用户在特定比赛的押注
    function getUserBet(uint256 matchId, address user) external view returns (UserBet memory) {
        return userBets[matchId][user];
    }
    
    // 提取合约余额（仅owner）
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}