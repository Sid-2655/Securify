const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ECertify contract...");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n && hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    throw new Error("❌ Insufficient balance to deploy contract");
  }

  // Get the contract factory
  const ECertify = await hre.ethers.getContractFactory("ECertify");
  console.log("📦 Contract factory loaded");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const eCertify = await ECertify.deploy();

  // Wait for deployment to complete
  await eCertify.waitForDeployment();

  const contractAddress = await eCertify.getAddress();
  console.log("✅ ECertify deployed to:", contractAddress);

  // Get deployment transaction
  const deploymentTx = eCertify.deploymentTransaction();
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    console.log("📊 Gas used:", receipt.gasUsed.toString());
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contract on block explorer (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    if (deploymentTx) {
      await deploymentTx.wait(5);
    }

    try {
      console.log("🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on block explorer");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  Contract already verified");
      } else {
        console.log("⚠️  Verification failed:", error.message);
      }
    }
  } else {
    console.log("\nℹ️  Skipping verification for local network");
  }

  // Test basic contract functionality
  console.log("\n🧪 Testing basic contract functionality...");
  try {
    // Try to get a profile (should not exist)
    const profile = await eCertify.getProfile(deployer.address);
    if (!profile.exists) {
      console.log("✅ Contract is responding correctly");
    }
  } catch (error) {
    console.log("⚠️  Error testing contract:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("   1. Save the contract address:", contractAddress);
  console.log("   2. Update your frontend configuration with this address");
  console.log("   3. Run tests: npm test");

  return contractAddress;
}

// Execute deployment
main()
  .then((address) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
