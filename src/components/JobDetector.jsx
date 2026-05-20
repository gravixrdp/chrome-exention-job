import React, { useState, useEffect } from 'react';
import { getProfile, getResumes, getQABank, getFilters } from '../services/storage';
import { calculateMatchScore, selectBestResume } from '../services/matcher';
import { checkDuplicateInSheets } from '../services/sheets';

export default function JobDetector() {
  const [currentJob, setCurrentJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadCurrentJob();
  }, []);

  async function loadCurrentJob() {
    try {
      const { currentJob: job } = await chrome.storage.session.get(['currentJob']);
      const userProfile = await getProfile();
      
      setProfile(userProfile);
      
      if (job) {
        setCurrentJob(job);
        
        if (userProfile) {
          // Calculate match score
          const filters = await getFilters();
          const match = calculateMatchScore(job, userProfile, filters);
          setMatchResult(match);
          
          // Check duplicate
          const dupCheck = await chrome.runtime.sendMessage({
            action: 'checkDuplicate',
            data: job
          });
          setDuplicateCheck(dupCheck);
          
          // Also check Google Sheets
          const sheetDup = await checkDuplicateInSheets(job);
          if (sheetDup.isDuplicate) {
            setDuplicateCheck(sheetDup);
          }
        }
      }
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAutofill() {
    if (!profile) {
      alert('Please setup your profile first');
      return;
    }

    try {
      setApplying(true);
      
      const qaBank = await getQABank();
      const resumes = await getResumes();
      const selectedResume = selectBestResume(currentJob, resumes);
      
      // Send message to content script to autofill
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'autofillForm',
        profile,
        qaBank,
        selectedResume
      });
      
      if (response.success) {
        alert(`✅ Autofilled ${response.filledFields} fields! Please review and submit.`);
      }
    } catch (error) {
      console.error('Error autofilling:', error);
      alert('Could not autofill. Make sure you are on the application form page.');
    } finally {
      setApplying(false);
    }
  }

  async function handleSaveApplication() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveApplication',
        data: {
          ...currentJob,
          matchScore: matchResult?.score,
          status: 'Applied',
          resumeUsed: 'Default',
          notes: ''
        }
      });
      
      if (response.success) {
        alert('✅ Application saved successfully!');
        setDuplicateCheck({ isDuplicate: true, reason: 'Just applied' });
      }
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save application');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          No Job Detected
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Visit a job page on LinkedIn, Indeed, or Naukri to detect jobs automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Job Info Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#333' }}>
            {currentJob.title}
          </h3>
          <span className="badge badge-info">{currentJob.platform}</span>
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
          🏢 {currentJob.company}
        </div>
        {currentJob.location && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            📍 {currentJob.location}
          </div>
        )}
        {currentJob.salary && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            💰 {currentJob.salary}
          </div>
        )}
        {currentJob.experience && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            ⏱️ {currentJob.experience}
          </div>
        )}
      </div>

      {/* Match Score */}
      {matchResult && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
            Match Analysis
          </h4>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(#667eea ${matchResult.score * 3.6}deg, #e0e0e0 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                color: '#667eea'
              }}>
                {matchResult.score}%
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: matchResult.score >= 80 ? '#28a745' : matchResult.score >= 60 ? '#ffc107' : '#dc3545',
                marginBottom: '4px'
              }}>
                {matchResult.recommendation}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Based on your profile
              </div>
            </div>
          </div>

          {matchResult.details.strongPoints.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                ✅ Strong Points:
              </div>
              {matchResult.details.strongPoints.map((point, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#28a745', marginLeft: '16px' }}>
                  • {point}
                </div>
              ))}
            </div>
          )}

          {matchResult.details.missingSkills.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                ⚠️ Missing Skills:
              </div>
              <div style={{ fontSize: '12px', color: '#dc3545', marginLeft: '16px' }}>
                {matchResult.details.missingSkills.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateCheck?.isDuplicate && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <strong>⚠️ Duplicate Detected!</strong>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            {duplicateCheck.reason}
            {duplicateCheck.date && ` on ${duplicateCheck.date}`}
          </div>
        </div>
      )}

      {/* Actions */}
      {!profile && (
        <div className="alert alert-info" style={{ marginBottom: '16px' }}>
          ℹ️ Please setup your profile to enable autofill and matching
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAutofill}
          disabled={!profile || applying}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            opacity: (!profile || applying) ? 0.5 : 1
          }}
        >
          {applying ? 'Filling...' : '📝 Autofill Application'}
        </button>
        
        <button
          onClick={handleSaveApplication}
          disabled={duplicateCheck?.isDuplicate}
          style={{
            flex: 1,
            background: '#28a745',
            color: 'white',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            opacity: duplicateCheck?.isDuplicate ? 0.5 : 1
          }}
        >
          💾 Save Application
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        💡 Review all fields before submitting. Manual submit recommended.
      </div>
    </div>
  );
}
