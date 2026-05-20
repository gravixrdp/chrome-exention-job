// AI Helper Service (OpenRouter Integration)

export async function generateCoverLetter(jobData, profile, apiKey) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  
  const prompt = `Generate a professional cover letter for the following job application:

Job Title: ${jobData.title}
Company: ${jobData.company}
Job Description: ${jobData.description?.substring(0, 500)}

Candidate Profile:
Name: ${profile.fullName}
Experience: ${profile.experience}
Skills: ${profile.skills?.join(', ')}
Current Role: ${profile.currentCompany}

Write a compelling, personalized cover letter that highlights relevant skills and experience. Keep it concise (250-300 words).`;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'Smart Job Auto Apply Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate cover letter');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

export async function improveAnswer(question, currentAnswer, jobDescription, apiKey) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  
  const prompt = `Improve the following answer for a job application question:

Question: ${question}
Current Answer: ${currentAnswer}
Job Context: ${jobDescription?.substring(0, 300)}

Provide an improved, more professional and tailored answer (2-3 sentences).`;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'Smart Job Auto Apply Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to improve answer');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error improving answer:', error);
    throw error;
  }
}

export async function summarizeJobDescription(description, apiKey) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  
  const prompt = `Summarize the following job description in 3-4 bullet points highlighting key responsibilities and requirements:

${description}`;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'Smart Job Auto Apply Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to summarize job description');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing job description:', error);
    throw error;
  }
}

export async function suggestMissingSkills(jobDescription, currentSkills, apiKey) {
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  
  const prompt = `Based on this job description, suggest 3-5 skills that would be valuable to learn:

Job Description: ${jobDescription?.substring(0, 500)}
Current Skills: ${currentSkills?.join(', ')}

Provide only the skill names in a comma-separated list.`;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'Smart Job Auto Apply Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to suggest skills');
    }
    
    const data = await response.json();
    const skills = data.choices[0].message.content.split(',').map(s => s.trim());
    return skills;
  } catch (error) {
    console.error('Error suggesting skills:', error);
    throw error;
  }
}
