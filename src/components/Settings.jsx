import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getGoogleSheetsConfig, saveGoogleSheetsConfig, getAIConfig, saveAIConfig, getDiscoveryConfig, saveDiscoveryConfig } from '../services/storage';
import { connectGoogleSheets, disconnectGoogleSheets, getGoogleSheetsStatus } from '../services/sheets';
import { changePassword } from '../services/auth';
import { initProviders, saveProviders, getProviders, testConnection } from '../services/scraping';
import PROVIDERS from '../services/providers';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [googleSheets, setGoogleSheets] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [discoveryConfig, setDiscoveryConfig] = useState(null);
  const [scrapingProviders, setScrapingProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testingProvider, setTestingProvider] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    const g = await getGoogleSheetsStatus();
    const a = await getAIConfig();
    const d = await getDiscoveryConfig();
    const sp = await initProviders();
    setSettings(s);
    setGoogleSheets(g);
    setAiConfig(a);
    setDiscoveryConfig(d);
    setScrapingProviders(sp);
    setLoading(false);
  }

  async function handleSaveSettings() {
    await saveSettings(settings);
    alert('Settings saved!');
  }

  async function handleSaveDiscovery() {
    await saveDiscoveryConfig(discoveryConfig);
    alert('Discovery settings saved!');
  }

  async function handleConnectSheets() {
    if (!spreadsheetId) {
      alert('Please enter spreadsheet ID');
      return;
    }
    try {
      const result = await connectGoogleSheets(spreadsheetId);
      alert(`Connected to: ${result.spreadsheetName}`);
      loadSettings();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  async function handleDisconnectSheets() {
    if (!confirm('Disconnect Google Sheets?')) return;
    await disconnectGoogleSheets();
    setGoogleSheets({ connected: false });
    alert('Disconnected');
  }

  async function handleSaveAI() {
    await saveAIConfig({ enabled: true, apiKey });
    alert('OpenRouter API key saved!');
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
      alert('Password changed!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleTestProvider(providerId) {
    setTestingProvider(providerId);
    const result = await testConnection(providerId);
    setProviderStatus(prev => ({ ...prev, [providerId]: result }));
    setTestingProvider(null);
  }

  function updateProvider(providerId, field, value) {
    const updated = scrapingProviders.map(p =>
      p.id === providerId ? { ...p, [field]: value } : p
    );
    setScrapingProviders(updated);
  }

  async function saveProviderSettings() {
    await saveProviders(scrapingProviders);
    alert('Scraping providers saved!');
  }

  function setProviderPriority(providerId, direction) {
    const index = scrapingProviders.findIndex(p => p.id === providerId);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= scrapingProviders.length) return;

    const updated = [...scrapingProviders];
    [updated[index].priority, updated[swapIndex].priority] =
    [updated[swapIndex].priority, updated[index].priority];
    setScrapingProviders(updated);
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
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Google Sheets</h3>

        {googleSheets.connected ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '12px', fontSize: '13px' }}>
              ✅ Connected: {googleSheets.spreadsheetName}
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
          </div>
        )}
      </div>

      {/* AI Helper */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>AI Helper</h3>

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
          </div>
        )}
      </div>

      {/* Scraping Providers */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Scraping Providers</h3>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
          Add API keys for web scraping. Extension tries providers in order (top first). If one fails, it tries the next.
        </p>

        {scrapingProviders.map((provider, idx) => (
          <div key={provider.id} style={{
            padding: '10px', marginBottom: '8px',
            border: '1px solid #e0e0e0', borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  {PROVIDERS[provider.id]?.name || provider.name}
                </span>
                <input
                  type="checkbox"
                  checked={provider.enabled}
                  onChange={(e) => updateProvider(provider.id, 'enabled', e.target.checked)}
                />
                <span style={{ fontSize: '10px', color: '#666' }}>#{provider.priority}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setProviderPriority(provider.id, 'up')}
                  style={{ padding: '2px 6px', background: '#f0f0f0', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                >↑</button>
                <button
                  onClick={() => setProviderPriority(provider.id, 'down')}
                  style={{ padding: '2px 6px', background: '#f0f0f0', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                >↓</button>
                <button
                  onClick={() => handleTestProvider(provider.id)}
                  disabled={testingProvider === provider.id}
                  style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                    background: providerStatus[provider.id]?.success ? '#28a745' : providerStatus[provider.id]?.error ? '#dc3545' : '#667eea',
                    color: 'white', border: 'none'
                  }}
                >
                  {testingProvider === provider.id ? '...' : 'Test'}
                </button>
              </div>
            </div>
            <input
              type="password"
              value={provider.apiKey}
              onChange={(e) => updateProvider(provider.id, 'apiKey', e.target.value)}
              placeholder={`API Key for ${PROVIDERS[provider.id]?.name || provider.name}`}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
            />
            {provider.lastError && (
              <div style={{ fontSize: '10px', color: '#dc3545', marginTop: '4px' }}>
                Last error: {provider.lastError}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={saveProviderSettings}
          style={{ width: '100%', padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', marginTop: '8px' }}
        >
          Save Providers
        </button>
      </div>

      {/* Auto Discovery */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Auto Job Discovery</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={discoveryConfig?.enabled || false}
              onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, enabled: e.target.checked })}
            />
            Enable auto-discovery
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Check interval</label>
          <select
            value={discoveryConfig?.intervalMinutes || 0}
            onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, intervalMinutes: parseInt(e.target.value) })}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value={0}>On-demand only</option>
            <option value={30}>Every 30 minutes</option>
            <option value={120}>Every 2 hours</option>
            <option value={360}>Every 6 hours</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px', display: 'block' }}>Platforms</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['LinkedIn', 'Indeed', 'Naukri'].map(platform => (
              <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={(discoveryConfig?.platforms || []).includes(platform)}
                  onChange={(e) => {
                    const platforms = discoveryConfig?.platforms || [];
                    const updated = e.target.checked
                      ? [...platforms, platform]
                      : platforms.filter(p => p !== platform);
                    setDiscoveryConfig({ ...discoveryConfig, platforms: updated });
                  }}
                />
                {platform}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveDiscovery}
          style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
        >
          Save Discovery Settings
        </button>
      </div>

      {/* About */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💼</div>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Smart Job Auto Apply Assistant</div>
        <div style={{ fontSize: '12px', color: '#666' }}>Version 1.1.0</div>
      </div>
    </div>
  );
}
