import React, { useState, useEffect } from 'react';
import { getApplications, getProfile } from '../services/storage';
import { getDiscoveryInfo } from '../services/discovery';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalFound: 0,
    totalApplied: 0,
    duplicatesSkipped: 0,
    avgMatchScore: 0,
    followUpsDue: 0
  });
  const [recentApps, setRecentApps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discoveryInfo, setDiscoveryInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const applications = await getApplications();
      const userProfile = await getProfile();
      const discovery = await getDiscoveryInfo();
      setProfile(userProfile);
      setDiscoveryInfo(discovery);

      const applied = applications.filter(app => app.status === 'Applied');
      const duplicates = applications.filter(app => app.status === 'Duplicate');

      const matchScores = applications
        .filter(app => app.matchScore)
        .map(app => app.matchScore);
      const avgScore = matchScores.length > 0
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : 0;

      const today = new Date().toISOString().split('T')[0];
      const followUps = applications.filter(app =>
        app.followUpDate === today && app.status !== 'Rejected'
      );

      setStats({
        totalFound: applications.length,
        totalApplied: applied.length,
        duplicatesSkipped: duplicates.length,
        avgMatchScore: avgScore,
        followUpsDue: followUps.length
      });

      setRecentApps(applications.slice(-5).reverse());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchNow() {
    setLoading(true);
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'startDiscovery'
      });
      if (result?.success) {
        alert(`Discovery complete! Found ${result.totalFound} jobs, ${result.newJobs} new.`);
      }
      loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoApply() {
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'startAutoPipeline'
      });
      if (result?.success) {
        alert(result.message || 'Auto apply started! The extension will now open LinkedIn, search for jobs, scroll through results, and save matching jobs.');
      } else {
        alert(result?.error || 'Auto apply failed. Check Settings for configuration.');
      }
    } catch (error) {
      alert('Error starting auto apply: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Setup Your Profile</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Create your profile to start applying for jobs
        </p>
        <button
          onClick={() => onNavigate('profile')}
          style={{
            background: '#000',
            color: 'white', padding: '12px 24px', borderRadius: '8px',
            fontSize: '14px', fontWeight: '600', border: 'none'
          }}
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          { label: 'Total Found', value: stats.totalFound, color: '#000', icon: '🔍' },
          { label: 'Applied', value: stats.totalApplied, color: '#333', icon: '✅' },
          { label: 'Duplicates', value: stats.duplicatesSkipped, color: '#888', icon: '⚠️' },
          { label: 'Avg Match', value: `${stats.avgMatchScore}%`, color: '#666', icon: '📊' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: 'white', borderRadius: '12px', padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Discovery Status */}
      {discoveryInfo?.hasResults && (
        <div className="alert alert-info" style={{ marginBottom: '12px', fontSize: '12px' }}>
          🌐 Last discovery: {new Date(discoveryInfo.timestamp).toLocaleString()} — {discoveryInfo.results.length} jobs cached
        </div>
      )}

      {/* Follow-ups Due */}
      {stats.followUpsDue > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <strong>⏰ {stats.followUpsDue} follow-up(s) due today!</strong>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('search')}
            style={{
              flex: 1, background: '#000', color: 'white',
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', border: 'none'
            }}
          >
            🌐 Search Jobs
          </button>
          <button
            onClick={handleSearchNow}
            style={{
              flex: 1, background: '#333', color: 'white',
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', border: 'none'
            }}
          >
            🔍 Search Now
          </button>
          <button
            onClick={() => onNavigate('tracker')}
            style={{
              flex: 1, background: '#666', color: 'white',
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', border: 'none'
            }}
          >
            📝 Tracker
          </button>
          <button
            onClick={handleAutoApply}
            style={{
              flex: '2 1', background: '#000', color: 'white',
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', border: 'none'
            }}
          >
            Auto Apply
          </button>
        </div>
      </div>

      {/* Recent Applications */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Recent Applications</h3>
        {recentApps.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            textAlign: 'center', color: '#666'
          }}>
            No applications yet. Visit a job page or search to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentApps.map(app => (
              <div key={app.id} style={{
                background: 'white', borderRadius: '8px', padding: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                    {app.title}
                  </div>
                  <span className={`badge badge-${app.status === 'Applied' ? 'success' : 'warning'}`}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {app.company} • {app.platform}
                </div>
                {app.matchScore && (
                  <div style={{ fontSize: '11px', color: '#000', marginTop: '4px' }}>
                    Match: {app.matchScore}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
