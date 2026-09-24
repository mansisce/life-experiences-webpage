'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function RewardsList() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await fetch('/api/rewards');
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading rewards...</div>;

  return (
    <main>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>🎁 Rewards</h1>
          <Link href="/rewards/new">
            <button>➕ New Reward</button>
          </Link>
        </div>

        {rewards.length === 0 ? (
          <p style={{ marginTop: '2rem', color: '#666' }}>No rewards yet. Create some templates!</p>
        ) : (
          <table style={{ marginTop: '2rem' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Points</th>
                <th>Announce</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward.id}>
                  <td>{reward.title}</td>
                  <td>{reward.category}</td>
                  <td>{reward.points}</td>
                  <td>{reward.announce ? '✅' : '❌'}</td>
                  <td>
                    <Link href={`/rewards/${reward.id}/edit`}>
                      <button style={{ marginRight: '0.5rem' }}>Edit</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
