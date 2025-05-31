// src/app/page.tsx
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import SubscriptionNFTAbi from '../abis/SubscriptionNFT.json';

export default function HomePage() {
  const [address, setAddress] = useState<string | null>(null);
  const router = useRouter();
  const CONTRACT = process.env.NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS!;

  async function connectAndCheck() {
    try {
      const eth = (window as any).ethereum;
      if (!eth) throw new Error('Please install MetaMask');
      // 1) ask MetaMask to connect
      const [acct]: string[] = await eth.request({ method: 'eth_requestAccounts' });
      setAddress(acct);

      const provider = new ethers.BrowserProvider(eth);
      const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, provider);

      // 2) how many tokens have ever been minted?
      const totalBn = await contract.nextTokenId();
      const total = typeof totalBn.toNumber === 'function'
        ? totalBn.toNumber()
        : Number(totalBn);

      const nowEpoch = Math.floor(Date.now() / 1000);

      // 3) loop through each token ID
      for (let id = 0; id < total; id++) {
        // 3a) check if caller is the OWNER of an active subscription
        const onchainOwner: string = await contract.ownerOf(id);
        if (onchainOwner.toLowerCase() === acct.toLowerCase()) {
          const isStillValid: boolean = await contract.isValid(id);
          if (isStillValid) {
            // owner’s subscription is still active → go to /premium
            return router.replace('/premium');
          }
        }

        // 3b) check if caller is currently the “user” (renter) AND not expired
        const userAddress: string = await contract.userOf(id);
        if (userAddress.toLowerCase() === acct.toLowerCase()) {
          const expiresBn = await contract.userExpires(id);
          const expiresEpoch =
            typeof expiresBn.toNumber === 'function'
              ? expiresBn.toNumber()
              : Number(expiresBn);
          if (expiresEpoch > nowEpoch) {
            // renter slot is still active → go to /premium
            return router.replace('/premium');
          }
        }
      }

      // 4) if we reach here, neither owner nor renter slot is valid → push /paywall
      router.replace('/paywall');
    } catch (err: any) {
      alert(err.message || 'Connection or on-chain check failed');
    }
  }

  return (
    <main style={{ padding: 20, textAlign: 'center' }}>
      <h1>Demo Web3 Subscription</h1>
      {address ? (
        <p>Connected as {address}</p>
      ) : (
        <button
          onClick={connectAndCheck}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#4F46E5',
            color: '#FFF',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Connect Wallet
        </button>
      )}
    </main>
  );
}
