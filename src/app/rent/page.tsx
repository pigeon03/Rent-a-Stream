// src/app/rent/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import SubscriptionNFTAbi from '../../abis/SubscriptionNFT.json';

export default function RentPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [renter, setRenter] = useState<string>('');
  const [hours, setHours] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  const CONTRACT = process.env.NEXT_PUBLIC_SUBSCRIPTION_NFT_ADDRESS!;

  // On mount: connect & gather all token IDs you OWN that are currently NOT rented
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('Please install MetaMask');
      router.replace('/');
      return;
    }

    eth.request({ method: 'eth_requestAccounts' })
      .then((accts: string[]) => {
        if (accts.length === 0) throw new Error('No account');
        setAddress(accts[0]);
        return accts[0];
      })
      .then(async (acct: string) => {
        const provider = new ethers.BrowserProvider(eth);
        const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, provider);

        // 1) how many NFTs have ever been minted?
        const totalBn = await contract.nextTokenId();
        const total = typeof totalBn.toNumber === 'function'
          ? totalBn.toNumber()
          : Number(totalBn);

        const nowEpoch = Math.floor(Date.now() / 1000);
        const myIds: number[] = [];

        for (let id = 0; id < total; id++) {
          // 2) filter in only those you OWN
          const onchainOwner: string = await contract.ownerOf(id);
          if (onchainOwner.toLowerCase() !== acct.toLowerCase()) {
            continue;
          }

          // 3) check the renter slot
          const userAddr: string = await contract.userOf(id);
          const expiresBn = await contract.userExpires(id);
          const expiresEpoch = typeof expiresBn.toNumber === 'function'
            ? expiresBn.toNumber()
            : Number(expiresBn);

          // 4) only include this id if it is NOT currently rented (no active user slot)
          if (userAddr === ethers.ZeroAddress || expiresEpoch <= nowEpoch) {
            myIds.push(id);
          }
        }

        setTokens(myIds);
        if (myIds.length > 0) {
          setSelected(myIds[0]);
        }
      })
      .catch((_err: any) => {
        alert('Connection or on-chain check failed');
        router.replace('/');
      });
  }, [router]);

  // Called when owner clicks “Rent Out”
  async function rentOut() {
    if (selected === null || !/^0x[a-fA-F0-9]{40}$/.test(renter)) {
      alert('Select a token and enter a valid Ethereum address');
      return;
    }
    setLoading(true);

    try {
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, signer);

      const now = Math.floor(Date.now() / 1000);
      const expires = now + hours * 3600;

      // 1) setUser → rent the NFT
      const tx = await contract.setUser(selected, renter, expires);
      await tx.wait();

      alert(`✅ Token #${selected} rented to ${renter} for ${hours} h`);
      router.push('/premium');
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || 'Rent failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, textAlign: 'center' }}>
      <h1>🏷️ Rent Out Subscription</h1>

      {tokens.length === 0 ? (
        <p>You don’t own any subscriptions to rent out, or they’re all currently rented.</p>
      ) : (
        <>
          <label>
            Pick your token:{' '}
            <select
              value={selected ?? undefined}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {tokens.map((id) => (
                <option key={id} value={id}>
                  #{id}
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginTop: 12 }}>
            <label>
              Renter address:{' '}
              <input
                type="text"
                value={renter}
                onChange={(e) => setRenter(e.target.value)}
                placeholder="0x..."
                style={{ width: 300 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>
              Duration (hours):{' '}
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                {[5, 10, 24, 48].map((h) => (
                  <option key={h} value={h}>
                    {h} h
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={rentOut}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#EF4444',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing…' : `Rent Out #${selected}`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
