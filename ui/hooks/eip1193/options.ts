import WalletLink from 'walletlink';
import WalletConnectProvider from '@walletconnect/web3-provider';

export const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.INFURA_ID,
    },
  },
  walletlink: {
    package: WalletLink,
    options: {
      appName: 'Defi template',
      infuraId: process.env.INFURA_ID,
      rpc: '',
      // chainId: 4,
      chainId: 31337,
      appLogoUrl: null,
      darkMode: true,
    },
  },
};
