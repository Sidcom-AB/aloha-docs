# Slots API

Guide to using slots for content projection in components.

tags: [api, slots, content-projection]

## Basic Slots

Use the default slot for simple content:

```html
<x-card>
  This content goes in the default slot
</x-card>
```

## Named Slots

Use named slots for specific content areas:

```html
<x-modal>
  <h2 slot="header">Title</h2>
  <p>Default content</p>
  <div slot="footer">Footer content</div>
</x-modal>
```

## Slot Fallbacks

Components provide fallback content:

```html
<!-- Component definition -->
<slot name="icon">
  <span>📝</span> <!-- Fallback -->
</slot>
```

## Dynamic Slots

Change slot content dynamically:

```javascript
const header = document.createElement('h2');
header.slot = 'header';
header.textContent = 'Dynamic Header';
component.appendChild(header);
```

## Slot Change Detection

Listen for slot changes:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', (e) => {
      const nodes = slot.assignedNodes();
      console.log('Slot content changed:', nodes);
    });
  }
}
```

## Conditional Slots

Show slots conditionally:

```javascript
<template>
  ${this.hasFooter ? html`
    <footer>
      <slot name="footer"></slot>
    </footer>
  ` : ''}
</template>
```