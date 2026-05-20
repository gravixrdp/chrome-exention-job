import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getGoogleSheetsConfig, saveGoogleSheetsConfig, getAIConfig, saveAIConfig } from '../services/storage';
import { connectGoogleSheets, disconnectGoogleSheets, getGoogleSheetsStatus } from '../services/sheets';
import { changePassword } from '../services/auth';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [googleSheets, setGoogleSheets] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    const g = await getGoogleSheetsStatus();
    const a = await getAIConfig();
    setSettings(s);
    setGoogleSheets(g);
    setAiConfig(a);
    setLoading(false);
  }

  async function handleSaveSettings() {
    await saveSettings(settings);
    alert('✅ Settings saved!');
  }

  async function handleConnectSheets() {
    if (!spreadsheetId) {
      alert('Please enter spreadsheet ID');
      return;
    }
    try {
      const result = await connectGoogleSheets(spreadsheetId);
      alert(`✅ Connected to: ${result.spreadsheetName}`);
      loadSettings();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  }

  async function handleDisconnectSheets() {
    if (!confirm('Disconnect Google Sheets?')) return;
    await disconnectGoogleSheets();
    setGoogleSheets({ connected: false });
    alert('✅ Disconnected');
  }

  async function handleSaveAI() {
    await saveAIConfig({ enabled: true, apiKey });
    alert('✅ OpenRouter API key saved!');
    loadSettings();
  }

  async function handleChangePassword() {
    const current = prompt('Enter current password:');
    if (!current) return;
    const newPass = prompt('Enter new password:');
    if (!newPass) return;
    const confirm = prompt('Confirm new password:');
    if (newPass !== confirm) {
      alert('Passwords do not match');
      return;
    }
    try {
      await changePassword(current, newPass);
      alert('✅ Password changed!');
    } catch (error) {
      alert('❌ ' + error.message);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Settings</h2>

      {/* General Settings */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>General</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.autoLockEnabled}
              onChange={(e) => setSettings({ ...settings, autoLockEnabled: e.target.checked })}
            />
            Auto-lock after inactivity
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            />
            Show notifications
          </label>
        </div>

        <button onClick={handleSaveSettings} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          Save Settings
        </button>
      </div>

      {/* Security */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Security</h3>
        <button onClick={handleChangePassword} style={{ width: '100%', padding: '10px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          🔒 Change Password
        </button>
      </div>

      {/* Google Sheets */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Google Sheets Integration</h3>
        
        {googleSheets.connected ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '12px', fontSize: '13px' }}>
              ✅ Connected to: {googleSheets.spreadsheetName}
            </div>
            <button onClick={handleDisconnectSheets} style={{ width: '100%', padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
              Disconnect
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Enter Spreadsheet ID"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', marginBottom: '8px' }}
            />
            <button onClick={handleConnectSheets} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
              Connect Google Sheets
            </button>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
              <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Create a new spreadsheet</a> and paste the ID here
            </div>
          </div>
        )}
      </div>

      {/* OpenRouter AI */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>AI Helper (Optional)</h3>
        
        {aiConfig.enabled && aiConfig.apiKey ? (
          <div className="alert alert-success" style={{ fontSize: '13px' }}>
            ✅ OpenRouter API key configured
          </div>
        ) : (
          <div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenRouter API key"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', marginBottom: '8px' }}
            />
            <button onClick={handleSaveAI} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
              Save API Key
            </button>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
              Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>OpenRouter</a>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💼</div>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Smart Job Auto Apply Assistant</div>
        <div style={{ fontSize: '12px', color: '#666' }}>Version 1.0.0</div>
      </div>
    </div>
  );
}
