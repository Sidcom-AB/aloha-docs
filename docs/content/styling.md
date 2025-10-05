# Styling API

Complete guide to styling Aloha Framework components.

tags: [api, styling, css, theming]

## CSS Parts

Style component internals with CSS parts:

```css
x-button::part(button) {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
}

x-button::part(icon) {
  margin-right: 0.5rem;
}
```

## CSS Custom Properties

Use CSS variables for theming:

```css
x-card {
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --card-radius: 0.5rem;
  --card-padding: 1.5rem;
}
```

## Global Styles

Apply global component styles:

```css
:root {
  --aloha-primary: #2563eb;
  --aloha-secondary: #10b981;
  --aloha-danger: #ef4444;
  --aloha-warning: #f59e0b;
  --aloha-success: #10b981;
}

* {
  --aloha-font-family: system-ui, -apple-system, sans-serif;
  --aloha-font-size-base: 16px;
  --aloha-line-height: 1.5;
}
```

## State Styling

Style based on component state:

```css
x-button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

x-input[error]::part(input) {
  border-color: var(--aloha-danger);
}

x-card[elevated] {
  box-shadow: var(--card-shadow);
}
```

## Responsive Styling

Make components responsive:

```css
@media (max-width: 768px) {
  x-modal::part(dialog) {
    width: 90%;
    max-width: none;
  }
  
  x-card {
    --card-padding: 1rem;
  }
}
```

## Animation

Add animations to components:

```css
x-modal::part(dialog) {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```