import React, { useState, useEffect } from 'react';
import { getProfile, getApplications, saveProfile } from '../services/storage';
import { searchWithFallback } from '../services/scraping';
import { discoverJobs, checkForNewJobs, notifyNewJobs, getDiscoveryInfo } from '../services/discovery';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveryInfo, setDiscoveryInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDiscoveryInfo();
    loadProfile();
  }, []);

  async function loadProfile() {
    const p = await getProfile();
    setProfile(p);
  }

  async function loadDiscoveryInfo() {
    const info = await getDiscoveryInfo();
    setDiscoveryInfo(info);
    if (info.results.length > 0) {
      setJobs(info.results);
    }
  }

  async function handleSearch() {
    if (!profile && !searchQuery) {
      alert('Please fill your profile or enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const keywords = searchQuery || profile?.skills?.join(' ') || profile?.preferredRoles?.join(' ') || 'developer';
      const result = await searchWithFallback('LinkedIn', keywords, profile);

      if (result.success) {
        setJobs(result.jobs);
        chrome.storage.session.set({
          discoveryResults: result.jobs,
          discoveryTimestamp: new Date().toISOString()
        });
        setDiscoveryInfo({
          results: result.jobs,
          timestamp: new Date().toISOString(),
          hasResults: true,
          usedProvider: result.usedProvider
        });
      } else {
        setError(result.error);
        setJobs([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFullDiscovery() {
    setLoading(true);
    setError(null);

    try {
      const result = await discoverJobs(profile);
      const allJobs = result.platforms.flatMap(p => p.jobs);

      // Check for new jobs
      const newJobs = await checkForNewJobs(allJobs);
      if (newJobs.length > 0) {
        notifyNewJobs(newJobs, result.totalFound);
      }

      setJobs(allJobs);
      setDiscoveryInfo({
        results: allJobs,
        timestamp: result.timestamp,
        hasResults: true
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveJob(job) {
    await chrome.runtime.sendMessage({
      action: 'saveApplication',
      data: {
        ...job,
        status: 'Saved',
        matchScore: null,
        resumeUsed: '',
        notes: ''
      }
    });
  }

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.platform === filter);
  const platforms = ['All', 'LinkedIn', 'Indeed', 'Naukri'];

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Job Search</h2>

      {/* Search Controls */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keyword (e.g., React Developer)"
            style={{
              flex: 1, padding: '10px', border: '1px solid #ddd',
              borderRadius: '8px', fontSize: '13px'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 16px', background: '#000', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', opacity: loading ? 0.5 : 1
            }}
          >
            🔍 Search
          </button>
        </div>

        <button
          onClick={handleFullDiscovery}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', background: '#000',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '600', opacity: loading ? 0.5 : 1
          }}
        >
          🌐 Search All Platforms
        </button>
      </div>

      {/* Status */}
      {discoveryInfo?.hasResults && (
        <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '12px' }}>
          Found {jobs.length} jobs
          {discoveryInfo.usedProvider && ` via ${discoveryInfo.usedProvider}`}
          {' — '}Last search: {new Date(discoveryInfo.timestamp).toLocaleString()}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Platform Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
        {platforms.map(platform => (
          <button
            key={platform}
            onClick={() => setFilter(platform)}
            style={{
              padding: '6px 12px',
              background: filter === platform ? '#000' : '#f0f0f0',
              color: filter === platform ? 'white' : '#666',
              border: 'none', borderRadius: '16px',
              fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'
            }}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
          {jobs.length === 0
            ? 'Click "Search" or "Search All Platforms" to find jobs'
            : 'No jobs match this filter'
          }
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((job, idx) => (
            <div key={idx} style={{
              background: 'white', borderRadius: '12px', padding: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{job.title || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {job.company} {job.location && `• ${job.location}`}
                  </div>
                </div>
                <span className="badge badge-info">{job.platform}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '8px', background: '#000',
                    color: 'white', textAlign: 'center', borderRadius: '6px',
                    fontSize: '12px', textDecoration: 'none'
                  }}
                >
                  🔗 View
                </a>
                <button
                  onClick={() => handleSaveJob(job)}
                  style={{
                    padding: '8px 12px', background: '#000',
                    color: 'white', border: 'none', borderRadius: '6px',
                    fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  💾 Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
