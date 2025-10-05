export class DocValidator {
  constructor() {
    this.requiredTocFields = ['title', 'sections'];
    this.requiredSectionFields = ['title'];
    this.requiredItemFields = ['title', 'file'];
  }

  validateTableOfContents(toc) {
    const errors = [];
    const warnings = [];

    for (const field of this.requiredTocFields) {
      if (!toc[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (!toc.version) {
      warnings.push('Missing version field');
    }

    if (!toc.description) {
      warnings.push('Missing description field');
    }

    if (toc.sections && Array.isArray(toc.sections)) {
      toc.sections.forEach((section, index) => {
        const sectionValidation = this.validateSection(section, index);
        errors.push(...sectionValidation.errors);
        warnings.push(...sectionValidation.warnings);
      });
    } else if (toc.sections) {
      errors.push('Sections must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateSection(section, index) {
    const errors = [];
    const warnings = [];
    const sectionPrefix = `Section[${index}]`;

    for (const field of this.requiredSectionFields) {
      if (!section[field]) {
        errors.push(`${sectionPrefix}: Missing required field: ${field}`);
      }
    }

    if (section.type === 'schemas') {
      if (section.items) {
        warnings.push(`${sectionPrefix}: Type 'schemas' should not have items`);
      }
    } else {
      if (!section.items || !Array.isArray(section.items)) {
        errors.push(`${sectionPrefix}: Missing or invalid items array`);
      } else {
        section.items.forEach((item, itemIndex) => {
          const itemValidation = this.validateItem(item, index, itemIndex);
          errors.push(...itemValidation.errors);
          warnings.push(...itemValidation.warnings);
        });
      }
    }

    if (!section.description) {
      warnings.push(`${sectionPrefix}: Missing description`);
    }

    return { errors, warnings };
  }

  validateItem(item, sectionIndex, itemIndex) {
    const errors = [];
    const warnings = [];
    const itemPrefix = `Section[${sectionIndex}].Item[${itemIndex}]`;

    for (const field of this.requiredItemFields) {
      if (!item[field]) {
        errors.push(`${itemPrefix}: Missing required field: ${field}`);
      }
    }

    if (!item.description) {
      warnings.push(`${itemPrefix}: Missing description`);
    }

    if (item.file) {
      const fileValidation = this.validateFilePath(item.file);
      if (!fileValidation.valid) {
        errors.push(`${itemPrefix}: Invalid file path: ${fileValidation.error}`);
      }
    }

    return { errors, warnings };
  }

  validateFilePath(filePath) {
    if (typeof filePath !== 'string') {
      return { valid: false, error: 'File path must be a string' };
    }

    if (filePath.includes('..')) {
      return { valid: false, error: 'File path cannot contain ".."' };
    }

    if (filePath.startsWith('/')) {
      return { valid: false, error: 'File path cannot be absolute' };
    }

    if (!filePath.endsWith('.md') && !filePath.endsWith('.json')) {
      return { valid: false, error: 'File must be .md or .json' };
    }

    return { valid: true };
  }

  validateDocument(content, type = 'markdown') {
    const errors = [];
    const warnings = [];

    if (type === 'markdown') {
      const mdValidation = this.validateMarkdown(content);
      errors.push(...mdValidation.errors);
      warnings.push(...mdValidation.warnings);
    } else if (type === 'json') {
      const jsonValidation = this.validateJSON(content);
      errors.push(...jsonValidation.errors);
      warnings.push(...jsonValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateMarkdown(content) {
    const errors = [];
    const warnings = [];

    if (!content || content.trim().length === 0) {
      errors.push('Document is empty');
      return { errors, warnings };
    }

    const lines = content.split('\n');
    let hasH1 = false;
    let h1Count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# ')) {
        hasH1 = true;
        h1Count++;
      }

      if (line.includes('```') && i < lines.length - 1) {
        const codeBlockStart = i;
        let codeBlockEnd = -1;
        
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('```')) {
            codeBlockEnd = j;
            break;
          }
        }
        
        if (codeBlockEnd === -1) {
          errors.push(`Unclosed code block starting at line ${codeBlockStart + 1}`);
        } else {
          i = codeBlockEnd;
        }
      }

      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const url = match[2];
        if (url.startsWith('http') && !url.startsWith('https')) {
          warnings.push(`Line ${i + 1}: Consider using HTTPS: ${url}`);
        }
      }
    }

    if (!hasH1) {
      warnings.push('Document should have at least one H1 heading');
    }

    if (h1Count > 1) {
      warnings.push(`Document has ${h1Count} H1 headings, consider using only one`);
    }

    return { errors, warnings };
  }

  validateJSON(content) {
    const errors = [];
    const warnings = [];

    try {
      const parsed = JSON.parse(content);
      
      if (Object.keys(parsed).length === 0) {
        warnings.push('JSON object is empty');
      }

      if (parsed.$schema && !parsed.$schema.startsWith('https')) {
        warnings.push('Schema URL should use HTTPS');
      }

    } catch (e) {
      errors.push(`Invalid JSON: ${e.message}`);
    }

    return { errors, warnings };
  }

  async validateFullRepository(tableOfContents, documentLoader) {
    const report = {
      tocValidation: this.validateTableOfContents(tableOfContents),
      documentValidations: [],
      summary: {
        totalDocuments: 0,
        validDocuments: 0,
        documentsWithWarnings: 0,
        documentsWithErrors: 0
      }
    };

    const documentsToValidate = [];

    for (const section of tableOfContents.sections) {
      if (section.items) {
        for (const item of section.items) {
          if (item.file) {
            documentsToValidate.push({
              section: section.title,
              title: item.title,
              file: item.file,
              type: item.file.endsWith('.json') ? 'json' : 'markdown'
            });
          }
        }
      }
    }

    report.summary.totalDocuments = documentsToValidate.length;

    for (const doc of documentsToValidate) {
      try {
        const content = await documentLoader(doc.file);
        const validation = this.validateDocument(content, doc.type);
        
        const docReport = {
          file: doc.file,
          section: doc.section,
          title: doc.title,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings
        };

        report.documentValidations.push(docReport);

        if (validation.valid) {
          report.summary.validDocuments++;
          if (validation.warnings.length > 0) {
            report.summary.documentsWithWarnings++;
          }
        } else {
          report.summary.documentsWithErrors++;
        }

      } catch (error) {
        report.documentValidations.push({
          file: doc.file,
          section: doc.section,
          title: doc.title,
          valid: false,
          errors: [`Failed to load document: ${error.message}`],
          warnings: []
        });
        report.summary.documentsWithErrors++;
      }
    }

    report.overallValid = report.tocValidation.valid && 
                          report.summary.documentsWithErrors === 0;

    return report;
  }

  generateValidationReport(validationResult) {
    const lines = [];
    
    lines.push('# Documentation Validation Report');
    lines.push('');
    
    lines.push('## Summary');
    lines.push(`- Overall Valid: ${validationResult.overallValid ? '✅' : '❌'}`);
    lines.push(`- Total Documents: ${validationResult.summary.totalDocuments}`);
    lines.push(`- Valid Documents: ${validationResult.summary.validDocuments}`);
    lines.push(`- Documents with Warnings: ${validationResult.summary.documentsWithWarnings}`);
    lines.push(`- Documents with Errors: ${validationResult.summary.documentsWithErrors}`);
    lines.push('');
    
    lines.push('## Table of Contents Validation');
    if (validationResult.tocValidation.valid) {
      lines.push('✅ Valid');
    } else {
      lines.push('❌ Invalid');
      lines.push('### Errors:');
      validationResult.tocValidation.errors.forEach(error => {
        lines.push(`- ${error}`);
      });
    }
    
    if (validationResult.tocValidation.warnings.length > 0) {
      lines.push('### Warnings:');
      validationResult.tocValidation.warnings.forEach(warning => {
        lines.push(`- ${warning}`);
      });
    }
    lines.push('');
    
    lines.push('## Document Validations');
    
    const errorDocs = validationResult.documentValidations.filter(d => !d.valid);
    const warningDocs = validationResult.documentValidations.filter(d => d.valid && d.warnings.length > 0);
    const validDocs = validationResult.documentValidations.filter(d => d.valid && d.warnings.length === 0);
    
    if (errorDocs.length > 0) {
      lines.push('### Documents with Errors:');
      errorDocs.forEach(doc => {
        lines.push(`- **${doc.file}** (${doc.section} - ${doc.title})`);
        doc.errors.forEach(error => {
          lines.push(`  - ❌ ${error}`);
        });
      });
      lines.push('');
    }
    
    if (warningDocs.length > 0) {
      lines.push('### Documents with Warnings:');
      warningDocs.forEach(doc => {
        lines.push(`- **${doc.file}** (${doc.section} - ${doc.title})`);
        doc.warnings.forEach(warning => {
          lines.push(`  - ⚠️ ${warning}`);
        });
      });
      lines.push('');
    }
    
    if (validDocs.length > 0) {
      lines.push('### Valid Documents:');
      validDocs.forEach(doc => {
        lines.push(`- ✅ ${doc.file} (${doc.section} - ${doc.title})`);
      });
    }
    
    return lines.join('\n');
  }
}