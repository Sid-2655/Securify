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
  services = {};

  # Defines a script to be run when your workspace starts
  processes = {
    # Installs backend dependencies, runs the blockchain node, and deploys the contract
    node = {
      command = "npm install && npm run node";
    };
    # Waits for the blockchain to be ready and then deploys the contract
    deploy = {
      command = "sleep 10 && npm run deploy";
    };
    # Installs frontend dependencies and starts the dev server
    client = {
      command = "cd client && npm install && npm run dev";
    };
  };
}
