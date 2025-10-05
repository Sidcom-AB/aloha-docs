# Accessibility Guidelines

Ensuring all Aloha Framework components are accessible to everyone.

tags: [guide, accessibility, a11y, wcag]

## WCAG 2.1 Compliance

All components meet WCAG 2.1 Level AA standards.

### Key Requirements

1. **Perceivable**
   - Text alternatives for non-text content
   - Sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
   - Content is adaptable and distinguishable

2. **Operable**
   - All functionality available via keyboard
   - No keyboard traps
   - Sufficient time limits
   - No seizure-inducing content

3. **Understandable**
   - Readable and predictable interface
   - Input assistance and error prevention
   - Consistent navigation

4. **Robust**
   - Compatible with assistive technologies
   - Valid, well-structured markup

## Component Requirements

### Focus Management
```javascript
// Proper focus outline
:focus-visible {
  outline: 2px solid var(--aloha-primary);
  outline-offset: 2px;
}

// Trap focus in modals
element.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Handle focus trap logic
  }
});
```

### ARIA Attributes
- Use semantic HTML first
- Add ARIA only when necessary
- Never remove semantics with `role="presentation"`

### Screen Reader Support
- Test with NVDA, JAWS, and VoiceOver
- Announce dynamic content changes
- Provide context for interactive elements

## Keyboard Navigation

### Standard Patterns
- `Tab` - Navigate between focusable elements
- `Shift + Tab` - Navigate backwards
- `Enter` - Activate buttons and links
- `Space` - Toggle checkboxes, activate buttons
- `Arrow keys` - Navigate within components
- `Escape` - Close modals, cancel operations

### Component-Specific
- **Modal**: Focus trap, Escape to close
- **Dropdown**: Arrow keys to navigate options
- **Tabs**: Arrow keys to switch tabs
- **Tree**: Arrow keys to expand/collapse and navigate

## Testing Checklist

### Manual Testing
- [ ] Navigate using only keyboard
- [ ] Test with screen reader
- [ ] Verify color contrast
- [ ] Check focus indicators
- [ ] Test with browser zoom at 200%
- [ ] Disable CSS and verify content structure

### Automated Testing
- Use axe-core for automated testing
- Include a11y tests in CI/CD pipeline
- Regular lighthouse audits

## Common Pitfalls

### Avoid These Mistakes
- Empty buttons or links
- Missing alt text on images
- Low contrast text
- Auto-playing media with sound
- Removing focus indicators
- Time limits without warnings

### Best Practices
- Provide skip links
- Use heading hierarchy
- Label all form inputs
- Group related content
- Provide error messages
- Include loading states