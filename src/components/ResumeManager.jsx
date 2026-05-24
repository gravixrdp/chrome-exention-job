import React, { useState, useEffect } from 'react';
import { saveResumes, getResumes } from '../services/storage';

export default function ResumeManager() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    const saved = await getResumes();
    setResumes(saved);
    setLoading(false);
  }

  async function addResume() {
    const name = prompt('Enter resume name (e.g., Frontend Resume):');
    if (!name) return;

    const newResume = {
      id: Date.now().toString(),
      name: name.trim(),
      isDefault: resumes.length === 0,
      uploadedAt: new Date().toISOString()
    };

    const updated = [...resumes, newResume];
    await saveResumes(updated);
    setResumes(updated);
  }

  async function setDefault(id) {
    const updated = resumes.map(r => ({ ...r, isDefault: r.id === id }));
    await saveResumes(updated);
    setResumes(updated);
  }

  async function deleteResume(id) {
    if (!confirm('Delete this resume?')) return;
    const updated = resumes.filter(r => r.id !== id);
    await saveResumes(updated);
    setResumes(updated);
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Resume Manager</h2>
        <button onClick={addResume} style={{ padding: '8px 12px', background: '#000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          ➕ Add Resume
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '13px' }}>
        ℹ️ Due to browser security, file uploads must be done manually during application. Add resume profiles here to track which one to use.
      </div>

      {resumes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          <p style={{ color: '#666' }}>No resumes added yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resumes.map(resume => (
            <div key={resume.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                    📄 {resume.name}
                    {resume.isDefault && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Default</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Added {new Date(resume.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!resume.isDefault && (
                    <button onClick={() => setDefault(resume.id)} style={{ padding: '6px 10px', background: '#000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px' }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => deleteResume(resume.id)} style={{ padding: '6px 10px', background: '#cc0000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
