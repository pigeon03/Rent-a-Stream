// src/app/premium/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import SubscriptionNFTAbi from '../../abis/SubscriptionNFT.json';
import Link from 'next/link';

export default function PremiumPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const CONTRACT = process.env.NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS!;

  useEffect(() => {
    async function checkAccess() {
      const eth = (window as any).ethereum;
      if (!eth) {
        router.replace('/');
        return;
      }
      try {
        // 1) connect silently (no popup)
        const accounts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          router.replace('/');
          return;
        }
        const acct = accounts[0];

        const provider = new ethers.BrowserProvider(eth);
        const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, provider);

        // 2) how many tokens have ever been minted?
        const totalBn = await contract.nextTokenId();
        const total = typeof totalBn.toNumber === 'function'
          ? totalBn.toNumber()
          : Number(totalBn);

        const nowEpoch = Math.floor(Date.now() / 1000);

        for (let id = 0; id < total; id++) {
          // 2a) if acct is OWNER and subscription still valid:
          const onchainOwner: string = await contract.ownerOf(id);
          if (onchainOwner.toLowerCase() === acct.toLowerCase()) {
            const validSub: boolean = await contract.isValid(id);
            if (validSub) {
              setIsAuthorized(true);
              return;
            }
          }

          // 2b) if acct is the current USER (renter) and rental still valid:
          const userAddr: string = await contract.userOf(id);
          if (userAddr.toLowerCase() === acct.toLowerCase()) {
            const expBn = await contract.userExpires(id);
            const expEpoch = typeof expBn.toNumber === 'function'
              ? expBn.toNumber()
              : Number(expBn);
            if (expEpoch > nowEpoch) {
              // renter is still valid
              setIsAuthorized(true);
              return;
            }
          }
        }

        // 3) no active subscription/rental found
        setIsAuthorized(false);
        router.replace('/');
      } catch (_) {
        setIsAuthorized(false);
        router.replace('/');
      }
    }

    checkAccess();
  }, [router]);

  // While checking on-chain, render nothing
  if (isAuthorized === null) {
    return null;
  }

  return (
    <main style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🔒 Premium Content</h1>
      <p>This is the locked-up section that only owners or active renters can view.</p>
      {/* …place your gated UI here… */}
      <p style={{ marginTop: 32 }}>
        Now that you have passed the on-chain check, you can add any private text, videos, downloads, etc.
      </p>

      {/* RENT-OUT BUTTON: only a Link, no automatic redirect */}
      <div style={{ marginTop: 32 }}>
        <Link href="/rent">
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#10B981',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Rent Out Your Subscription
          </button>
        </Link>
      </div>
    </main>
  );
}
