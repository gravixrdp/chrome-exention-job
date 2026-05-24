// Autofill Engine for Job Application Forms
// Smart Q&A — fuzzy matching: keyword overlap + AI semantic fallback

export class AutofillEngine {
  constructor(profile, qaBank, selectedResume, aiConfig) {
    this.profile = profile;
    this.qaBank = qaBank;
    this.selectedResume = selectedResume;
    this.aiConfig = aiConfig;
    this.filledFields = [];
    this.unansweredQuestions = [];
  }

  // Main autofill method
  autofill() {
    this.filledFields = [];
    this.unansweredQuestions = [];

    this.fillTextInputs();
    this.fillTextareas();
    this.fillSelects();
    this.fillRadioButtons();
    this.fillCheckboxes();
    this.highlightFilledFields();

    return this.filledFields;
  }

  // Fill text inputs
  fillTextInputs() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type])');

    inputs.forEach(input => {
      const label = this.getFieldLabel(input);
      const placeholder = input.placeholder?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';

      let value = null;

      if (this.matchesField(['name', 'full name', 'fullname'], label, placeholder, name, id)) {
        value = this.profile.fullName;
      } else if (this.matchesField(['first name', 'firstname'], label, placeholder, name, id)) {
        value = this.profile.fullName?.split(' ')[0];
      } else if (this.matchesField(['last name', 'lastname', 'surname'], label, placeholder, name, id)) {
        const parts = this.profile.fullName?.split(' ');
        value = parts?.[parts.length - 1];
      } else if (this.matchesField(['email', 'e-mail'], label, placeholder, name, id)) {
        value = this.profile.email;
      } else if (this.matchesField(['phone', 'mobile', 'contact', 'telephone'], label, placeholder, name, id)) {
        value = this.profile.phone;
      } else if (this.matchesField(['location', 'city', 'address'], label, placeholder, name, id)) {
        value = this.profile.location;
      } else if (this.matchesField(['linkedin', 'linkedin url', 'linkedin profile'], label, placeholder, name, id)) {
        value = this.profile.linkedinUrl;
      } else if (this.matchesField(['portfolio', 'website', 'portfolio url'], label, placeholder, name, id)) {
        value = this.profile.portfolioUrl;
      } else if (this.matchesField(['github', 'github url', 'github profile'], label, placeholder, name, id)) {
        value = this.profile.githubUrl;
      } else if (this.matchesField(['current ctc', 'current salary', 'current compensation'], label, placeholder, name, id)) {
        value = this.profile.currentCTC;
      } else if (this.matchesField(['expected ctc', 'expected salary', 'desired salary'], label, placeholder, name, id)) {
        value = this.profile.expectedCTC;
      } else if (this.matchesField(['notice period', 'notice', 'availability'], label, placeholder, name, id)) {
        value = this.profile.noticePeriod;
      } else if (this.matchesField(['experience', 'years of experience', 'total experience'], label, placeholder, name, id)) {
        value = this.profile.experience;
      } else if (this.matchesField(['current company', 'company', 'employer'], label, placeholder, name, id)) {
        value = this.profile.currentCompany;
      }

      if (value && !input.value) {
        this.fillField(input, value);
      }
    });
  }

  // Fill textareas — SMART Q&A: asks user if no answer exists
  fillTextareas() {
    const textareas = document.querySelectorAll('textarea');

    textareas.forEach(textarea => {
      const label = this.getFieldLabel(textarea);
      const placeholder = textarea.placeholder?.toLowerCase() || '';
      const name = textarea.name?.toLowerCase() || '';
      const id = textarea.id?.toLowerCase() || '';

      let value = null;
      let questionType = '';

      if (this.matchesField(['skills', 'technical skills', 'key skills'], label, placeholder, name, id)) {
        value = Array.isArray(this.profile.skills) ? this.profile.skills.join(', ') : this.profile.skills;
      } else if (this.matchesField(['about', 'summary', 'tell us about yourself', 'about yourself'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Tell me about yourself');
        questionType = 'about';
      } else if (this.matchesField(['why should we hire', 'why hire you', 'why you'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Why should we hire you?');
        questionType = 'why_hire';
      } else if (this.matchesField(['cover letter', 'coverletter'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Tell me about yourself');
        questionType = 'cover_letter';
      } else if (this.matchesField(['additional', 'other information', 'comments'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Why should we hire you?');
        questionType = 'additional';
      }

      // Smart Q&A: if field looks like a custom question but has no answer, track it
      if (!value && !textarea.value && (label || placeholder)) {
        const questionText = label || placeholder || name;
        if (questionText.length > 3 && !questionText.includes('name') && !questionText.includes('email')) {
          // Check if any Q&A bank entry has a similar, answered question
          const similar = this.findSimilarQA(questionText);
          if (similar) {
            // Similar question found with answer — use it
            this.fillField(textarea, similar.answer);
          } else {
            // No similar answer found — track for user prompt
            this.unansweredQuestions.push({
              question: questionText,
              element: textarea,
              label: questionText,
              isNew: true
            });
          }
        }
      }

      if (value && !textarea.value) {
        this.fillField(textarea, value);
      }
    });
  }

  fillSelects() {
    const selects = document.querySelectorAll('select');

    selects.forEach(select => {
      const label = this.getFieldLabel(select);
      const name = select.name?.toLowerCase() || '';
      const id = select.id?.toLowerCase() || '';

      if (this.matchesField(['experience', 'years of experience'], label, '', name, id)) {
        this.selectOption(select, this.profile.experience);
      } else if (this.matchesField(['work mode', 'working mode', 'job type', 'remote'], label, '', name, id)) {
        this.selectOption(select, this.profile.workModePreference);
      } else if (this.matchesField(['notice', 'notice period'], label, '', name, id)) {
        this.selectOption(select, this.profile.noticePeriod);
      }
    });
  }

  fillRadioButtons() {
    const relocateRadios = this.findRadioGroup(['relocate', 'relocation', 'willing to relocate']);
    if (relocateRadios.length > 0) {
      const answer = this.getQAAnswer('Are you willing to relocate?');
      if (answer?.toLowerCase().includes('yes')) {
        this.selectRadio(relocateRadios, 'yes');
      } else if (answer?.toLowerCase().includes('no')) {
        this.selectRadio(relocateRadios, 'no');
      }
    }

    const authRadios = this.findRadioGroup(['authorized', 'work authorization', 'legally authorized']);
    if (authRadios.length > 0) {
      const answer = this.getQAAnswer('Work authorization');
      if (answer?.toLowerCase().includes('yes')) {
        this.selectRadio(authRadios, 'yes');
      }
    }
  }

  fillCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      const label = this.getFieldLabel(checkbox);

      if (label.toLowerCase().includes('terms') || label.toLowerCase().includes('agree')) {
        return;
      }

      if (this.profile.skills && Array.isArray(this.profile.skills)) {
        this.profile.skills.forEach(skill => {
          if (label.toLowerCase().includes(skill.toLowerCase())) {
            checkbox.checked = true;
            this.filledFields.push({ element: checkbox, value: 'checked', label });
          }
        });
      }
    });
  }

  // Ask user for unanswered questions via popup message
  // Returns a promise that resolves when user answers
  async promptUnansweredQuestions() {
    if (this.unansweredQuestions.length === 0) return [];

    const answers = [];
    for (const item of this.unansweredQuestions) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'promptQuestion',
          question: item.question,
          isQuestionNew: item.isNew
        });

        if (response?.answer) {
          // Save answer to Q&A bank for future
          await this.saveQAAnswer(item.question, response.answer);
          // Fill the field
          item.element.value = response.answer;
          item.element.dispatchEvent(new Event('input', { bubbles: true }));
          item.element.dispatchEvent(new Event('change', { bubbles: true }));
          this.filledFields.push({ element: item.element, value: response.answer, label: item.label });
          answers.push({ question: item.question, answer: response.answer });
        }
      } catch (err) {
        console.error('Error prompting question:', err);
      }
    }

    return answers;
  }

  // Save Q&A answer to storage
  async saveQAAnswer(question, answer) {
    try {
      const { qaBank } = await chrome.storage.local.get(['qaBank']);
      if (!qaBank) {
        await chrome.storage.local.set({
          qaBank: [{ question, answer }]
        });
      } else {
        const existing = qaBank.findIndex(qa =>
          qa.question.toLowerCase() === question.toLowerCase()
        );
        if (existing !== -1) {
          qaBank[existing].answer = answer;
        } else {
          qaBank.push({ question, answer });
        }
        await chrome.storage.local.set({ qaBank });
      }
    } catch (error) {
      console.error('Error saving Q&A:', error);
    }
  }

  matchesField(keywords, label, placeholder, name, id) {
    const searchText = `${label} ${placeholder} ${name} ${id}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
  }

  getFieldLabel(element) {
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent;
    }

    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent;

    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'LABEL') {
        return sibling.textContent;
      }
      sibling = sibling.previousElementSibling;
    }

    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    return '';
  }

  fillField(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    const label = this.getFieldLabel(element);
    this.filledFields.push({ element, value, label: label || element.name || element.id });
  }

  selectOption(select, value) {
    if (!value) return;

    const options = Array.from(select.options);
    const matchingOption = options.find(opt =>
      opt.text.toLowerCase().includes(value.toLowerCase()) ||
      opt.value.toLowerCase().includes(value.toLowerCase())
    );

    if (matchingOption) {
      select.value = matchingOption.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));

      const label = this.getFieldLabel(select);
      this.filledFields.push({ element: select, value: matchingOption.text, label });
    }
  }

  findRadioGroup(keywords) {
    const radios = document.querySelectorAll('input[type="radio"]');
    const groups = {};

    radios.forEach(radio => {
      const name = radio.name;
      if (!groups[name]) groups[name] = [];
      groups[name].push(radio);
    });

    for (const [name, radios] of Object.entries(groups)) {
      const firstRadio = radios[0];
      const label = this.getFieldLabel(firstRadio);

      if (keywords.some(kw => label.toLowerCase().includes(kw))) {
        return radios;
      }
    }

    return [];
  }

  selectRadio(radios, value) {
    const matchingRadio = radios.find(radio => {
      const label = this.getFieldLabel(radio);
      return label.toLowerCase().includes(value.toLowerCase()) ||
             radio.value.toLowerCase().includes(value.toLowerCase());
    });

    if (matchingRadio) {
      matchingRadio.checked = true;
      matchingRadio.dispatchEvent(new Event('change', { bubbles: true }));

      const label = this.getFieldLabel(matchingRadio);
      this.filledFields.push({ element: matchingRadio, value, label });
    }
  }

  getQAAnswer(question) {
    const qa = this.qaBank.find(item =>
      item.question.toLowerCase() === question.toLowerCase()
    );
    return qa?.answer || '';
  }

  /**
   * Find the most similar Q&A from the bank for a given question.
   * Uses keyword overlap (Jaccard similarity) with 0.4 threshold.
   * Also checks substring containment.
   */
  findSimilarQA(questionText) {
    if (!this.qaBank || !questionText) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const qa of this.qaBank) {
      if (!qa.answer) continue;

      // Exact match — priority
      if (questionText.toLowerCase() === qa.question.toLowerCase()) {
        return qa;
      }

      // Substring match — high priority
      const qaLower = qa.question.toLowerCase();
      const questionLower = questionText.toLowerCase();
      if (qaLower.includes(questionLower) || questionLower.includes(qaLower)) {
        return qa;
      }

      // Keyword overlap — shared words / total unique words
      const score = this.keywordSimilarity(questionText, qa.question);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = qa;
      }
    }

    return bestScore >= 0.4 ? bestMatch : null;
  }

  /**
   * Jaccard similarity between two questions based on shared meaningful words.
   */
  keywordSimilarity(textA, textB) {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might',
      'i', 'you', 'we', 'they', 'it', 'this', 'that', 'these', 'those',
      'my', 'your', 'our', 'their', 'its', 'not', 'but', 'or', 'and',
      'if', 'so', 'to', 'in', 'on', 'at', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'please', 'briefly', 'kindly'
    ]);

    function tokenize(text) {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
    }

    const setA = new Set(tokenize(textA));
    const setB = new Set(tokenize(textB));
    if (!setA.size && !setB.size) return 1;
    if (!setA.size || !setB.size) return 0;

    const intersection = [...setA].filter(w => setB.has(w)).length;
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
  }

  highlightFilledFields() {
    this.filledFields.forEach(({ element }) => {
      element.style.border = '2px solid #4CAF50';
      element.style.backgroundColor = '#e8f5e9';
    });
  }

  clearHighlights() {
    this.filledFields.forEach(({ element }) => {
      element.style.border = '';
      element.style.backgroundColor = '';
    });
  }

  getSummary() {
    return this.filledFields.map(field => ({
      label: field.label,
      value: field.value
    }));
  }
}
