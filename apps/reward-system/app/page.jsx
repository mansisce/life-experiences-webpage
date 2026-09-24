'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <main>
      <div className="container">
        <h1>🏆 Reward System Dashboard</h1>
        <p>Manage your tasks and rewards, powered by AI categorization</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div style={{ background: '#f0f7ff', padding: '1.5rem', borderRadius: '8px' }}>
            <h3>📋 Tasks</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {stats?.tasks?.total || 0}
            </p>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              ✅ {stats?.tasks?.completed || 0} completed
            </p>
          </div>

          <div style={{ background: '#fff7f0', padding: '1.5rem', borderRadius: '8px' }}>
            <h3>🎁 Rewards</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {stats?.rewards?.total_available || 0}
            </p>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Available to earn
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link href="/tasks">
            <button>📋 View All Tasks</button>
          </Link>
          <Link href="/rewards">
            <button>🎁 View All Rewards</button>
          </Link>
          <Link href="/tasks/new">
            <button>➕ New Task</button>
          </Link>
          <Link href="/rewards/new">
            <button>➕ New Reward</button>
          </Link>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f7ff', borderRadius: '8px' }}>
          <h3>🤖 AI Categorization</h3>
          <p>Use Claude AI to automatically categorize tasks and assign appropriate rewards based on difficulty, duration, and importance.</p>
          <Link href="/categorize">
            <button style={{ marginTop: '1rem' }}>🚀 Run Categorization</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
