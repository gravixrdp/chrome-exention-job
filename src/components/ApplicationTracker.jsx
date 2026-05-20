import React, { useState, useEffect } from 'react';
import { getApplications, updateApplication, deleteApplication } from '../services/storage';

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    const apps = await getApplications();
    setApplications(apps.reverse());
    setLoading(false);
  }

  async function handleStatusChange(id, newStatus) {
    await updateApplication(id, { status: newStatus });
    loadApplications();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this application?')) return;
    await deleteApplication(id);
    loadApplications();
  }

  const statuses = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Saved', 'Skipped'];
  const filtered = filter === 'All' ? applications : applications.filter(app => app.status === filter);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Application Tracker</h2>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', padding: '4px 0' }}>
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '6px 12px',
              background: filter === status ? '#667eea' : '#f0f0f0',
              color: filter === status ? 'white' : '#666',
              border: 'none',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#666' }}>No applications found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(app => (
            <div key={app.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    {app.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    🏢 {app.company} • {app.platform}
                  </div>
                  {app.location && <div style={{ fontSize: '12px', color: '#666' }}>📍 {app.location}</div>}
                  {app.matchScore && <div style={{ fontSize: '12px', color: '#667eea', marginTop: '4px' }}>Match: {app.matchScore}%</div>}
                </div>
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                  style={{ height: '32px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Skipped">Skipped</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', background: '#667eea', color: 'white', textAlign: 'center', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}>
                  🔗 View Job
                </a>
                <button onClick={() => handleDelete(app.id)} style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
