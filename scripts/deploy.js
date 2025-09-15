const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying FootballBetting contract...");

  const FootballBetting = await ethers.getContractFactory("FootballBetting");
  const footballBetting = await FootballBetting.deploy();

  await footballBetting.waitForDeployment();

  console.log("FootballBetting deployed to:", await footballBetting.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });