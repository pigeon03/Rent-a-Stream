// src/app/paywall/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import SubscriptionNFTAbi from '../../abis/SubscriptionNFT.json';

export default function PaywallPage() {
  const router = useRouter();
  const CONTRACT = process.env.NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS!;
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If they have already connected, pick up the address
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: 'eth_accounts' })
      .then((a: string[]) => {
        if (a.length) setAddress(a[0]);
      });
  }, []);

  // Ask MetaMask to connect
  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('Please install MetaMask');
      return;
    }
    try {
      const [acct]: string[] = await eth.request({ method: 'eth_requestAccounts' });
      setAddress(acct);
    } catch {
      alert('Connection failed');
    }
  }

  // Mint a 1/2/3-month subscription
  async function mint(months: 1 | 2 | 3) {
    if (!address) {
      alert('Connect your wallet first');
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, signer);

      const seconds = months * 30 * 24 * 60 * 60;
      const tx = await contract.mintSubscription(seconds, {
        value: ethers.parseEther((0.01 * months).toString())
      });
      await tx.wait();

      // After minting, send them to /premium
      router.replace('/premium');
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || 'Mint failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, textAlign: 'center' }}>
      <h1>🎉 Subscribe</h1>
      {!address ? (
        <button
          onClick={connect}
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
      ) : (
        <>
          <p>Connected: {address}</p>
          <p>Select your plan:</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            {[1, 2, 3].map((m) => (
              <button
                key={m}
                onClick={() => mint(m as 1 | 2 | 3)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#4F46E5',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing…' : `${m} month${m > 1 ? 's' : ''} — ${0.01 * m} ETH`}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
