import React, { useState, useEffect } from 'react';
import { saveProfile, getProfile } from '../services/storage';

export default function ProfileManager() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    skills: [],
    experience: '',
    education: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    preferredRoles: [],
    preferredLocations: [],
    workModePreference: '',
    currentCompany: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const saved = await getProfile();
    if (saved) {
      setProfile(saved);
    }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
    alert('✅ Profile saved successfully!');
  }

  function addSkill() {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput('');
    }
  }

  function removeSkill(skill) {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  }

  function addRole() {
    if (roleInput.trim() && !profile.preferredRoles.includes(roleInput.trim())) {
      setProfile({ ...profile, preferredRoles: [...profile.preferredRoles, roleInput.trim()] });
      setRoleInput('');
    }
  }

  function removeRole(role) {
    setProfile({ ...profile, preferredRoles: profile.preferredRoles.filter(r => r !== role) });
  }

  function addLocation() {
    if (locationInput.trim() && !profile.preferredLocations.includes(locationInput.trim())) {
      setProfile({ ...profile, preferredLocations: [...profile.preferredLocations, locationInput.trim()] });
      setLocationInput('');
    }
  }

  function removeLocation(loc) {
    setProfile({ ...profile, preferredLocations: profile.preferredLocations.filter(l => l !== loc) });
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Your Profile</h2>
      
      <form onSubmit={handleSave}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Basic Info</h3>
          
          <InputField
            label="Full Name*"
            value={profile.fullName}
            onChange={(val) => setProfile({ ...profile, fullName: val })}
            required
          />
          
          <InputField
            label="Email*"
            type="email"
            value={profile.email}
            onChange={(val) => setProfile({ ...profile, email: val })}
            required
          />
          
          <InputField
            label="Phone*"
            value={profile.phone}
            onChange={(val) => setProfile({ ...profile, phone: val })}
            required
          />
          
          <InputField
            label="Location"
            value={profile.location}
            onChange={(val) => setProfile({ ...profile, location: val })}
            placeholder="e.g., Bangalore, India"
          />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Links</h3>
          
          <InputField
            label="LinkedIn URL"
            value={profile.linkedinUrl}
            onChange={(val) => setProfile({ ...profile, linkedinUrl: val })}
            placeholder="https://linkedin.com/in/yourprofile"
          />
          
          <InputField
            label="Portfolio URL"
            value={profile.portfolioUrl}
            onChange={(val) => setProfile({ ...profile, portfolioUrl: val })}
            placeholder="https://yourportfolio.com"
          />
          
          <InputField
            label="GitHub URL"
            value={profile.githubUrl}
            onChange={(val) => setProfile({ ...profile, githubUrl: val })}
            placeholder="https://github.com/yourusername"
          />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Professional Details</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Skills</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add skill"
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
              <button type="button" onClick={addSkill} style={{ padding: '8px 12px', background: '#000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.skills.map(skill => (
                <span key={skill} style={{ background: '#f0f0f0', color: '#000', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </span>
              ))}
            </div>
          </div>
          
          <InputField
            label="Years of Experience"
            value={profile.experience}
            onChange={(val) => setProfile({ ...profile, experience: val })}
            placeholder="e.g., 3 years"
          />
          
          <InputField
            label="Current Company"
            value={profile.currentCompany}
            onChange={(val) => setProfile({ ...profile, currentCompany: val })}
          />
          
          <InputField
            label="Current CTC"
            value={profile.currentCTC}
            onChange={(val) => setProfile({ ...profile, currentCTC: val })}
            placeholder="e.g., 12 LPA"
          />
          
          <InputField
            label="Expected CTC"
            value={profile.expectedCTC}
            onChange={(val) => setProfile({ ...profile, expectedCTC: val })}
            placeholder="e.g., 15 LPA"
          />
          
          <InputField
            label="Notice Period"
            value={profile.noticePeriod}
            onChange={(val) => setProfile({ ...profile, noticePeriod: val })}
            placeholder="e.g., 30 days"
          />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Preferences</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Preferred Roles</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                placeholder="Add role"
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
              <button type="button" onClick={addRole} style={{ padding: '8px 12px', background: '#000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.preferredRoles.map(role => (
                <span key={role} style={{ background: '#f0f0f0', color: '#000', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {role}
                  <button type="button" onClick={() => removeRole(role)} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Preferred Locations</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                placeholder="Add location"
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
              <button type="button" onClick={addLocation} style={{ padding: '8px 12px', background: '#000', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.preferredLocations.map(loc => (
                <span key={loc} style={{ background: '#f0f0f0', color: '#000', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {loc}
                  <button type="button" onClick={() => removeLocation(loc)} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Work Mode Preference</label>
            <select
              value={profile.workModePreference}
              onChange={(e) => setProfile({ ...profile, workModePreference: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="">Select...</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
              <option value="Any">Any</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #000 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Saving...' : '💾 Save Profile'}
        </button>
      </form>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '13px'
        }}
      />
    </div>
  );
}
