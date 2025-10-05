export function renderDoc(doc) {
  const content = document.getElementById('doc-content');
  
  if (doc.type === 'component' && doc.schema) {
    renderComponentFromSchema(doc.schema, content);
  } else if (doc.html) {
    content.innerHTML = `<div class="markdown">${doc.html}</div>`;
  } else {
    content.innerHTML = `
      <div class="doc">
        <h1>${doc.title}</h1>
        <pre><code>${escapeHtml(doc.content)}</code></pre>
      </div>
    `;
  }
}

function renderComponentFromSchema(schema, container) {
  container.innerHTML = `
    <div class="component-doc">
      <div class="component-header">
        <h1>
          ${schema.title}
          ${schema.tagName ? `<span class="component-tag">&lt;${schema.tagName}/&gt;</span>` : ''}
        </h1>
        <p class="component-description">${schema.description}</p>
      </div>
      
      ${renderExamples(schema.examples)}
      ${renderProperties(schema.properties)}
      ${renderEvents(schema.events)}
      ${renderSlots(schema.slots)}
      ${renderCssParts(schema.cssParts)}
      ${renderCssProperties(schema.cssProperties)}
      ${renderJsonSchema(schema)}
    </div>
  `;
}

function renderExamples(examples) {
  if (!examples || examples.length === 0) return '';
  
  return `
    <section class="example-section">
      <h2>Examples</h2>
      ${examples.map(example => `
        <div class="example">
          <h3>${example.title}</h3>
          <div class="example-code">
            <pre><code class="language-html">${escapeHtml(example.code)}</code></pre>
          </div>
          ${example.preview ? `
            <div class="example-preview">
              ${example.preview}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </section>
  `;
}

function renderProperties(properties) {
  if (!properties || Object.keys(properties).length === 0) return '';
  
  const rows = Object.entries(properties).map(([name, prop]) => {
    const type = prop.enum 
      ? `<span class="prop-enum">${prop.enum.join(' | ')}</span>`
      : `<span class="prop-type">${prop.type}</span>`;
    
    const defaultValue = prop.default !== undefined 
      ? `<span class="prop-default">${JSON.stringify(prop.default)}</span>`
      : '-';
    
    return `
      <tr>
        <td><span class="prop-name">${name}</span></td>
        <td>${type}</td>
        <td>${defaultValue}</td>
        <td>${prop.description || ''}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <section>
      <h2>Properties</h2>
      <table class="props-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function renderEvents(events) {
  if (!events || events.length === 0) return '';
  
  return `
    <section>
      <h2>Events</h2>
      <table class="events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Bubbles</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(event => `
            <tr>
              <td><span class="event-name">${event.name}</span></td>
              <td><span class="event-type">${event.type || 'Event'}</span></td>
              <td>${event.bubbles ? '✓' : '-'}</td>
              <td>${event.description || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

function renderSlots(slots) {
  if (!slots || slots.length === 0) return '';
  
  return `
    <section>
      <h2>Slots</h2>
      <table class="slots-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${slots.map(slot => `
            <tr>
              <td><span class="slot-name">${slot.name || 'default'}</span></td>
              <td>${slot.description || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

function renderCssParts(parts) {
  if (!parts || parts.length === 0) return '';
  
  return `
    <section class="css-parts">
      <h2>CSS Parts</h2>
      <div class="css-parts-grid">
        ${parts.map(part => `
          <div class="css-part-item">
            <code class="css-part-name">::part(${part.name})</code>
            <span class="css-part-description">${part.description || ''}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderCssProperties(cssProps) {
  if (!cssProps || cssProps.length === 0) return '';
  
  return `
    <section>
      <h2>CSS Custom Properties</h2>
      <table class="css-props-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          ${cssProps.map(prop => `
            <tr>
              <td><code class="css-prop-name">${prop.name}</code></td>
              <td>${prop.description || ''}</td>
              <td><code class="css-prop-default">${prop.default || '-'}</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

function renderJsonSchema(schema) {
  return `
    <details class="schema-details">
      <summary>View JSON Schema</summary>
      <pre class="schema-json"><code>${JSON.stringify(schema, null, 2)}</code></pre>
    </details>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}