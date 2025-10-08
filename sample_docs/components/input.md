# Input

A form input component for collecting user text input with validation support.

## Overview

The Input component provides a consistent interface for text entry with built-in validation, error handling, and various input types.

## Usage

```html
<input type="text" class="input" placeholder="Enter text...">
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | `"text"` | Input type. Options: `text`, `email`, `password`, `number`, `tel`, `url` |
| `placeholder` | `string` | `""` | Placeholder text shown when empty |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `readonly` | `boolean` | `false` | Whether the input is read-only |
| `required` | `boolean` | `false` | Whether the input is required |
| `maxLength` | `number` | `null` | Maximum number of characters |
| `pattern` | `string` | `null` | Regex pattern for validation |
| `error` | `string` | `null` | Error message to display |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `input` | `InputEvent` | Fired when the value changes |
| `change` | `Event` | Fired when input loses focus after value changed |
| `focus` | `FocusEvent` | Fired when input receives focus |
| `blur` | `FocusEvent` | Fired when input loses focus |
| `keypress` | `KeyboardEvent` | Fired when a key is pressed |

## Methods

### `focus()`
Focuses the input field.

```javascript
input.focus();
```

### `blur()`
Removes focus from the input.

```javascript
input.blur();
```

### `validate()`
Validates the input value against constraints.

**Returns:** `boolean` - True if valid

```javascript
const isValid = input.validate();
```

## Examples

### Basic Input

```html
<div class="form-group">
  <label for="name">Name</label>
  <input type="text" id="name" class="input" placeholder="John Doe">
</div>
```

### Email Input with Validation

```html
<div class="form-group">
  <label for="email">Email</label>
  <input type="email" id="email" class="input" required>
  <span class="error-message">Please enter a valid email</span>
</div>
```

### Password Input

```html
<div class="form-group">
  <label for="password">Password</label>
  <input type="password" id="password" class="input" minlength="8">
</div>
```

## Accessibility

- Always pair with a `<label>` element
- Use `aria-describedby` for error messages
- Ensure proper `autocomplete` attributes
- Use appropriate input types for mobile keyboards

## Best Practices

1. **Clear labels** - Always provide descriptive labels
2. **Helpful placeholders** - Show example formats
3. **Inline validation** - Provide real-time feedback
4. **Error recovery** - Guide users to fix errors
