'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <main>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>📋 Tasks</h1>
          <Link href="/tasks/new">
            <button>➕ New Task</button>
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p style={{ marginTop: '2rem', color: '#666' }}>No tasks yet. Create one to get started!</p>
        ) : (
          <table style={{ marginTop: '2rem' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>End Date</th>
                <th>Reward</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.category}</td>
                  <td>{task.status}</td>
                  <td>{new Date(task.endDate).toLocaleDateString()}</td>
                  <td>{task.reward_id ? '✅' : '⏳'}</td>
                  <td>
                    <Link href={`/tasks/${task.id}/edit`}>
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
