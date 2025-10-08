# Button

A versatile button component that supports multiple variants and states.

## Overview

The Button component provides a consistent way to trigger actions throughout your application. It supports various visual styles, sizes, and states to fit different use cases.

## Usage

```html
<button class="btn btn-primary">Click Me</button>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `string` | `"default"` | Visual style of the button. Options: `default`, `primary`, `secondary`, `danger` |
| `size` | `string` | `"medium"` | Size of the button. Options: `small`, `medium`, `large` |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `loading` | `boolean` | `false` | Shows a loading spinner when true |
| `fullWidth` | `boolean` | `false` | Makes the button take full width of container |

## Variants

### Primary
Used for main call-to-action buttons.

```html
<button class="btn btn-primary">Primary Button</button>
```

### Secondary
Used for secondary actions.

```html
<button class="btn btn-secondary">Secondary Button</button>
```

### Danger
Used for destructive actions like delete.

```html
<button class="btn btn-danger">Delete</button>
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `MouseEvent` | Fired when the button is clicked |
| `focus` | `FocusEvent` | Fired when the button receives focus |
| `blur` | `FocusEvent` | Fired when the button loses focus |

## Methods

### `focus()`
Programmatically focuses the button.

**Returns:** `void`

```javascript
button.focus();
```

### `blur()`
Removes focus from the button.

**Returns:** `void`

```javascript
button.blur();
```

## Examples

### Basic Button

```html
<button class="btn btn-primary">Save Changes</button>
```

### Disabled Button

```html
<button class="btn btn-primary" disabled>Cannot Click</button>
```

### Loading State

```html
<button class="btn btn-primary" data-loading="true">
  <span class="spinner"></span> Loading...
</button>
```

### Full Width Button

```html
<button class="btn btn-primary btn-full-width">
  Submit Form
</button>
```

## Accessibility

- Always include descriptive button text or `aria-label`
- Use `disabled` attribute for unavailable actions
- Ensure sufficient color contrast (WCAG AA compliant)
- Keyboard navigable via Tab key
- Activatable via Space or Enter key

## Best Practices

1. **Use appropriate variants** - Primary for main actions, secondary for less important ones
2. **Provide feedback** - Use loading states for async operations
3. **Be descriptive** - Use clear, action-oriented labels like "Save Changes" instead of just "Save"
4. **Consider mobile** - Ensure touch targets are at least 44x44px
5. **Avoid disabled states** - When possible, explain why an action isn't available instead of disabling

## Related Components

- [Link Button](#) - For navigation actions
- [Icon Button](#) - For compact icon-only actions
- [Button Group](#) - For grouping related buttons
