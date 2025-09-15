import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("test-contract", "Test contract calls")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contractAddress = "0x66CFeA6126102918B4533Aaad9bf64beea3460A1";

    console.log("Testing contract at:", contractAddress);

    try {
      // Get contract instance
      const FootballBetting = await hre.ethers.getContractAt("FootballBetting", contractAddress);

      // Test matchCounter
      console.log("Getting match counter...");
      const matchCounter = await FootballBetting.matchCounter();
      console.log("Match counter:", matchCounter.toString());

      // Test owner
      console.log("Getting owner...");
      const owner = await FootballBetting.owner();
      console.log("Owner:", owner);

      // If there are matches, test getting match data
      if (matchCounter > 0) {
        console.log("Getting match 1 data...");
        const match1 = await FootballBetting.getMatch(1);
        console.log("Match 1:", match1);
      }

    } catch (error) {
      console.error("Error testing contract:", error);
    }
  });