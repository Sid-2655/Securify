import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/contractAbi.json';

// Contract address on localhost
const CONTRACT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

const Web3Context = createContext(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    return false;
  }, []);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!checkMetaMask()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider using Ethers.js v6 BrowserProvider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Get network and switch to localhost if needed
      const network = await browserProvider.getNetwork();
      const localhostChainId = BigInt(1337);
      
      if (network.chainId !== localhostChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }], // 1337 in hex
          });
        } catch (switchError) {
          // If chain doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x539',
                chainName: 'Localhost 8547',
                rpcUrls: ['http://127.0.0.1:8547'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      setProvider(browserProvider);

      // Get signer
      const browserSigner = await browserProvider.getSigner();
      setSigner(browserSigner);

      // Get account address
      const address = await browserSigner.getAddress();
      setAccount(address);

      // Get network again after potential switch
      const updatedNetwork = await browserProvider.getNetwork();
      setChainId(Number(updatedNetwork.chainId));

      // Initialize contract
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        browserSigner
      );
      setContract(contractInstance);

      setIsConnected(true);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [checkMetaMask]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    setIsConnected(false);
    setChainId(null);
    setError(null);
  }, []);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        // Account changed, reconnect
        await connectWallet();
      }
    };

    const handleChainChanged = async (chainId) => {
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, connectWallet, disconnectWallet]);

  // Auto-connect if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!checkMetaMask()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0 && !isConnected) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, [checkMetaMask, isConnected, connectWallet]);

  // Helper function to send transactions with loading state
  const sendTransaction = useCallback(async (txFunction, ...args) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Contract not initialized');
      }

      // Execute transaction (gas limit should be passed in options if needed)
      const tx = await txFunction(...args);
      const receipt = await tx.wait();

      return receipt;
    } catch (err) {
      console.error('Transaction error:', err);
      console.error('Error data:', err.data);
      console.error('Error reason:', err.reason);
      console.error('Error code:', err.code);
      console.error('Full error:', err);
      setError(err.reason || err.message || 'Transaction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Helper function to call view functions
  const callContract = useCallback(async (functionName, ...args) => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      return await contract[functionName](...args);
    } catch (err) {
      console.error('Contract call error:', err);
      setError(err.message || 'Contract call failed');
      throw err;
    }
  }, [contract]);

  const value = {
    // State
    provider,
    signer,
    account,
    contract,
    isConnected,
    isLoading,
    error,
    chainId,

    // Methods
    connectWallet,
    disconnectWallet,
    sendTransaction,
    callContract,
    checkMetaMask,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Context;
