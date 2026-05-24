import React, { useState, useEffect } from 'react';
import { saveQABank, getQABank } from '../services/storage';
import { loadQAFromSheets, saveQAToSheets } from '../services/gsheets-sync';
import { getSheetsConfig } from '../services/storage';

export default function QAManager() {
  const [qaBank, setQaBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [sheetsConfigured, setSheetsConfigured] = useState(false);

  useEffect(() => {
    loadQABank();
    checkSheetsConfig();
  }, []);

  async function loadQABank() {
    const saved = await getQABank();
    setQaBank(saved);
    setLoading(false);
  }

  async function checkSheetsConfig() {
    const config = await getSheetsConfig();
    setSheetsConfigured(!!config?.spreadsheetId);
  }

  async function handleSave() {
    await saveQABank(qaBank);
    setSyncStatus('✅ Saved locally!');
    setTimeout(() => setSyncStatus(''), 3000);
    setEditingIndex(null);
  }

  function updateAnswer(index, answer) {
    const updated = [...qaBank];
    updated[index].answer = answer;
    setQaBank(updated);
  }

  function addCustomQA() {
    const question = prompt('Enter question:');
    if (!question) return;
    setQaBank([...qaBank, { question: question.trim(), answer: '' }]);
  }

  function deleteQA(index) {
    if (!confirm('Delete this Q&A?')) return;
    setQaBank(qaBank.filter((_, i) => i !== index));
  }

  async function handleLoadFromSheets() {
    try {
      setSyncStatus('Loading from Sheets...');
      const loaded = await loadQAFromSheets();
      setQaBank(loaded);
      setSyncStatus(`✅ Loaded ${loaded.length} Q&A from Sheets!`);
    } catch (error) {
      setSyncStatus('❌ ' + error.message);
    }
    setTimeout(() => setSyncStatus(''), 5000);
  }

  async function handlePushToSheets() {
    try {
      setSyncStatus('Pushing to Sheets...');
      const result = await saveQAToSheets();
      setSyncStatus(`✅ Pushed ${result.count} Q&A to Sheets!`);
    } catch (error) {
      setSyncStatus('❌ ' + error.message);
    }
    setTimeout(() => setSyncStatus(''), 5000);
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Q&A Bank</h2>
        <button onClick={addCustomQA} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
          ➕ Add Custom
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '13px' }}>
        💡 Fill in common answers to auto-fill application forms
      </div>

      {/* Sheets Sync Section */}
      {sheetsConfigured && (
        <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1' }}>📊 Google Sheets Sync</span>
            {syncStatus && (
              <span style={{ fontSize: '12px', color: syncStatus.includes('✅') ? '#28a745' : '#dc3545' }}>
                {syncStatus}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleLoadFromSheets}
              style={{ flex: 1, padding: '10px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
            >
              ⬇️ Load from Sheets
            </button>
            <button
              onClick={handlePushToSheets}
              style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
            >
              ⬆️ Push to Sheets
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            Edit Q&A directly in Google Sheets — then "Load from Sheets" to sync back
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {qaBank.map((qa, index) => (
          <div key={index} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                {qa.question}
              </div>
              <button onClick={() => deleteQA(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}>
                🗑️
              </button>
            </div>
            <textarea
              value={qa.answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter your answer..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', minHeight: '60px', resize: 'vertical' }}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
        💾 Save All Answers
      </button>
    </div>
  );
}
