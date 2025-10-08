// Add Framework Page Module
export default {
  currentStep: 1,
  totalSteps: 3,
  formData: {},

  render() {
    return `
      <div class="add-page">
        <div class="add-header">
          <h1>Add Your Framework</h1>
          <p>Share your framework documentation with the community</p>
        </div>

        <div class="wizard-container">
          <div class="wizard-progress">
            <div class="wizard-step ${this.currentStep >= 1 ? 'active' : ''}" data-step="1">
              <div class="step-circle">1</div>
              <div class="step-label">Repository</div>
            </div>
            <div class="wizard-line ${this.currentStep >= 2 ? 'active' : ''}"></div>
            <div class="wizard-step ${this.currentStep >= 2 ? 'active' : ''}" data-step="2">
              <div class="step-circle">2</div>
              <div class="step-label">Configuration</div>
            </div>
            <div class="wizard-line ${this.currentStep >= 3 ? 'active' : ''}"></div>
            <div class="wizard-step ${this.currentStep >= 3 ? 'active' : ''}" data-step="3">
              <div class="step-circle">3</div>
              <div class="step-label">Review</div>
            </div>
          </div>

          <div class="wizard-content">
            <div id="wizardStep"></div>
          </div>

          <div class="wizard-actions">
            <button class="btn btn-secondary" id="prevBtn" ${this.currentStep === 1 ? 'disabled' : ''}>
              <i class="fas fa-arrow-left"></i> Previous
            </button>
            <button class="btn btn-primary" id="nextBtn">
              ${this.currentStep === this.totalSteps ? 'Submit' : 'Next'} <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.currentStep = 1;
    this.formData = {};
    this.renderStep();
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
    document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());

    // Setup URL field listener for Step 1
    const urlField = document.getElementById('githubUrl');
    if (urlField) {
      urlField.addEventListener('blur', () => this.checkRepositoryAccess());
      urlField.addEventListener('change', () => {
        // Reset token requirement when URL changes
        this.formData.needsToken = false;
        const tokenField = document.getElementById('tokenField');
        if (tokenField) tokenField.style.display = 'none';
      });
    }
  },

  renderStep() {
    const stepContainer = document.getElementById('wizardStep');
    if (!stepContainer) return;

    switch (this.currentStep) {
      case 1:
        stepContainer.innerHTML = this.renderStep1();
        break;
      case 2:
        stepContainer.innerHTML = this.renderStep2();
        this.setupStep2();
        break;
      case 3:
        stepContainer.innerHTML = this.renderStep3();
        break;
    }
  },

  renderStep1() {
    return `
      <div class="wizard-step-content">
        <h2>Repository Information</h2>
        <p class="step-description">Enter your GitHub repository URL</p>

        <div class="form-group">
          <label for="githubUrl">GitHub Repository URL *</label>
          <input type="url" id="githubUrl" required
                 placeholder="https://github.com/owner/repo"
                 value="${this.formData.githubUrl || ''}">
          <small>We'll automatically discover your documentation</small>
        </div>

        <div id="discoveryStatus" style="margin-top: 1rem;"></div>

        <div class="form-group" id="tokenField" style="display: ${this.formData.needsToken ? 'block' : 'none'};">
          <label for="githubToken">GitHub Token *</label>
          <input type="password" id="githubToken"
                 placeholder="ghp_xxxxxxxxxxxx"
                 value="${this.formData.githubToken || ''}">
          <small>This repository requires authentication. <a href="https://github.com/settings/tokens" target="_blank">Create a token</a> with 'repo' access.</small>
        </div>
      </div>
    `;
  },

  renderStep2() {
    return `
      <div class="wizard-step-content">
        <h2>Configuration</h2>
        <p class="step-description">Customize your framework's settings</p>

        <div class="form-group">
          <label for="customPath">Documentation Path</label>
          <input type="text" id="customPath"
                 placeholder="docs"
                 value="${this.formData.customPath || ''}">
          <small>Leave empty for auto-discovery</small>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="autoDiscover" ${this.formData.autoDiscover !== false ? 'checked' : ''}>
            Enable Auto-Discovery
          </label>
          <small>Automatically find and organize documentation files</small>
        </div>

        <div id="discoverStatus" class="discover-status"></div>

        <button type="button" class="btn btn-secondary" id="testDiscovery">
          <i class="fas fa-search"></i> Test Auto-Discovery
        </button>
      </div>
    `;
  },

  renderStep3() {
    return `
      <div class="wizard-step-content">
        <h2>Review & Submit</h2>
        <p class="step-description">Review your framework details before submitting</p>

        <div class="review-card">
          <h3>Repository</h3>
          <p><strong>URL:</strong> ${this.formData.githubUrl}</p>
          <p><strong>Token:</strong> ${this.formData.githubToken ? '✅ Provided' : '❌ Not provided'}</p>
        </div>

        <div class="review-card">
          <h3>Configuration</h3>
          <p><strong>Documentation Path:</strong> ${this.formData.customPath || 'Auto-discover'}</p>
          <p><strong>Auto-Discovery:</strong> ${this.formData.autoDiscover !== false ? '✅ Enabled' : '❌ Disabled'}</p>
        </div>

        ${this.formData.discoveryResult ? `
        <div class="review-card">
          <h3>Discovery Result</h3>
          <p><strong>Status:</strong> ${this.formData.discoveryResult.found ? '✅ Success' : '❌ Failed'}</p>
          ${this.formData.discoveryResult.path ? `<p><strong>Path:</strong> ${this.formData.discoveryResult.path}</p>` : ''}
          ${this.formData.discoveryResult.metadata?.title ? `<p><strong>Title:</strong> ${this.formData.discoveryResult.metadata.title}</p>` : ''}
        </div>
        ` : ''}
      </div>
    `;
  },

  setupStep2() {
    document.getElementById('testDiscovery')?.addEventListener('click', () => this.testDiscovery());
  },

  async testDiscovery() {
    const url = this.formData.githubUrl;
    const customPath = document.getElementById('customPath').value;
    const token = this.formData.githubToken;

    if (!url) {
      alert('Please enter a GitHub URL first (Step 1)');
      return;
    }

    const statusDiv = document.getElementById('discoverStatus');
    statusDiv.innerHTML = '<div class="loading"></div> Discovering documentation...';
    statusDiv.className = 'discover-status';

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customPath, token })
      });

      const result = await response.json();
      this.formData.discoveryResult = result;

      if (response.ok && result.found) {
        statusDiv.className = 'discover-status success';
        statusDiv.innerHTML = `
          <strong>✅ Documentation found!</strong>
          <p>Path: ${result.path}</p>
          ${result.metadata?.title ? `<p>Title: ${result.metadata.title}</p>` : ''}
        `;
      } else {
        statusDiv.className = 'discover-status error';
        statusDiv.innerHTML = `
          <strong>❌ No documentation found</strong>
          <p>${result.error || 'Please specify the documentation path manually'}</p>
        `;
      }
    } catch (error) {
      statusDiv.className = 'discover-status error';
      statusDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
    }
  },

  async nextStep() {
    // Validate current step
    if (this.currentStep === 1) {
      const url = document.getElementById('githubUrl').value;
      if (!url) {
        alert('Please enter a GitHub URL');
        return;
      }
      this.formData.githubUrl = url;
      this.formData.githubToken = document.getElementById('githubToken').value;
    } else if (this.currentStep === 2) {
      this.formData.customPath = document.getElementById('customPath').value;
      this.formData.autoDiscover = document.getElementById('autoDiscover').checked;
    } else if (this.currentStep === 3) {
      await this.submitForm();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateWizard();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateWizard();
    }
  },

  updateWizard() {
    // Update progress
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
      if (index + 1 <= this.currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    document.querySelectorAll('.wizard-line').forEach((line, index) => {
      if (index + 1 < this.currentStep) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });

    // Update buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.disabled = this.currentStep === 1;
    if (nextBtn) {
      nextBtn.innerHTML = this.currentStep === this.totalSteps
        ? 'Submit <i class="fas fa-check"></i>'
        : 'Next <i class="fas fa-arrow-right"></i>';
    }

    // Render new step
    this.renderStep();
  },

  async checkRepositoryAccess() {
    const url = document.getElementById('githubUrl')?.value;
    if (!url || !url.includes('github.com')) return;

    const statusDiv = document.getElementById('discoveryStatus');
    if (!statusDiv) return;

    statusDiv.innerHTML = '<div class="loading"></div> Checking repository access...';
    statusDiv.className = 'discover-status';

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();

      if (response.status === 403 || (result.error && result.error.includes('403'))) {
        // Repository requires authentication
        this.formData.needsToken = true;
        const tokenField = document.getElementById('tokenField');
        if (tokenField) tokenField.style.display = 'block';

        statusDiv.className = 'discover-status error';
        statusDiv.innerHTML = `
          <strong>🔒 Private Repository</strong>
          <p>This repository requires authentication. Please provide a GitHub token below.</p>
        `;
      } else if (response.ok && result.found) {
        // Repository is accessible and docs found
        this.formData.needsToken = false;
        statusDiv.className = 'discover-status success';
        statusDiv.innerHTML = `
          <strong>✅ Repository accessible!</strong>
          <p>Documentation found at: ${result.path}</p>
        `;
      } else {
        // Repository accessible but no docs found
        statusDiv.className = 'discover-status';
        statusDiv.innerHTML = `
          <strong>ℹ️ Repository accessible</strong>
          <p>No documentation auto-detected. You can specify the path in the next step.</p>
        `;
      }
    } catch (error) {
      statusDiv.className = 'discover-status error';
      statusDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
    }
  },

  async submitForm() {
    const url = this.formData.githubUrl;
    const customPath = this.formData.customPath;
    const token = this.formData.githubToken;

    // Generate ID from URL
    const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      alert('Invalid GitHub URL');
      return;
    }

    const id = repoMatch[2].toLowerCase();
    const name = repoMatch[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const data = {
      id,
      name,
      url: customPath ? `${url}/tree/main/${customPath}` : url,
      description: `Documentation for ${name}`,
      token: token || null,
      enabled: true
    };

    try {
      const response = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Framework added successfully!');
        window.navigateTo('home');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  },

  cleanup() {
    this.currentStep = 1;
    this.formData = {};
  }
};
