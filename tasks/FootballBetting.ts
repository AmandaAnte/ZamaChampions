import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { fhevm } from "hardhat";
import { toHex } from "viem";

task("football:deploy", "Deploy FootballBetting contract").setAction(
  async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying FootballBetting contract...");
    const deployed = await deploy("FootballBetting", {
      from: deployer,
      log: true,
      autoMine: true,
    });

    console.log(`FootballBetting contract deployed at: ${deployed.address}`);
    return deployed.address;
  }
);

task("football:buy-points", "Buy FootPoints with ETH")
  .addParam("contract", "Contract address")
  .addParam("amount", "ETH amount to spend (in ether)")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Buying FootPoints with ${taskArguments.amount} ETH...`);
    
    const tx = await contract.connect(signer).buyPoints({
      value: ethers.parseEther(taskArguments.amount),
    });
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`Points purchased: ${parseFloat(taskArguments.amount) * 100000} FootPoints`);
  });

task("football:create-match", "Create a new football match")
  .addParam("contract", "Contract address")
  .addParam("home", "Home team name")
  .addParam("away", "Away team name") 
  .addParam("name", "Match name")
  .addParam("starttime", "Betting start time (unix timestamp)")
  .addParam("endtime", "Betting end time (unix timestamp)")
  .addParam("matchtime", "Match time (unix timestamp)")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log("Creating new match...");
    console.log(`Home: ${taskArguments.home}`);
    console.log(`Away: ${taskArguments.away}`);
    console.log(`Name: ${taskArguments.name}`);
    
    const tx = await contract.connect(signer).createMatch(
      taskArguments.home,
      taskArguments.away, 
      taskArguments.name,
      taskArguments.starttime,
      taskArguments.endtime,
      taskArguments.matchtime
    );
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Match created successfully!");
  });

task("football:place-bet", "Place a bet on a match")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .addParam("direction", "Bet direction: 1=home win, 2=away win, 3=draw")
  .addParam("amount", "Number of bets to place")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    // Create encrypted input
    const input = fhevm.createEncryptedInput(taskArguments.contract, signer.address);
    input.add8(parseInt(taskArguments.direction));  // bet direction
    input.add32(parseInt(taskArguments.amount));     // bet amount
    const encryptedInput = await input.encrypt();

    console.log(`Placing bet on match ${taskArguments.matchid}...`);
    console.log(`Direction: ${taskArguments.direction} (1=home win, 2=away win, 3=draw)`);
    console.log(`Amount: ${taskArguments.amount} bets (${parseInt(taskArguments.amount) * 100} FootPoints)`);
    
    const tx = await contract.connect(signer).placeBet(
      taskArguments.matchid,
      encryptedInput.handles[0], // betDirection
      encryptedInput.handles[1], // betAmount
      encryptedInput.inputProof
    );
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Bet placed successfully!");
  });

task("football:finish-match", "Finish a match and set result")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .addParam("result", "Match result: 1=home win, 2=away win, 3=draw")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Finishing match ${taskArguments.matchid} with result ${taskArguments.result}...`);
    
    const tx = await contract.connect(signer).finishMatch(
      taskArguments.matchid,
      taskArguments.result
    );
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Match finished successfully!");
  });

task("football:decrypt-totals", "Request decryption of match betting totals")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Requesting decryption for match ${taskArguments.matchid} betting totals...`);
    
    const tx = await contract.connect(signer).requestDecryptMatchTotals(taskArguments.matchid);
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Decryption requested successfully!");
    console.log("Wait for the decryption callback to complete before settling bets.");
  });

task("football:settle-bet", "Settle user bet for a finished match")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Settling bet for match ${taskArguments.matchid}...`);
    
    const tx = await contract.connect(signer).settleBet(taskArguments.matchid);
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Bet settlement requested successfully!");
    console.log("Wait for the decryption callback to complete to receive winnings.");
  });

