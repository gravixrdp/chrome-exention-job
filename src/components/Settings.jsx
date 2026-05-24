import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getGoogleSheetsConfig, saveGoogleSheetsConfig, getAIConfig, saveAIConfig, getDiscoveryConfig, saveDiscoveryConfig, getSheetsConfig, saveSheetsConfig } from '../services/storage';
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

  // Sheets config state
  const [sheetsConfig, setSheetsConfig] = useState(null);
  const [sheetsAuth, setSheetsAuth] = useState('oauth');
  const [saFileError, setSaFileError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    const g = await getGoogleSheetsStatus();
    const a = await getAIConfig();
    const d = await getDiscoveryConfig();
    const sp = await initProviders();
    const sc = await getSheetsConfig();
    setSettings(s);
    setGoogleSheets(g);
    setAiConfig(a);
    setDiscoveryConfig(d);
    setScrapingProviders(sp);
    setSheetsConfig(sc);
    if (sc) setSheetsAuth(sc.authMethod || 'oauth');
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
    await saveAIConfig({ enabled: true, apiKey, excloudApiKey: aiConfig?.excloudApiKey || '' });
    alert('AI keys saved!');
    loadSettings();
  }

  // --- Sheets Config Handlers ---
  function updateSheetsConfig(field, value) {
    setSheetsConfig(prev => ({ ...prev, [field]: value }));
  }

  async function handleSaveSheetsConfig() {
    if (!sheetsConfig.spreadsheetId) {
      alert('Please enter Spreadsheet ID');
      return;
    }

    // If service account mode, validate JSON
    if (sheetsAuth === 'service-account' && !sheetsConfig.serviceAccountJson) {
      alert('Please upload service account JSON file');
      return;
    }

    await saveSheetsConfig({ ...sheetsConfig, authMethod: sheetsAuth });
    setSheetsConfig({ ...sheetsConfig, authMethod: sheetsAuth });

    // Also save in googleSheets config for backward compatibility
    await saveGoogleSheetsConfig({
      connected: true,
      spreadsheetId: sheetsConfig.spreadsheetId,
      spreadsheetName: 'Google Sheet'
    });
    setGoogleSheets({ connected: true, spreadsheetName: 'Google Sheet' });

    alert('Sheets configuration saved!');
  }

  async function handleTestConnection() {
    if (!sheetsConfig.spreadsheetId) {
      alert('Please enter Spreadsheet ID');
      return;
    }

    try {
      let token;
      if (sheetsAuth === 'service-account') {
        const res = await chrome.runtime.sendMessage({
          action: 'getServiceAccountToken',
          serviceAccountJson: sheetsConfig.serviceAccountJson
        });
        if (!res.success) throw new Error(res.error);
        token = res.token;
      } else {
        const res = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
        if (!res.success) throw new Error(res.error);
        token = res.token;
      }

      // Verify access
      const fetchRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetsConfig.spreadsheetId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!fetchRes.ok) throw new Error('Cannot access spreadsheet. Check ID and sharing.');
      const data = await fetchRes.json();
      alert(`✅ Connected to: ${data.properties.title}\nAuth: ${sheetsAuth === 'service-account' ? 'Service Account' : 'OAuth'}`);
    } catch (error) {
      alert(`❌ Connection failed: ${error.message}`);
    }
  }

  function handleSaFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSaFileError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.client_email || !json.private_key) {
          throw new Error('Missing client_email or private_key');
        }
        updateSheetsConfig('serviceAccountJson', e.target.result);
      } catch (err) {
        setSaFileError('Invalid JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
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

        {/* Spreadsheet ID */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px', display: 'block' }}>Spreadsheet ID</label>
          <input
            type="text"
            value={sheetsConfig?.spreadsheetId || ''}
            onChange={(e) => updateSheetsConfig('spreadsheetId', e.target.value)}
            placeholder="e.g. 1BxiMVs0XRA8n..."
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
          />
        </div>

        {/* Auth Method */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px', display: 'block' }}>Authentication Method</label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="authMethod"
                checked={sheetsAuth === 'oauth'}
                onChange={() => setSheetsAuth('oauth')}
              />
              Chrome OAuth
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="authMethod"
                checked={sheetsAuth === 'service-account'}
                onChange={() => setSheetsAuth('service-account')}
              />
              Service Account
            </label>
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {sheetsAuth === 'oauth'
              ? 'Uses Chrome login popup. Simple setup.'
              : 'Upload GCP Service Account JSON. Share sheet with service account email.'}
          </div>
        </div>

        {/* Service Account Upload */}
        {sheetsAuth === 'service-account' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px', display: 'block' }}>
              Service Account JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleSaFileUpload}
              style={{ fontSize: '13px', padding: '8px 0' }}
            />
            {sheetsConfig?.serviceAccountJson && (
              <div className="alert alert-success" style={{ fontSize: '12px', marginTop: '6px' }}>
                ✅ File loaded
              </div>
            )}
            {saFileError && (
              <div className="alert alert-danger" style={{ fontSize: '12px', marginTop: '6px' }}>
                ❌ {saFileError}
              </div>
            )}
          </div>
        )}

        {/* Tab Names */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px', display: 'block' }}>Tab Names</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#666', width: '24px' }}>Q&A</span>
              <input
                type="text"
                value={sheetsConfig?.qaTabName || 'Q&A Bank'}
                onChange={(e) => updateSheetsConfig('qaTabName', e.target.value)}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#666', width: '24px' }}>Hiring</span>
              <input
                type="text"
                value={sheetsConfig?.hiringPostsTabName || 'HiringPosts'}
                onChange={(e) => updateSheetsConfig('hiringPostsTabName', e.target.value)}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#666', width: '24px' }}>Jobs</span>
              <input
                type="text"
                value={sheetsConfig?.applicationsTabName || 'Sheet1'}
                onChange={(e) => updateSheetsConfig('applicationsTabName', e.target.value)}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={handleTestConnection}
            style={{ flex: 1, padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            🔌 Test
          </button>
          <button
            onClick={handleSaveSheetsConfig}
            style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            💾 Save
          </button>
        </div>

        {googleSheets?.connected && (
          <div>
            <div className="alert alert-success" style={{ fontSize: '12px', marginBottom: '8px' }}>
              ✅ Connected: {googleSheets.spreadsheetName}
            </div>
            <button
              onClick={handleDisconnectSheets}
              style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px' }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* AI Helper */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>AI Helper</h3>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
          Extension tries Excloud first, then falls back to OpenRouter. Add both for maximum reliability.
        </p>

        {/* Excloud */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
            Excloud API
          </label>
          <input
            type="password"
            value={aiConfig?.excloudApiKey || ''}
            onChange={(e) => setAiConfig({ ...aiConfig, enabled: true, excloudApiKey: e.target.value })}
            placeholder="sxkHkNBFWOnRPTU9oFcFZ..."
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', marginBottom: '8px' }}
          />
          {aiConfig?.excloudApiKey && (
            <div className="alert alert-success" style={{ fontSize: '12px' }}>
              ✅ Excloud configured
            </div>
          )}
        </div>

        {/* OpenRouter */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
            OpenRouter API (Fallback)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter OpenRouter API key"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', marginBottom: '8px' }}
          />
          {aiConfig?.enabled && aiConfig.apiKey && (
            <div className="alert alert-success" style={{ fontSize: '12px' }}>
              ✅ OpenRouter configured
            </div>
          )}
        </div>

        <button onClick={handleSaveAI} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          💾 Save AI Keys
        </button>
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
        <div style={{ fontSize: '12px', color: '#666' }}>Version 1.2.0</div>
      </div>
    </div>
  );
}
