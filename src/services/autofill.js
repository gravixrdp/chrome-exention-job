// Autofill Engine for Job Application Forms

export class AutofillEngine {
  constructor(profile, qaBank, selectedResume) {
    this.profile = profile;
    this.qaBank = qaBank;
    this.selectedResume = selectedResume;
    this.filledFields = [];
  }

  // Main autofill method
  autofill() {
    this.filledFields = [];
    
    // Fill text inputs
    this.fillTextInputs();
    
    // Fill textareas
    this.fillTextareas();
    
    // Fill selects/dropdowns
    this.fillSelects();
    
    // Fill radio buttons
    this.fillRadioButtons();
    
    // Fill checkboxes
    this.fillCheckboxes();
    
    // Highlight filled fields
    this.highlightFilledFields();
    
    return this.filledFields;
  }

  fillTextInputs() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type])');
    
    inputs.forEach(input => {
      const label = this.getFieldLabel(input);
      const placeholder = input.placeholder?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';
      
      let value = null;
      
      // Name fields
      if (this.matchesField(['name', 'full name', 'fullname'], label, placeholder, name, id)) {
        value = this.profile.fullName;
      }
      // First name
      else if (this.matchesField(['first name', 'firstname'], label, placeholder, name, id)) {
        value = this.profile.fullName?.split(' ')[0];
      }
      // Last name
      else if (this.matchesField(['last name', 'lastname', 'surname'], label, placeholder, name, id)) {
        const parts = this.profile.fullName?.split(' ');
        value = parts?.[parts.length - 1];
      }
      // Email
      else if (this.matchesField(['email', 'e-mail'], label, placeholder, name, id)) {
        value = this.profile.email;
      }
      // Phone
      else if (this.matchesField(['phone', 'mobile', 'contact', 'telephone'], label, placeholder, name, id)) {
        value = this.profile.phone;
      }
      // Location/City
      else if (this.matchesField(['location', 'city', 'address'], label, placeholder, name, id)) {
        value = this.profile.location;
      }
      // LinkedIn
      else if (this.matchesField(['linkedin', 'linkedin url', 'linkedin profile'], label, placeholder, name, id)) {
        value = this.profile.linkedinUrl;
      }
      // Portfolio
      else if (this.matchesField(['portfolio', 'website', 'portfolio url'], label, placeholder, name, id)) {
        value = this.profile.portfolioUrl;
      }
      // GitHub
      else if (this.matchesField(['github', 'github url', 'github profile'], label, placeholder, name, id)) {
        value = this.profile.githubUrl;
      }
      // Current CTC
      else if (this.matchesField(['current ctc', 'current salary', 'current compensation'], label, placeholder, name, id)) {
        value = this.profile.currentCTC;
      }
      // Expected CTC
      else if (this.matchesField(['expected ctc', 'expected salary', 'desired salary'], label, placeholder, name, id)) {
        value = this.profile.expectedCTC;
      }
      // Notice Period
      else if (this.matchesField(['notice period', 'notice', 'availability'], label, placeholder, name, id)) {
        value = this.profile.noticePeriod;
      }
      // Years of Experience
      else if (this.matchesField(['experience', 'years of experience', 'total experience'], label, placeholder, name, id)) {
        value = this.profile.experience;
      }
      // Current Company
      else if (this.matchesField(['current company', 'company', 'employer'], label, placeholder, name, id)) {
        value = this.profile.currentCompany;
      }
      
      if (value && !input.value) {
        this.fillField(input, value);
      }
    });
  }

  fillTextareas() {
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
      const label = this.getFieldLabel(textarea);
      const placeholder = textarea.placeholder?.toLowerCase() || '';
      const name = textarea.name?.toLowerCase() || '';
      const id = textarea.id?.toLowerCase() || '';
      
      let value = null;
      
      // Skills
      if (this.matchesField(['skills', 'technical skills', 'key skills'], label, placeholder, name, id)) {
        value = Array.isArray(this.profile.skills) ? this.profile.skills.join(', ') : this.profile.skills;
      }
      // About/Summary
      else if (this.matchesField(['about', 'summary', 'tell us about yourself', 'about yourself'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Tell me about yourself');
      }
      // Why hire you
      else if (this.matchesField(['why should we hire', 'why hire you', 'why you'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Why should we hire you?');
      }
      // Cover letter
      else if (this.matchesField(['cover letter', 'coverletter'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Tell me about yourself');
      }
      // Additional info
      else if (this.matchesField(['additional', 'other information', 'comments'], label, placeholder, name, id)) {
        value = this.getQAAnswer('Why should we hire you?');
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
      
      // Experience
      if (this.matchesField(['experience', 'years of experience'], label, '', name, id)) {
        this.selectOption(select, this.profile.experience);
      }
      // Work mode
      else if (this.matchesField(['work mode', 'working mode', 'job type', 'remote'], label, '', name, id)) {
        this.selectOption(select, this.profile.workModePreference);
      }
      // Notice period
      else if (this.matchesField(['notice', 'notice period'], label, '', name, id)) {
        this.selectOption(select, this.profile.noticePeriod);
      }
    });
  }

  fillRadioButtons() {
    // Relocation
    const relocateRadios = this.findRadioGroup(['relocate', 'relocation', 'willing to relocate']);
    if (relocateRadios.length > 0) {
      const answer = this.getQAAnswer('Are you willing to relocate?');
      if (answer?.toLowerCase().includes('yes')) {
        this.selectRadio(relocateRadios, 'yes');
      } else if (answer?.toLowerCase().includes('no')) {
        this.selectRadio(relocateRadios, 'no');
      }
    }
    
    // Work authorization
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
      
      // Terms and conditions - don't auto-check
      if (label.toLowerCase().includes('terms') || label.toLowerCase().includes('agree')) {
        return;
      }
      
      // Skills checkboxes
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

  matchesField(keywords, label, placeholder, name, id) {
    const searchText = `${label} ${placeholder} ${name} ${id}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
  }

  getFieldLabel(element) {
    // Try to find label by for attribute
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent;
    }
    
    // Try to find parent label
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent;
    
    // Try to find previous sibling label
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'LABEL') {
        return sibling.textContent;
      }
      sibling = sibling.previousElementSibling;
    }
    
    // Try aria-label
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
