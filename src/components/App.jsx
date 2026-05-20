import React, { useState, useEffect } from 'react';
import { isPasswordSetup, isLocked, verifyPassword, setupPassword, lockApp, resetInactivityTimer } from '../services/auth';
import LoginScreen from './LoginScreen';
import Dashboard from './Dashboard';
import ProfileManager from './ProfileManager';
import ResumeManager from './ResumeManager';
import QAManager from './QAManager';
import JobDetector from './JobDetector';
import ApplicationTracker from './ApplicationTracker';
import Settings from './Settings';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordSetup, setPasswordSetup] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    checkAuthStatus();
    // Reset inactivity timer on user activity
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, []);

  async function checkAuthStatus() {
    const setup = await isPasswordSetup();
    setPasswordSetup(setup);
    
    if (setup) {
      const locked = await isLocked();
      setAuthenticated(!locked);
    }
    
    setLoading(false);
  }

  async function handleLogin(password) {
    const valid = await verifyPassword(password);
    if (valid) {
      setAuthenticated(true);
      return true;
    }
    return false;
  }

  async function handleSetup(password) {
    await setupPassword(password);
    setPasswordSetup(true);
    setAuthenticated(true);
  }

  async function handleLogout() {
    await lockApp();
    setAuthenticated(false);
  }

  if (loading) {
    return (
      <div style={{
        width: '420px',
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        isSetup={!passwordSetup}
        onLogin={handleLogin}
        onSetup={handleSetup}
      />
    );
  }

  return (
    <div style={{
      width: '420px',
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700' }}>Job Auto Apply</h1>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none'
            }}
          >
            Lock
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        overflowX: 'auto'
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'job', label: 'Job', icon: '💼' },
          { id: 'tracker', label: 'Tracker', icon: '📝' },
          { id: 'profile', label: 'Profile', icon: '👤' },
          { id: 'resume', label: 'Resume', icon: '📄' },
          { id: 'qa', label: 'Q&A', icon: '💬' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => setCurrentView(nav.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: currentView === nav.id ? '#f0f0f0' : 'transparent',
              border: 'none',
              borderBottom: currentView === nav.id ? '3px solid #667eea' : '3px solid transparent',
              fontSize: '11px',
              fontWeight: '600',
              color: currentView === nav.id ? '#667eea' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{nav.icon}</div>
            <div style={{ marginTop: '4px' }}>{nav.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'job' && <JobDetector />}
        {currentView === 'tracker' && <ApplicationTracker />}
        {currentView === 'profile' && <ProfileManager />}
        {currentView === 'resume' && <ResumeManager />}
        {currentView === 'qa' && <QAManager />}
        {currentView === 'settings' && <Settings />}
      </div>
    </div>
  );
}
