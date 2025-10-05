# Events API

Comprehensive guide to component events and event handling.

tags: [api, events, documentation]

## Event System

All Aloha Framework components dispatch standard DOM events that bubble and can be canceled.

## Common Events

### Lifecycle Events

```javascript
element.addEventListener('connected', (e) => {
  console.log('Component connected to DOM');
});

element.addEventListener('disconnected', (e) => {
  console.log('Component removed from DOM');
});
```

### State Change Events

```javascript
element.addEventListener('state-change', (e) => {
  const { oldState, newState } = e.detail;
  console.log(`State changed from ${oldState} to ${newState}`);
});
```

## Custom Event Details

Most component events include detailed information:

```javascript
button.addEventListener('click', (e) => {
  const { timestamp, source, data } = e.detail;
  // Handle event with details
});
```

## Event Delegation

Use event delegation for dynamic content:

```javascript
document.addEventListener('click', (e) => {
  if (e.target.matches('x-button')) {
    // Handle any button click
  }
});
```

## Preventing Default

Some events can be prevented:

```javascript
modal.addEventListener('close', (e) => {
  if (!confirmed) {
    e.preventDefault(); // Prevent modal from closing
  }
});
```