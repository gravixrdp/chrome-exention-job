import React, { useState, useEffect } from 'react';
import { saveQABank, getQABank } from '../services/storage';

export default function QAManager() {
  const [qaBank, setQaBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    loadQABank();
  }, []);

  async function loadQABank() {
    const saved = await getQABank();
    setQaBank(saved);
    setLoading(false);
  }

  async function handleSave() {
    await saveQABank(qaBank);
    alert('✅ Q&A Bank saved!');
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
