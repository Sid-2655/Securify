{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # Or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_22
  ];
  # Sets environment variables in the workspace
  env = {};
  # Fast way to run sidecar containers in your workspace
  services = {
    # This will expose port 8545 to the web
    hardhat = {
      port = 8545;
      # The command to run to start the service
      command = "npm install && npm run node";
    };
  };

  # Defines a script to be run when your workspace starts
  processes = {
    # Waits for the blockchain to be ready and then deploys the contract
    deploy = {
      command = "sleep 15 && npm run deploy";
    };
    # Installs frontend dependencies and starts the dev server
    client = {
      command = "cd client && npm install && npm run dev";
    };
  };
}