'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTask() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    silent: false,
    isMilestone: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/tasks');
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1>➕ New Task</h1>

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
              placeholder="e.g., Finish React refactor"
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
              placeholder="Task details..."
              rows="4"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Category
            </label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              <option value="general">General</option>
              <option value="engineering">Engineering</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="startDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Start Date
              </label>
              <input type="date" id="startDate" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="endDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                End Date
              </label>
              <input type="date" id="endDate" name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="isMilestone" checked={form.isMilestone} onChange={handleChange} />
              Mark as milestone
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="silent" checked={form.silent} onChange={handleChange} />
              Silent (no notifications)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
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
