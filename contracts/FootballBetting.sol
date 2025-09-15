// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FootballBetting is SepoliaConfig {
    address public owner;

    // User points mapping (encrypted)
    mapping(address => euint32) private userPoints;

    // Match structure
    struct Match {
        uint256 id;
        string homeTeam;
        string awayTeam;
        string matchName;
        uint256 bettingStartTime;
        uint256 bettingEndTime;
        uint256 matchTime;
        address creator; // Address of the match creator
        bool isActive;
        bool isFinished;
        uint8 result; // 1: home win, 2: away win, 3: draw, 0: not finished
        bool isResultDecrypted;
    }

    // User bet structure
    struct UserBet {
        euint8 betDirection; // Encrypted bet direction: 1: home win, 2: away win, 3: draw
        euint32 betAmount; // Encrypted bet amount
        bool hasSettled; // Whether settled
        bool isDecrypted; // Whether decrypted
    }

    // Match betting statistics
    struct MatchBets {
        euint32 homeWinTotal; // Total bets for home win
        euint32 awayWinTotal; // Total bets for away win
        euint32 drawTotal; // Total bets for draw
        euint32 totalBetAmount; // Total bet points
        bool isTotalDecrypted; // Whether totals are decrypted
        uint32 decryptedHomeWinTotal;
        uint32 decryptedAwayWinTotal;
        uint32 decryptedDrawTotal;
        uint32 decryptedTotalBetAmount;
    }

    // Store all matches
    mapping(uint256 => Match) public matches;
    // Match betting statistics
    mapping(uint256 => MatchBets) public matchBets;
    // User bets for specific matches matchId => user => UserBet
    mapping(uint256 => mapping(address => UserBet)) public userBets;
    // Match counter
    uint256 public matchCounter;

    // Mapping from decryption request ID to match ID (for match totals decryption)
    mapping(uint256 requestId => uint256 matchId) private decryptionRequestToMatch;

    // Mapping from decryption request ID to user bet info (for user bet decryption)
    struct UserBetRequest {
        address user;
        uint256 matchId;
    }
    mapping(uint256 requestId => UserBetRequest) private userBetDecryptionRequests;

    // Constants
    uint256 public constant BET_UNIT = 100; // 100 points per bet
    uint256 public constant ETH_TO_POINTS_RATE = 100000; // 1 ETH = 100000 points

    // Events
    event PointsPurchased(address indexed user, uint256 ethAmount, uint256 pointsAmount);
    event MatchCreated(
        uint256 indexed matchId,
        address indexed creator,
        string homeTeam,
        string awayTeam,
        string matchName
    );
    event BetPlaced(uint256 indexed matchId, address indexed user);
    event MatchFinished(uint256 indexed matchId, uint8 result);
    event BetSettled(uint256 indexed matchId, address indexed user, uint256 winAmount);
    event DecryptionRequested(uint256 indexed matchId);
    event UserDecryptionRequested(uint256 indexed matchId, address indexed user);
    event MatchTotalsDecrypted(
        uint256 indexed matchId,
        uint32 homeWinTotal,
        uint32 awayWinTotal,
        uint32 drawTotal,
        uint32 totalBetAmount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMatchCreator(uint256 matchId) {
        require(msg.sender == matches[matchId].creator, "Only match creator can call this function");
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

    // Buy points with ETH
    function buyPoints() external payable {
        require(msg.value > 0, "Must send ETH to buy points");

        uint256 pointsToAdd = (msg.value * ETH_TO_POINTS_RATE) / 1 ether;
        require(pointsToAdd <= type(uint32).max, "Points amount too large");

        euint32 currentPoints = userPoints[msg.sender];
        if (!FHE.isInitialized(currentPoints)) {
            currentPoints = FHE.asEuint32(0);
        }

        euint32 newPoints = FHE.add(currentPoints, uint32(pointsToAdd));
        userPoints[msg.sender] = newPoints;

        // Set ACL permissions
        FHE.allowThis(userPoints[msg.sender]);
        FHE.allow(userPoints[msg.sender], msg.sender);

        emit PointsPurchased(msg.sender, msg.value, pointsToAdd);
    }

    // Create match
    function createMatch(
        string memory homeTeam,
        string memory awayTeam,
        string memory matchName,
        uint256 bettingStartTime,
        uint256 bettingEndTime,
        uint256 matchTime
    ) external {
        require(bettingStartTime < bettingEndTime, "Invalid betting time range");
        // require(bettingEndTime < matchTime, "Match time must be after betting end time");
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
            creator: msg.sender,
            isActive: true,
            isFinished: false,
            result: 0,
            isResultDecrypted: false
        });

        // Initialize match betting statistics
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

        // Set ACL permissions
        FHE.allowThis(matchBets[matchCounter].homeWinTotal);
        FHE.allowThis(matchBets[matchCounter].awayWinTotal);
        FHE.allowThis(matchBets[matchCounter].drawTotal);
        FHE.allowThis(matchBets[matchCounter].totalBetAmount);

        emit MatchCreated(matchCounter, msg.sender, homeTeam, awayTeam, matchName);
    }

    // User place bet
    function placeBet(
        uint256 matchId,
        externalEuint8 encryptedBetDirection,
        externalEuint32 encryptedBetCount,
        bytes calldata inputProof
    ) external validMatch(matchId) bettingOpen(matchId) {
        // Validate and convert external encrypted inputs
        euint8 betDirection = FHE.fromExternal(encryptedBetDirection, inputProof);
        euint32 betCount = FHE.fromExternal(encryptedBetCount, inputProof);

        // Check if user has already bet on this match
        require(!FHE.isInitialized(userBets[matchId][msg.sender].betDirection), "Already bet on this match");

        // Calculate total bet amount
        euint32 totalBetAmount = FHE.mul(betCount, uint32(BET_UNIT));

        // Check if user has enough points
        euint32 currentPoints = userPoints[msg.sender];
        require(FHE.isInitialized(currentPoints), "No points available");

        ebool hasEnoughPoints = FHE.ge(currentPoints, totalBetAmount);

        // Deduct points
        euint32 newPoints = FHE.select(hasEnoughPoints, FHE.sub(currentPoints, totalBetAmount), currentPoints);
        userPoints[msg.sender] = newPoints;

        // Record user bet
        userBets[matchId][msg.sender] = UserBet({
            betDirection: betDirection,
            betAmount: betCount,
            hasSettled: false,
            isDecrypted: false
        });

        // Update match betting statistics
        MatchBets storage matchBet = matchBets[matchId];

        // Update statistics based on bet direction
        // Use FHE.select to conditionally add bets
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

        // Set ACL permissions
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

    // Match creator finishes match and inputs result
    function finishMatch(uint256 matchId, uint8 result) external onlyMatchCreator(matchId) validMatch(matchId) {
        require(result >= 1 && result <= 3, "Invalid result: 1=home win, 2=away win, 3=draw");
        //for test, owner can finish any time
        // require(block.timestamp > matches[matchId].bettingEndTime, "Betting period not ended yet");
        require(!matches[matchId].isFinished, "Match already finished");

        matches[matchId].result = result;
        matches[matchId].isFinished = true;
        requestDecryptMatchTotals(matchId);
        emit MatchFinished(matchId, result);
    }

    // Request to decrypt match betting totals
    function requestDecryptMatchTotals(uint256 matchId) internal validMatch(matchId) {
        require(matches[matchId].isFinished, "Match not finished yet");
        require(!matchBets[matchId].isTotalDecrypted, "Already decrypted");

        MatchBets storage matchBet = matchBets[matchId];

        // Prepare ciphertexts to decrypt
        bytes32[] memory cts = new bytes32[](4);
        cts[0] = FHE.toBytes32(matchBet.homeWinTotal);
        cts[1] = FHE.toBytes32(matchBet.awayWinTotal);
        cts[2] = FHE.toBytes32(matchBet.drawTotal);
        cts[3] = FHE.toBytes32(matchBet.totalBetAmount);

        // Request decryption and store requestId to matchId mapping
        uint256 requestId = FHE.requestDecryption(cts, this.decryptMatchTotalsCallback.selector);
        decryptionRequestToMatch[requestId] = matchId;

        emit DecryptionRequested(matchId);
    }

    // Decryption callback function - updated to new format
    function decryptMatchTotalsCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public {
        // Verify that the request id is the expected one
        uint256 matchId = decryptionRequestToMatch[requestId];

        // Verify signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode the decrypted values
        (uint32 homeWinTotal, uint32 awayWinTotal, uint32 drawTotal, uint32 totalBetAmount) = abi.decode(
            cleartexts,
            (uint32, uint32, uint32, uint32)
        );

        // // Store decrypted data
        MatchBets storage matchBet = matchBets[matchId];
        matchBet.decryptedHomeWinTotal = homeWinTotal;
        matchBet.decryptedAwayWinTotal = awayWinTotal;
        matchBet.decryptedDrawTotal = drawTotal;
        matchBet.decryptedTotalBetAmount = totalBetAmount;
        matchBet.isTotalDecrypted = true;

        // // Clean up mapping to save gas
        delete decryptionRequestToMatch[requestId];

        // // Emit event
        // emit MatchTotalsDecrypted(matchId, homeWinTotal, awayWinTotal, drawTotal, totalBetAmount);
    }

    // User settle bet
    function settleBet(uint256 matchId) external validMatch(matchId) {
        require(matches[matchId].isFinished, "Match not finished yet");
        require(matchBets[matchId].isTotalDecrypted, "Match totals not decrypted yet");
        require(FHE.isInitialized(userBets[matchId][msg.sender].betDirection), "No bet found");
        require(!userBets[matchId][msg.sender].hasSettled, "Already settled");

        UserBet storage userBet = userBets[matchId][msg.sender];

        // Request to decrypt user bet information
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(userBet.betDirection);
        cts[1] = FHE.toBytes32(userBet.betAmount);

        uint256 requestId = FHE.requestDecryption(cts, this.decryptUserBetCallback.selector);

        // Store requestId to user and matchId mapping
        userBetDecryptionRequests[requestId] = UserBetRequest({user: msg.sender, matchId: matchId});

        emit UserDecryptionRequested(matchId, msg.sender);
    }

    // User bet decryption callback function - updated to new format
    function decryptUserBetCallback(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) public {
        // Get user and match info from mapping
        UserBetRequest memory request = userBetDecryptionRequests[requestId];
        require(request.user != address(0), "Invalid request ID");

        address user = request.user;
        uint256 matchId = request.matchId;

        require(matches[matchId].isFinished, "Match not finished");
        require(matchBets[matchId].isTotalDecrypted, "Match totals not decrypted yet");

        UserBet storage userBet = userBets[matchId][user];
        require(FHE.isInitialized(userBet.betDirection), "No bet found");
        require(!userBet.hasSettled, "Already settled!");
        require(!userBet.isDecrypted, "Already decrypted");

        // Verify signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode the decrypted values
        (uint8 betDirection, uint32 betAmount) = abi.decode(cleartexts, (uint8, uint32));

        // Check if won
        uint8 matchResult = matches[matchId].result;
        if (betDirection == matchResult) {
            // Calculate reward
            uint32 winningPool;
            uint32 totalWinners;

            if (matchResult == 1) {
                // Home win
                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                totalWinners = matchBets[matchId].decryptedHomeWinTotal;
            } else if (matchResult == 2) {
                // Away win
                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                totalWinners = matchBets[matchId].decryptedAwayWinTotal;
            } else {
                // Draw
                winningPool = matchBets[matchId].decryptedTotalBetAmount;
                totalWinners = matchBets[matchId].decryptedDrawTotal;
            }

            if (totalWinners > 0) {
                uint32 userWinAmount = (winningPool * betAmount) / totalWinners;

                // Add user points
                euint32 currentPoints = userPoints[user];
                if (!FHE.isInitialized(currentPoints)) {
                    currentPoints = FHE.asEuint32(0);
                }

                euint32 newPoints = FHE.add(currentPoints, userWinAmount);
                userPoints[user] = newPoints;

                // Set ACL permissions
                FHE.allowThis(userPoints[user]);
                FHE.allow(userPoints[user], user);

                emit BetSettled(matchId, user, userWinAmount);
            }
        }

        // Mark as settled and decrypted
        userBet.hasSettled = true;
        userBet.isDecrypted = true;

        // Clean up mapping to save gas
        delete userBetDecryptionRequests[requestId];
    }

    // View user points
    function getUserPoints(address user) external view returns (euint32) {
        return userPoints[user];
    }

    // View match information
    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    // View match betting statistics
    function getMatchBets(uint256 matchId) external view returns (MatchBets memory) {
        return matchBets[matchId];
    }

    // View user bet for specific match
    function getUserBet(uint256 matchId, address user) external view returns (UserBet memory) {
        return userBets[matchId][user];
    }

    // Withdraw contract balance (owner only)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
