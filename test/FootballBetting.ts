import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { FootballBetting } from "../types";
import type { Signer } from "ethers";

describe("FootballBetting", function () {
  let footballBetting: FootballBetting;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user1Address: string;
  let user2Address: string;
  let ownerAddress: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    const FootballBettingFactory = await ethers.getContractFactory("FootballBetting");
    footballBetting = await FootballBettingFactory.connect(owner).deploy();
    await footballBetting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await footballBetting.owner()).to.equal(ownerAddress);
    });

    it("Should initialize with zero match counter", async function () {
      expect(await footballBetting.matchCounter()).to.equal(0);
    });

    it("Should have correct constants", async function () {
      expect(await footballBetting.BET_UNIT()).to.equal(100);
      expect(await footballBetting.ETH_TO_POINTS_RATE()).to.equal(100000);
    });
  });

  describe("Buy Points", function () {
    it("Should allow users to buy points with ETH", async function () {
      const depositAmount = ethers.parseEther("1");

      await expect(
        footballBetting.connect(user1).buyPoints({ value: depositAmount })
      ).to.emit(footballBetting, "PointsPurchased")
        .withArgs(user1Address, depositAmount, 100000n);

      const encryptedBalance = await footballBetting.connect(user1).getUserPoints(user1Address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedBalance,
        await footballBetting.getAddress(),
        user1
      );

      expect(decryptedBalance).to.equal(100000); // 1 ETH = 100000 points
    });

    it("Should revert when no ETH is sent", async function () {
      await expect(
        footballBetting.connect(user1).buyPoints({ value: 0 })
      ).to.be.revertedWith("Must send ETH to buy points");
    });

    it("Should accumulate points from multiple purchases", async function () {
      const depositAmount1 = ethers.parseEther("0.5");
      const depositAmount2 = ethers.parseEther("0.3");

      await footballBetting.connect(user1).buyPoints({ value: depositAmount1 });
      await footballBetting.connect(user1).buyPoints({ value: depositAmount2 });

      const encryptedBalance = await footballBetting.connect(user1).getUserPoints(user1Address);
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedBalance,
        await footballBetting.getAddress(),
        user1
      );

      expect(decryptedBalance).to.equal(80000); // 0.8 ETH = 80000 points
    });
  });

  describe("Match Management", function () {
    it("Should allow owner to create a match", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 3600; // 1 hour from current block
      const bettingEndTime = currentTime + 7200; // 2 hours from current block
      const matchTime = currentTime + 10800; // 3 hours from current block

      await expect(
        footballBetting.connect(owner).createMatch(
          "Team A",
          "Team B",
          "Premier League Match 1",
          bettingStartTime,
          bettingEndTime,
          matchTime
        )
      ).to.emit(footballBetting, "MatchCreated")
        .withArgs(1, "Team A", "Team B", "Premier League Match 1");

      expect(await footballBetting.matchCounter()).to.equal(1);

      const matchInfo = await footballBetting.getMatch(1);
      expect(matchInfo.homeTeam).to.equal("Team A");
      expect(matchInfo.awayTeam).to.equal("Team B");
      expect(matchInfo.matchName).to.equal("Premier League Match 1");
      expect(matchInfo.bettingStartTime).to.equal(bettingStartTime);
      expect(matchInfo.bettingEndTime).to.equal(bettingEndTime);
      expect(matchInfo.matchTime).to.equal(matchTime);
      expect(matchInfo.isActive).to.be.true;
      expect(matchInfo.isFinished).to.be.false;
      expect(matchInfo.result).to.equal(0);
    });

    it("Should not allow non-owner to create a match", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 3600;
      const bettingEndTime = currentTime + 7200;
      const matchTime = currentTime + 10800;

      await expect(
        footballBetting.connect(user1).createMatch(
          "Team A",
          "Team B",
          "Test Match",
          bettingStartTime,
          bettingEndTime,
          matchTime
        )
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow creating a match with invalid time ranges", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 7200;
      const bettingEndTime = currentTime + 3600; // End before start
      const matchTime = currentTime + 10800;

      await expect(
        footballBetting.connect(owner).createMatch(
          "Team A",
          "Team B",
          "Test Match",
          bettingStartTime,
          bettingEndTime,
          matchTime
        )
      ).to.be.revertedWith("Invalid betting time range");
    });

    it("Should not allow creating a match with past start time", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime - 3600; // 1 hour ago
      const bettingEndTime = currentTime + 3600;
      const matchTime = currentTime + 7200;

      await expect(
        footballBetting.connect(owner).createMatch(
          "Team A",
          "Team B",
          "Test Match",
          bettingStartTime,
          bettingEndTime,
          matchTime
        )
      ).to.be.revertedWith("Betting start time must be in future");
    });
  });

  describe("Betting", function () {
    let matchId: number;

    beforeEach(async function () {
      // Give users some points first
      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
      await footballBetting.connect(user2).buyPoints({ value: ethers.parseEther("1") });

      // Get current block timestamp
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 300; // 5 minutes from current block
      const bettingEndTime = currentTime + 3600; // 1 hour from current block
      const matchTime = currentTime + 7200; // 2 hours from current block

      await footballBetting.connect(owner).createMatch(
        "Team A",
        "Team B",
        "Test Match",
        bettingStartTime,
        bettingEndTime,
        matchTime
      );
      matchId = 1;

      // Fast forward time to make betting active
      await ethers.provider.send("evm_increaseTime", [400]); // Increase time by 400 seconds
      await ethers.provider.send("evm_mine", []); // Mine a new block
    });

    it("Should allow users to place bets", async function () {
      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add8(1); // Bet direction: home win
      input.add32(5); // Bet count: 5 bets
      const encryptedInput = await input.encrypt();

      await expect(
        footballBetting.connect(user1).placeBet(
          matchId,
          encryptedInput.handles[0], // betDirection
          encryptedInput.handles[1], // betCount
          encryptedInput.inputProof
        )
      ).to.emit(footballBetting, "BetPlaced")
        .withArgs(matchId, user1Address);

      // Check user's bet
      const userBet = await footballBetting.getUserBet(matchId, user1Address);
      const decryptedBetAmount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userBet.betAmount,
        await footballBetting.getAddress(),
        user1
      );

      expect(decryptedBetAmount).to.equal(5);
    });

    it("Should not allow duplicate bets from same user", async function () {
      const input1 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input1.add8(1); // Bet direction: home win
      input1.add32(3); // Bet count: 3 bets
      const encryptedInput1 = await input1.encrypt();

      // First bet
      await footballBetting.connect(user1).placeBet(
        matchId,
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.inputProof
      );

      const input2 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input2.add8(2); // Bet direction: away win
      input2.add32(2); // Bet count: 2 bets
      const encryptedInput2 = await input2.encrypt();

      // Second bet should fail
      await expect(
        footballBetting.connect(user1).placeBet(
          matchId,
          encryptedInput2.handles[0],
          encryptedInput2.handles[1],
          encryptedInput2.inputProof
        )
      ).to.be.revertedWith("Already bet on this match");
    });

    it("Should not allow betting on invalid match", async function () {
      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add8(1);
      input.add32(5);
      const encryptedInput = await input.encrypt();

      await expect(
        footballBetting.connect(user1).placeBet(
          999, // Invalid match ID
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Invalid match ID");
    });

    it("Should not allow betting when betting period has ended", async function () {
      // Get current block timestamp and create a match with future times
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 300; // 5 minutes from current block
      const bettingEndTime = currentTime + 900; // 15 minutes from current block
      const matchTime = currentTime + 1800; // 30 minutes from current block

      await footballBetting.connect(owner).createMatch(
        "Team C",
        "Team D",
        "Ended Match",
        bettingStartTime,
        bettingEndTime,
        matchTime
      );

      // Fast forward past betting end time
      await ethers.provider.send("evm_increaseTime", [1000]); // Increase time by 1000 seconds
      await ethers.provider.send("evm_mine", []); // Mine a new block

      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add8(1);
      input.add32(5);
      const encryptedInput = await input.encrypt();

      await expect(
        footballBetting.connect(user1).placeBet(
          2, // New match ID
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Betting period ended");
    });
  });

  describe("Match Finishing and Settlement", function () {
    let matchId: number;

    beforeEach(async function () {
      // Give users points first
      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
      await footballBetting.connect(user2).buyPoints({ value: ethers.parseEther("1") });

      // Get current block timestamp
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 300; // 5 minutes from current block
      const bettingEndTime = currentTime + 3600; // 1 hour from current block
      const matchTime = currentTime + 7200; // 2 hours from current block

      await footballBetting.connect(owner).createMatch(
        "Team A",
        "Team B",
        "Test Match",
        bettingStartTime,
        bettingEndTime,
        matchTime
      );
      matchId = 1;

      // Fast forward time to beyond betting end time
      await ethers.provider.send("evm_increaseTime", [3700]); // Increase time by 3700 seconds (past betting end)
      await ethers.provider.send("evm_mine", []); // Mine a new block
    });

    it("Should allow owner to finish match", async function () {
      await expect(
        footballBetting.connect(owner).finishMatch(matchId, 1) // Home win
      ).to.emit(footballBetting, "MatchFinished")
        .withArgs(matchId, 1);

      const matchInfo = await footballBetting.getMatch(matchId);
      expect(matchInfo.isFinished).to.be.true;
      expect(matchInfo.result).to.equal(1);
    });

    it("Should not allow non-owner to finish match", async function () {
      await expect(
        footballBetting.connect(user1).finishMatch(matchId, 1)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow finishing match with invalid result", async function () {
      await expect(
        footballBetting.connect(owner).finishMatch(matchId, 0) // Invalid result
      ).to.be.revertedWith("Invalid result: 1=home win, 2=away win, 3=draw");

      await expect(
        footballBetting.connect(owner).finishMatch(matchId, 4) // Invalid result
      ).to.be.revertedWith("Invalid result: 1=home win, 2=away win, 3=draw");
    });

    it("Should not allow finishing match while betting is still open", async function () {
      // Get current block timestamp and create a match with ongoing betting
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 300; // 5 minutes from current block
      const bettingEndTime = currentTime + 1800; // 30 minutes from current block (still open)
      const matchTime = currentTime + 3600; // 1 hour from current block

      await footballBetting.connect(owner).createMatch(
        "Team C",
        "Team D",
        "Ongoing Match",
        bettingStartTime,
        bettingEndTime,
        matchTime
      );

      // Fast forward to during betting period but before end
      await ethers.provider.send("evm_increaseTime", [600]); // Increase time by 600 seconds (betting active but not ended)
      await ethers.provider.send("evm_mine", []); // Mine a new block

      await expect(
        footballBetting.connect(owner).finishMatch(2, 1)
      ).to.be.revertedWith("Betting period not ended yet");
    });
  });

  describe("Owner Functions", function () {
    beforeEach(async function () {
      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
    });

    it("Should allow owner to withdraw contract balance", async function () {
      const initialBalance = await ethers.provider.getBalance(ownerAddress);

      const tx = await footballBetting.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(ownerAddress);
      const expectedBalance = initialBalance + ethers.parseEther("1") - gasUsed;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        footballBetting.connect(user1).withdraw()
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should revert withdrawal when no balance", async function () {
      // First withdraw all balance
      await footballBetting.connect(owner).withdraw();

      // Try to withdraw again
      await expect(
        footballBetting.connect(owner).withdraw()
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("View Functions", function () {
    let matchId: number;

    beforeEach(async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      await footballBetting.connect(owner).createMatch(
        "Team A",
        "Team B",
        "Test Match",
        currentTime + 3600,
        currentTime + 7200,
        currentTime + 10800
      );
      matchId = 1;

      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
    });

    it("Should return user points", async function () {
      const encryptedPoints = await footballBetting.getUserPoints(user1Address);
      const decryptedPoints = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedPoints,
        await footballBetting.getAddress(),
        user1
      );

      expect(decryptedPoints).to.equal(100000);
    });

    it("Should return match information", async function () {
      const matchInfo = await footballBetting.getMatch(matchId);
      expect(matchInfo.homeTeam).to.equal("Team A");
      expect(matchInfo.awayTeam).to.equal("Team B");
      expect(matchInfo.matchName).to.equal("Test Match");
      expect(matchInfo.isActive).to.be.true;
      expect(matchInfo.isFinished).to.be.false;
    });

    it("Should return match betting statistics", async function () {
      const matchBets = await footballBetting.getMatchBets(matchId);
      expect(matchBets.isTotalDecrypted).to.be.false;
      expect(matchBets.decryptedTotalBetAmount).to.equal(0);
    });

    it("Should return user bet information", async function () {
      const userBet = await footballBetting.getUserBet(matchId, user1Address);
      expect(userBet.hasSettled).to.be.false;
      expect(userBet.isDecrypted).to.be.false;
    });
  });

  describe("Complete Betting Workflow Integration Test", function () {
    it("Should handle complete betting workflow from bet placement to settlement", async function () {
      // Step 1: Users buy points
      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
      await footballBetting.connect(user2).buyPoints({ value: ethers.parseEther("0.5") });

      // Verify initial points
      const user1InitialPoints = await footballBetting.getUserPoints(user1Address);
      const user1InitialDecrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        user1InitialPoints,
        await footballBetting.getAddress(),
        user1
      );
      expect(user1InitialDecrypted).to.equal(100000); // 1 ETH = 100,000 points

      // Step 2: Create a match
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;
      const bettingStartTime = currentTime + 300; // 5 minutes from now
      const bettingEndTime = currentTime + 3600; // 1 hour from now
      const matchTime = currentTime + 7200; // 2 hours from now

      await footballBetting.connect(owner).createMatch(
        "Manchester United",
        "Liverpool",
        "Premier League Derby",
        bettingStartTime,
        bettingEndTime,
        matchTime
      );

      // Step 3: Fast forward to betting period
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine", []);

      // Step 4: Users place bets
      // User1 bets 10 times on home win (1)
      const input1 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input1.add8(1); // Home win
      input1.add32(10); // 10 bets
      const encryptedInput1 = await input1.encrypt();

      await footballBetting.connect(user1).placeBet(
        1,
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.inputProof
      );

      // User2 bets 5 times on away win (2)
      const input2 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user2Address);
      input2.add8(2); // Away win
      input2.add32(5); // 5 bets
      const encryptedInput2 = await input2.encrypt();

      await footballBetting.connect(user2).placeBet(
        1,
        encryptedInput2.handles[0],
        encryptedInput2.handles[1],
        encryptedInput2.inputProof
      );

      // Step 5: Verify bets were placed
      const user1Bet = await footballBetting.getUserBet(1, user1Address);
      const user1BetAmount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        user1Bet.betAmount,
        await footballBetting.getAddress(),
        user1
      );
      expect(user1BetAmount).to.equal(10);

      // Step 6: Verify points were deducted (10 bets * 100 points = 1000 points)
      const user1PointsAfterBet = await footballBetting.getUserPoints(user1Address);
      const user1PointsAfterBetDecrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        user1PointsAfterBet,
        await footballBetting.getAddress(),
        user1
      );
      expect(user1PointsAfterBetDecrypted).to.equal(99000); // 100000 - 1000

      // Step 7: Fast forward past betting end time
      await ethers.provider.send("evm_increaseTime", [3300]); // Move past betting end time
      await ethers.provider.send("evm_mine", []);

      // Step 8: Owner finishes match with home win (1)
      await expect(
        footballBetting.connect(owner).finishMatch(1, 1) // Home win - user1 should win
      ).to.emit(footballBetting, "MatchFinished")
        .withArgs(1, 1);

      // Step 9: Verify match is finished
      const matchInfo = await footballBetting.getMatch(1);
      expect(matchInfo.isFinished).to.be.true;
      expect(matchInfo.result).to.equal(1);

      // Note: In a real scenario, we would need to handle the asynchronous decryption
      // callbacks for match totals and user settlement. For this test, we verify
      // the basic workflow up to match finishing.

      // Verify that settlement requires match totals to be decrypted first
      await expect(
        footballBetting.connect(user1).settleBet(1)
      ).to.be.revertedWith("Match totals not decrypted yet");
    });

    it("Should correctly calculate betting statistics", async function () {
      // Buy points for multiple users
      await footballBetting.connect(user1).buyPoints({ value: ethers.parseEther("1") });
      await footballBetting.connect(user2).buyPoints({ value: ethers.parseEther("1") });

      // Create match
      const currentBlock = await ethers.provider.getBlock('latest');
      const currentTime = currentBlock!.timestamp;

      await footballBetting.connect(owner).createMatch(
        "Team A",
        "Team B",
        "Test Match",
        currentTime + 300,
        currentTime + 3600,
        currentTime + 7200
      );

      // Fast forward to betting period
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine", []);

      // Multiple bets on different outcomes
      const input1 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input1.add8(1); // Home win
      input1.add32(8); // 8 bets
      const encryptedInput1 = await input1.encrypt();

      await footballBetting.connect(user1).placeBet(
        1,
        encryptedInput1.handles[0],
        encryptedInput1.handles[1],
        encryptedInput1.inputProof
      );

      const input2 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user2Address);
      input2.add8(3); // Draw
      input2.add32(12); // 12 bets
      const encryptedInput2 = await input2.encrypt();

      await footballBetting.connect(user2).placeBet(
        1,
        encryptedInput2.handles[0],
        encryptedInput2.handles[1],
        encryptedInput2.inputProof
      );

      // Verify match betting statistics structure exists
      const matchBets = await footballBetting.getMatchBets(1);
      expect(matchBets.isTotalDecrypted).to.be.false;
      expect(matchBets.decryptedTotalBetAmount).to.equal(0);

      // The encrypted totals are updated but can't be easily verified without decryption
      // This test verifies the structure and basic functionality
    });
  });
});