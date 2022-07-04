import { useEffect, useCallback, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import detectEthereumProvider from '@metamask/detect-provider';

import { providerOptions } from './options';

let web3Modal;
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'localhost',
    theme: 'dark',
    cacheProvider: true,
    providerOptions,
  });
}

let web3Provider;

export const useChain = () => {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);

  const resetStates = () => {
    web3Provider = null;
    setProvider(null);
    setAddress(null);
    setChainId(null);
  };

  const getDataIfConnected = async () => {
    if (typeof window !== 'undefined') {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          // no accounts, so no connected
          return;
        }
        // this function detects most providers injected at window.ethereum
        const provider = await detectEthereumProvider();
        const provider_inst = new ethers.providers.Web3Provider(provider);
        const signer = provider_inst.getSigner();
        const address = await signer.getAddress();
        const network = await provider_inst.getNetwork();

        web3Provider = provider_inst;
        setProvider(provider);
        setAddress(address);
        setChainId(network.chainId);
      }
    }
  };

  const connect = useCallback(async function () {
    const provider = await web3Modal.connect();
    const provider_inst = new ethers.providers.Web3Provider(provider);
    const signer = provider_inst.getSigner();
    const address = await signer.getAddress();
    const network = await provider_inst.getNetwork();

    web3Provider = provider_inst;
    setProvider(provider);
    setAddress(address);
    setChainId(network.chainId);
  }, []);

  const disconnect = useCallback(
    async function () {
      console.log('disconnect');
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect();
      }
      resetStates();
    },
    [provider]
  );

  useEffect(() => {
    // component did mount - after page refresh
    getDataIfConnected();
  }, []);

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          resetStates();
        }
      };

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId) => {
        window.location.reload();
      };

      const handleDisconnect = (error) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error);
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeAllListeners();
        }
      };
    }
  }, [provider, disconnect]);

  return [{ connect, disconnect, web3Provider, address, chainId }];
};

export const useBalances = (address) => {
  const [ethBalance, setETH] = useState('');

  const handleETHTransfferedEvent = () => {
    getETH();
  };

  useEffect(() => {
    if (web3Provider?.on) {
      getETH();

      web3Provider.on('ethTransffered', handleETHTransfferedEvent);

      return () => {
        if (web3Provider && web3Provider.removeAllListeners) {
          web3Provider.removeAllListeners();
        }
      };
    } else {
      setETH('');
    }
  }, [web3Provider]);

  const getETH = async () => {
    const balance = await web3Provider.getBalance(address);
    const ethBalance = ethers.utils.formatEther(balance);
    setETH(ethBalance);
  };

  const sendEth = async (address, value) => {
    const _value = ethers.utils.parseEther(value);
    const signer = web3Provider.getSigner();
    const tx = await signer.sendTransaction({
      to: address,
      value: _value,
    });

    const transactionReceipt = await tx.wait();
    if (!transactionReceipt) {
      return;
    }
    web3Provider.emit('ethTransffered');
  };

  return [ethBalance, sendEth];
};
