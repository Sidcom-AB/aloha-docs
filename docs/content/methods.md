# Methods API

Public methods available on Aloha Framework components.

tags: [api, methods, documentation]

## Calling Methods

All components expose public methods:

```javascript
const button = document.querySelector('x-button');
button.focus();
button.click();
```

## Common Methods

### Lifecycle Methods

- `connectedCallback()` - Called when connected to DOM
- `disconnectedCallback()` - Called when disconnected
- `attributeChangedCallback(name, oldVal, newVal)` - Attribute changed

### State Methods

- `setState(newState)` - Update component state
- `getState()` - Get current state
- `resetState()` - Reset to initial state

### Utility Methods

- `render()` - Force re-render
- `validate()` - Validate component
- `reset()` - Reset component
- `destroy()` - Clean up component

## Async Methods

Some methods return promises:

```javascript
const modal = document.querySelector('x-modal');

await modal.open();
console.log('Modal is now open');

await modal.close();
console.log('Modal is now closed');
```

## Method Chaining

Many methods support chaining:

```javascript
input
  .setValue('test@example.com')
  .validate()
  .focus();
```

## Protected Methods

Methods starting with underscore are protected:

```javascript
// Don't call these directly
component._internalMethod(); // ❌
component.publicMethod(); // ✅
```