task("football:get-points", "Get user FootPoints balance")
  .addParam("contract", "Contract address")
  .addParam("user", "User address (optional, defaults to first signer)", undefined, undefined, true)
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    const userAddress = taskArguments.user || signer.address;
    console.log(`Getting FootPoints balance for ${userAddress}...`);
    
    const encryptedPoints = await contract.getUserPoints(userAddress);
    console.log(`Encrypted balance handle: ${encryptedPoints}`);
    
    // To decrypt, user needs to call decryption separately using relayer SDK
    console.log("To decrypt this balance, use the relayer SDK or fhevm tools.");
  });

task("football:get-match", "Get match information")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Getting match ${taskArguments.matchid} information...`);
    
    const match = await contract.getMatch(taskArguments.matchid);
    
    console.log("Match Information:");
    console.log(`- ID: ${match.id}`);
    console.log(`- Home Team: ${match.homeTeam}`);
    console.log(`- Away Team: ${match.awayTeam}`);
    console.log(`- Match Name: ${match.matchName}`);
    console.log(`- Betting Start: ${new Date(Number(match.bettingStartTime) * 1000).toISOString()}`);
    console.log(`- Betting End: ${new Date(Number(match.bettingEndTime) * 1000).toISOString()}`);
    console.log(`- Match Time: ${new Date(Number(match.matchTime) * 1000).toISOString()}`);
    console.log(`- Is Active: ${match.isActive}`);
    console.log(`- Is Finished: ${match.isFinished}`);
    console.log(`- Result: ${match.result} (1=home win, 2=away win, 3=draw, 0=not finished)`);
    console.log(`- Result Decrypted: ${match.isResultDecrypted}`);
  });

task("football:get-match-bets", "Get match betting statistics")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log(`Getting match ${taskArguments.matchid} betting statistics...`);
    
    const matchBets = await contract.getMatchBets(taskArguments.matchid);
    
    console.log("Match Betting Statistics:");
    console.log(`- Home Win Total (encrypted): ${matchBets.homeWinTotal}`);
    console.log(`- Away Win Total (encrypted): ${matchBets.awayWinTotal}`);
    console.log(`- Draw Total (encrypted): ${matchBets.drawTotal}`);
    console.log(`- Total Bet Amount (encrypted): ${matchBets.totalBetAmount}`);
    console.log(`- Is Decrypted: ${matchBets.isTotalDecrypted}`);
    
    if (matchBets.isTotalDecrypted) {
      console.log("Decrypted Values:");
      console.log(`- Home Win Total: ${matchBets.decryptedHomeWinTotal}`);
      console.log(`- Away Win Total: ${matchBets.decryptedAwayWinTotal}`);
      console.log(`- Draw Total: ${matchBets.decryptedDrawTotal}`);
      console.log(`- Total Bet Amount: ${matchBets.decryptedTotalBetAmount}`);
    }
  });

task("football:get-user-bet", "Get user bet information for a match")
  .addParam("contract", "Contract address")
  .addParam("matchid", "Match ID")
  .addParam("user", "User address (optional, defaults to first signer)", undefined, undefined, true)
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    const userAddress = taskArguments.user || signer.address;
    console.log(`Getting user bet for ${userAddress} on match ${taskArguments.matchid}...`);
    
    const userBet = await contract.getUserBet(taskArguments.matchid, userAddress);
    
    console.log("User Bet Information:");
    console.log(`- Bet Direction (encrypted): ${userBet.betDirection}`);
    console.log(`- Bet Amount (encrypted): ${userBet.betAmount}`);
    console.log(`- Has Settled: ${userBet.hasSettled}`);
    console.log(`- Is Decrypted: ${userBet.isDecrypted}`);
  });

task("football:withdraw", "Withdraw contract balance (owner only)")
  .addParam("contract", "Contract address")
  .setAction(async function (taskArguments: any, hre: HardhatRuntimeEnvironment) {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const contractFactory = await ethers.getContractFactory("FootballBetting");
    const contract = contractFactory.attach(taskArguments.contract);

    console.log("Withdrawing contract balance...");
    
    const tx = await contract.connect(signer).withdraw();
    
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Withdrawal completed successfully!");
  });