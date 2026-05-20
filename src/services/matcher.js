// Job Matching Algorithm

export function calculateMatchScore(jobData, profile, filters) {
  let totalScore = 0;
  let maxScore = 0;
  const details = {
    skillsMatch: 0,
    experienceMatch: 0,
    locationMatch: 0,
    salaryMatch: 0,
    workModeMatch: 0,
    roleMatch: 0,
    missingSkills: [],
    strongPoints: []
  };

  // Skills Match (30 points)
  maxScore += 30;
  if (profile.skills && profile.skills.length > 0 && jobData.description) {
    const jobDesc = jobData.description.toLowerCase();
    const matchedSkills = profile.skills.filter(skill =>
      jobDesc.includes(skill.toLowerCase())
    );
    details.skillsMatch = (matchedSkills.length / profile.skills.length) * 30;
    totalScore += details.skillsMatch;

    // Extract required skills from job description (simple approach)
    const commonTechSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
      'express', 'django', 'flask', 'sql', 'mongodb', 'aws', 'docker',
      'kubernetes', 'typescript', 'css', 'html', 'git', 'agile'
    ];
    const requiredSkills = commonTechSkills.filter(skill => jobDesc.includes(skill));
    details.missingSkills = requiredSkills.filter(skill =>
      !profile.skills.some(ps => ps.toLowerCase().includes(skill))
    );

    if (matchedSkills.length > 0) {
      details.strongPoints.push(`${matchedSkills.length} matching skills`);
    }
  }

  // Experience Match (25 points)
  maxScore += 25;
  if (profile.experience && jobData.experience) {
    const profileExp = parseExperience(profile.experience);
    const jobExp = parseExperience(jobData.experience);
    if (profileExp !== null && jobExp !== null) {
      if (profileExp >= jobExp) {
        details.experienceMatch = 25;
        totalScore += 25;
        details.strongPoints.push(`${profileExp} years experience (required: ${jobExp})`);
      } else {
        const diff = jobExp - profileExp;
        if (diff <= 1) {
          details.experienceMatch = 20;
          totalScore += 20;
        } else if (diff <= 2) {
          details.experienceMatch = 15;
          totalScore += 15;
        } else {
          details.experienceMatch = 5;
          totalScore += 5;
        }
      }
    }
  }

  // Location Match (15 points)
  maxScore += 15;
  if (profile.preferredLocations && profile.preferredLocations.length > 0 && jobData.location) {
    const matchesLocation = profile.preferredLocations.some(loc =>
      jobData.location.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(jobData.location.toLowerCase())
    );
    if (matchesLocation) {
      details.locationMatch = 15;
      totalScore += 15;
      details.strongPoints.push('Preferred location match');
    }
  } else if (profile.preferredLocations?.includes('Remote') && 
             jobData.workMode?.toLowerCase().includes('remote')) {
    details.locationMatch = 15;
    totalScore += 15;
    details.strongPoints.push('Remote work available');
  }

  // Salary Match (15 points)
  maxScore += 15;
  if (profile.expectedCTC && jobData.salary) {
    const expectedSalary = parseSalary(profile.expectedCTC);
    const jobSalary = parseSalary(jobData.salary);
    if (expectedSalary && jobSalary) {
      if (jobSalary >= expectedSalary) {
        details.salaryMatch = 15;
        totalScore += 15;
        details.strongPoints.push('Salary meets expectations');
      } else {
        const diff = (expectedSalary - jobSalary) / expectedSalary;
        if (diff <= 0.1) {
          details.salaryMatch = 12;
          totalScore += 12;
        } else if (diff <= 0.2) {
          details.salaryMatch = 8;
          totalScore += 8;
        }
      }
    }
  }

  // Work Mode Match (10 points)
  maxScore += 10;
  if (profile.workModePreference && jobData.workMode) {
    const profileMode = profile.workModePreference.toLowerCase();
    const jobMode = jobData.workMode.toLowerCase();
    if (profileMode.includes(jobMode) || jobMode.includes(profileMode)) {
      details.workModeMatch = 10;
      totalScore += 10;
      details.strongPoints.push(`${jobData.workMode} work mode matches preference`);
    }
  }

  // Role/Title Match (5 points)
  maxScore += 5;
  if (profile.preferredRoles && profile.preferredRoles.length > 0 && jobData.title) {
    const matchesRole = profile.preferredRoles.some(role =>
      jobData.title.toLowerCase().includes(role.toLowerCase()) ||
      role.toLowerCase().includes(jobData.title.toLowerCase())
    );
    if (matchesRole) {
      details.roleMatch = 5;
      totalScore += 5;
      details.strongPoints.push('Role matches preference');
    }
  }

  // Calculate final score (0-100)
  const finalScore = Math.round((totalScore / maxScore) * 100);

  // Generate recommendation
  let recommendation;
  if (finalScore >= 80) {
    recommendation = 'Strong Match';
  } else if (finalScore >= 60) {
    recommendation = 'Average Match';
  } else {
    recommendation = 'Weak Match';
  }

  return {
    score: finalScore,
    recommendation,
    details
  };
}

function parseExperience(expStr) {
  if (!expStr) return null;
  const match = expStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseSalary(salaryStr) {
  if (!salaryStr) return null;
  // Remove currency symbols and convert to number
  const cleaned = salaryStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  // If salary is in thousands (K) or lakhs (L)
  if (salaryStr.toLowerCase().includes('k')) {
    return num * 1000;
  } else if (salaryStr.toLowerCase().includes('l')) {
    return num * 100000;
  }
  return num;
}

export function selectBestResume(jobData, resumes) {
  if (!resumes || resumes.length === 0) return null;
  
  const jobTitle = jobData.title.toLowerCase();
  
  // Try to match resume based on job title
  if (jobTitle.includes('frontend') || jobTitle.includes('front-end')) {
    const frontend = resumes.find(r => r.name.toLowerCase().includes('frontend'));
    if (frontend) return frontend;
  }
  
  if (jobTitle.includes('backend') || jobTitle.includes('back-end')) {
    const backend = resumes.find(r => r.name.toLowerCase().includes('backend'));
    if (backend) return backend;
  }
  
  if (jobTitle.includes('full stack') || jobTitle.includes('fullstack')) {
    const fullstack = resumes.find(r => r.name.toLowerCase().includes('full'));
    if (fullstack) return fullstack;
  }
  
  if (jobTitle.includes('fresher') || jobTitle.includes('entry level')) {
    const fresher = resumes.find(r => r.name.toLowerCase().includes('fresher'));
    if (fresher) return fresher;
  }
  
  // Return default resume
  const defaultResume = resumes.find(r => r.isDefault);
  return defaultResume || resumes[0];
}
