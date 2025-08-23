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

    it("Should initialize with zero game counter", async function () {
      expect(await footballBetting.gameCounter()).to.equal(0);
    });
  });

  describe("Deposit ETH for FootPoints", function () {
    it("Should allow users to deposit ETH and receive FootPoints", async function () {
      const depositAmount = ethers.parseEther("1");
      
      await footballBetting.connect(user1).depositETHForPoints({ value: depositAmount });
      
      const encryptedBalance = await footballBetting.connect(user1).getUserFootPoints();
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedBalance,
        await footballBetting.getAddress(),
        user1
      );
      
      expect(decryptedBalance).to.equal(100000); // 1 ETH = 100000 FootPoints
    });

    it("Should revert when no ETH is sent", async function () {
      await expect(
        footballBetting.connect(user1).depositETHForPoints({ value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });

    it("Should accumulate FootPoints from multiple deposits", async function () {
      const depositAmount1 = ethers.parseEther("0.5");
      const depositAmount2 = ethers.parseEther("0.3");
      
      await footballBetting.connect(user1).depositETHForPoints({ value: depositAmount1 });
      await footballBetting.connect(user1).depositETHForPoints({ value: depositAmount2 });
      
      const encryptedBalance = await footballBetting.connect(user1).getUserFootPoints();
      const decryptedBalance = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedBalance,
        await footballBetting.getAddress(),
        user1
      );
      
      expect(decryptedBalance).to.equal(80000); // 0.8 ETH = 80000 FootPoints
    });
  });

  describe("Game Management", function () {
    it("Should allow owner to create a game", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await expect(
        footballBetting.connect(owner).createGame("Team A", "Team B", startTime)
      ).to.emit(footballBetting, "GameCreated")
        .withArgs(0, "Team A", "Team B", startTime);
      
      expect(await footballBetting.gameCounter()).to.equal(1);
      
      const gameInfo = await footballBetting.getGameInfo(0);
      expect(gameInfo.homeTeam).to.equal("Team A");
      expect(gameInfo.awayTeam).to.equal("Team B");
      expect(gameInfo.startTime).to.equal(startTime);
      expect(gameInfo.status).to.equal(0); // BETTING_OPEN
    });

    it("Should not allow non-owner to create a game", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      
      await expect(
        footballBetting.connect(user1).createGame("Team A", "Team B", startTime)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow creating a game with past start time", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(
        footballBetting.connect(owner).createGame("Team A", "Team B", pastTime)
      ).to.be.revertedWith("Start time must be in the future");
    });

    it("Should allow owner to close betting", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      await footballBetting.connect(owner).createGame("Team A", "Team B", startTime);
      
      await expect(
        footballBetting.connect(owner).closeBetting(0)
      ).to.emit(footballBetting, "GameClosed")
        .withArgs(0);
      
      const gameInfo = await footballBetting.getGameInfo(0);
      expect(gameInfo.status).to.equal(1); // BETTING_CLOSED
    });

    it("Should allow owner to settle a game", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      await footballBetting.connect(owner).createGame("Team A", "Team B", startTime);
      await footballBetting.connect(owner).closeBetting(0);
      
      await expect(
        footballBetting.connect(owner).settleGame(0, 0) // HOME_WIN
      ).to.emit(footballBetting, "GameSettled")
        .withArgs(0, 0);
      
      const gameInfo = await footballBetting.getGameInfo(0);
      expect(gameInfo.status).to.equal(2); // SETTLED
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      // Create a game
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      await footballBetting.connect(owner).createGame("Team A", "Team B", startTime);
      
      // Give users some FootPoints
      await footballBetting.connect(user1).depositETHForPoints({ value: ethers.parseEther("1") });
      await footballBetting.connect(user2).depositETHForPoints({ value: ethers.parseEther("1") });
    });

    it("Should allow users to place bets", async function () {
      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add32(5); // Bet 5 times
      const encryptedInput = await input.encrypt();
      
      await expect(
        footballBetting.connect(user1).placeBet(
          0, // gameId
          0, // BetType.HOME_WIN
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.emit(footballBetting, "BetPlaced")
        .withArgs(0, user1Address, 0);
      
      // Check user's bet amount
      const userBets = await footballBetting.getUserBets(0, user1Address);
      const decryptedHomeBets = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userBets[0],
        await footballBetting.getAddress(),
        user1
      );
      
      expect(decryptedHomeBets).to.equal(5);
    });

    it("Should allow multiple bets from same user", async function () {
      const input1 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input1.add32(3); // First bet
      const encryptedInput1 = await input1.encrypt();
      
      const input2 = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input2.add32(2); // Second bet
      const encryptedInput2 = await input2.encrypt();
      
      await footballBetting.connect(user1).placeBet(0, 0, encryptedInput1.handles[0], encryptedInput1.inputProof);
      await footballBetting.connect(user1).placeBet(0, 0, encryptedInput2.handles[0], encryptedInput2.inputProof);
      
      // Check accumulated bet amount
      const userBets = await footballBetting.getUserBets(0, user1Address);
      const decryptedHomeBets = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userBets[0],
        await footballBetting.getAddress(),
        user1
      );
      
      expect(decryptedHomeBets).to.equal(5); // 3 + 2
    });

    it("Should not allow betting on closed games", async function () {
      await footballBetting.connect(owner).closeBetting(0);
      
      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add32(5);
      const encryptedInput = await input.encrypt();
      
      await expect(
        footballBetting.connect(user1).placeBet(
          0,
          0,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Betting is closed");
    });

    it("Should allow users to retrieve their bet information", async function () {
      const input = fhevm.createEncryptedInput(await footballBetting.getAddress(), user1Address);
      input.add32(3); // 3 bets on home win
      const encryptedInput = await input.encrypt();
      
      await footballBetting.connect(user1).placeBet(0, 0, encryptedInput.handles[0], encryptedInput.inputProof);
      
      const userBets = await footballBetting.getUserBets(0, user1Address);
      const decryptedHomeBets = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        userBets[0],
        await footballBetting.getAddress(),
        user1
      );
      
      expect(decryptedHomeBets).to.equal(3);
    });
  });

  describe("Owner Functions", function () {
    beforeEach(async function () {
      await footballBetting.connect(user1).depositETHForPoints({ value: ethers.parseEther("1") });
    });

    it("Should allow owner to withdraw ETH", async function () {
      await expect(() =>
        footballBetting.connect(owner).withdrawETH()
      ).to.changeEtherBalance(owner, ethers.parseEther("1"));
    });

    it("Should not allow non-owner to withdraw ETH", async function () {
      await expect(
        footballBetting.connect(user1).withdrawETH()
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});