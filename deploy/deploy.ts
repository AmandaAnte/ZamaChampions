import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFootballBetting = await deploy("FootballBetting", {
    from: deployer,
    log: true,
  });

  console.log(`FootballBetting contract: `, deployedFootballBetting.address);
};
export default func;
func.id = "deploy_footballBetting"; // id required to prevent reexecution
func.tags = ["FootballBetting"];
