// src/app/premium/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import SubscriptionNFTAbi from '../../abis/SubscriptionNFT.json';
import Link from 'next/link';
import Image from 'next/image';

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
        const accounts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          router.replace('/');
          return;
        }
        const acct = accounts[0];

        const provider = new ethers.BrowserProvider(eth);
        const contract = new ethers.Contract(CONTRACT, SubscriptionNFTAbi.abi, provider);
        const totalBn = await contract.nextTokenId();
        const total = typeof totalBn.toNumber === 'function'
          ? totalBn.toNumber()
          : Number(totalBn);

        const nowEpoch = Math.floor(Date.now() / 1000);

        for (let id = 0; id < total; id++) {
          const onchainOwner: string = await contract.ownerOf(id);
          if (onchainOwner.toLowerCase() === acct.toLowerCase()) {
            const validSub: boolean = await contract.isValid(id);
            if (validSub) {
              setIsAuthorized(true);
              return;
            }
          }

          const userAddr: string = await contract.userOf(id);
          if (userAddr.toLowerCase() === acct.toLowerCase()) {
            const expBn = await contract.userExpires(id);
            const expEpoch = typeof expBn.toNumber === 'function'
              ? expBn.toNumber()
              : Number(expBn);
            if (expEpoch > nowEpoch) {
              setIsAuthorized(true);
              return;
            }
          }
        }

        setIsAuthorized(false);
        router.replace('/');
      } catch (_) {
        setIsAuthorized(false);
        router.replace('/');
      }
    }

    checkAccess();
  }, [router]);

  if (isAuthorized === null) {
    return null;
  }

  const cards = [
    {
      title: '🍕 Bitcoin Pizza Day',
      fact: 'In 2010, someone paid 10,000 BTC for 2 pizzas. That’s over $600 million today!',
      image: '/seal-pizza.jpg', // or .png, depending on your actual file
    },
    {
      title: '🤐 Lost Coins',
      fact: 'It’s estimated that 20% of all Bitcoin is lost forever. Always back up your keys!',
      image: '/seal-secret.jpg', // or .png
    },
    {
      title: '🌎 El Salvador Goes Bitcoin',
      fact: 'In 2021, El Salvador became the first country to adopt Bitcoin as legal tender.',
      image: '/seal-elsalvador.png',
    },
    {
      title: '🐋 Crypto Whales',
      fact: 'A crypto “whale” is someone who holds so much of a coin, they can affect the price just by trading!',
      image: '/seal-whale.jpg',
    },
  ];

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 20 }}>✨ Welcome, Premium Subscriber! ✨</h1>
      <p style={{ textAlign: 'center', marginBottom: 40 }}>Here's your exclusive crypto trivia vault 🔐</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20
      }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: '#fff',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <Image
              src={card.image}
              alt={card.title}
              width={280}
              height={180}
              style={{
                borderRadius: 10,
                objectFit: 'cover',
                marginBottom: 12
              }}
            />
            <h2 style={{ fontSize: '1.1rem', marginBottom: 10 }}>{card.title}</h2>
            <p style={{ fontSize: '0.95rem' }}>{card.fact}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 50, textAlign: 'center' }}>
        <Link href="/rent">
          <button
            style={{
              padding: '12px 24px',
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
