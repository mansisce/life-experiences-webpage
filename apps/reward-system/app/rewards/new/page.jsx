'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewReward() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'achievement',
    points: 100,
    silent: false,
    announce: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/rewards');
      } else {
        alert('Failed to create reward');
      }
    } catch (error) {
      console.error('Error creating reward:', error);
      alert('Error creating reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1>➕ New Reward</h1>

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g., Certificate of Achievement"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What this reward represents..."
              rows="4"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Category
            </label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              <option value="achievement">Achievement</option>
              <option value="celebration">Celebration</option>
              <option value="learning">Learning</option>
              <option value="milestone">Milestone</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="points" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Points
            </label>
            <input type="number" id="points" name="points" value={form.points} onChange={handleChange} min="0" />
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="announce" checked={form.announce} onChange={handleChange} />
              Announce when earned
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="silent" checked={form.silent} onChange={handleChange} />
              Silent reward
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Reward'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{ background: '#666' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
