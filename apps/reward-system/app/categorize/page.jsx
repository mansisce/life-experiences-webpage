'use client';

import { useState } from 'react';

export default function Categorize() {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const handleCategorize = async () => {
    setLoading(true);
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/rewards'),
      ]);

      const tasksData = await tasksRes.json();
      const rewardsData = await rewardsRes.json();

      const categorizeRes = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksData.tasks,
          rewards: rewardsData.rewards,
        }),
      });

      const result = await categorizeRes.json();
      setAssignments(result.assignments || []);
    } catch (error) {
      console.error('Error during categorization:', error);
      alert('Error running categorization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        <h1>🤖 AI Task Categorization</h1>
        <p>Use Claude AI to automatically categorize your tasks and assign appropriate rewards</p>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f7ff', borderRadius: '8px' }}>
          <h3>How it works:</h3>
          <ol>
            <li>Click the button to load all your tasks and available rewards</li>
            <li>Claude AI analyzes each task based on difficulty, duration, and importance</li>
            <li>Review the recommended assignments</li>
            <li>Apply assignments to update your tasks</li>
          </ol>
        </div>

        <button onClick={handleCategorize} disabled={loading} style={{ marginTop: '2rem' }}>
          {loading ? '🔄 Analyzing...' : '🚀 Run Categorization'}
        </button>

        {assignments.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>✅ Recommended Assignments</h3>
            <table style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Reward ID</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                      {assignment.taskId?.substring(0, 8)}...
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                      {assignment.rewardId?.substring(0, 8)}...
                    </td>
                    <td>{assignment.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button style={{ marginTop: '1rem' }}>
              ✅ Apply All Assignments
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
