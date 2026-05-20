import React, { useState } from 'react';

export default function LoginScreen({ isSetup, onLogin, onSetup }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSetup) {
      // Setup new password
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      await onSetup(password);
    } else {
      // Login
      const success = await onLogin(password);
      if (!success) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }

  return (
    <div style={{
      width: '420px',
      height: '600px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
            {isSetup ? 'Setup Password' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {isSetup ? 'Create a password to secure your extension' : 'Enter your password to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
              autoFocus
            />
          </div>

          {isSetup && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
          )}

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Please wait...' : isSetup ? 'Create Password' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
