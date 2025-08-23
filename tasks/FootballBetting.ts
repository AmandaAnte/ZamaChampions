import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:deployFootballBetting")
  .setDescription("Deploy the FootballBetting contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { deploy } = deployments;
    const { deployer } = await ethers.getNamedSigners();
    
    console.log("Deploying FootballBetting with deployer:", deployer.address);
    
    const footballBetting = await deploy("FootballBetting", {
      from: deployer.address,
      log: true,
    });
    
    console.log("FootballBetting deployed to:", footballBetting.address);
  });

task("task:createGame", "Create a new game")
  .addParam("contract", "The contract address")
  .addParam("home", "Home team name")
  .addParam("away", "Away team name")
  .addParam("starttime", "Start time (unix timestamp)")
  .setAction(async (taskArgs, { ethers }) => {
    const [deployer] = await ethers.getSigners();
    const footballBetting = await ethers.getContractAt("FootballBetting", taskArgs.contract);
    
    const tx = await footballBetting.connect(deployer).createGame(
      taskArgs.home,
      taskArgs.away,
      parseInt(taskArgs.starttime)
    );
    
    await tx.wait();
    console.log(`Game created: ${taskArgs.home} vs ${taskArgs.away}`);
  });

task("task:depositETH", "Deposit ETH for FootPoints")
  .addParam("contract", "The contract address")
  .addParam("amount", "Amount of ETH to deposit")
  .setAction(async (taskArgs, { ethers }) => {
    const [deployer] = await ethers.getSigners();
    const footballBetting = await ethers.getContractAt("FootballBetting", taskArgs.contract);
    
    const tx = await footballBetting.connect(deployer).depositETHForPoints({
      value: ethers.parseEther(taskArgs.amount)
    });
    
    await tx.wait();
    console.log(`Deposited ${taskArgs.amount} ETH for FootPoints`);
  });

task("task:closeBetting", "Close betting for a game")
  .addParam("contract", "The contract address")
  .addParam("gameid", "Game ID")
  .setAction(async (taskArgs, { ethers }) => {
    const [deployer] = await ethers.getSigners();
    const footballBetting = await ethers.getContractAt("FootballBetting", taskArgs.contract);
    
    const tx = await footballBetting.connect(deployer).closeBetting(parseInt(taskArgs.gameid));
    
    await tx.wait();
    console.log(`Closed betting for game ${taskArgs.gameid}`);
  });

task("task:settleGame", "Settle a game with result")
  .addParam("contract", "The contract address")
  .addParam("gameid", "Game ID")
  .addParam("result", "Game result (0=HOME_WIN, 1=AWAY_WIN, 2=DRAW)")
  .setAction(async (taskArgs, { ethers }) => {
    const [deployer] = await ethers.getSigners();
    const footballBetting = await ethers.getContractAt("FootballBetting", taskArgs.contract);
    
    const tx = await footballBetting.connect(deployer).settleGame(
      parseInt(taskArgs.gameid),
      parseInt(taskArgs.result)
    );
    
    await tx.wait();
    console.log(`Settled game ${taskArgs.gameid} with result ${taskArgs.result}`);
  });