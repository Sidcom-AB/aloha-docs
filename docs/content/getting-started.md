# Getting Started

Welcome to Aloha Framework! This guide will help you get up and running quickly.

tags: [guide, beginner, setup]

## Installation

```bash
npm install @aloha/framework
```

## Basic Usage

Import the components you need:

```javascript
import '@aloha/framework/components/button';
import '@aloha/framework/components/card';
```

## Configuration

Create a configuration file to customize the framework:

```javascript
export default {
  theme: 'light',
  primaryColor: '#2563eb',
  components: {
    button: {
      variant: 'primary'
    }
  }
}
```

## Next Steps

- Read the [Component Guide](./components-guide.md)
- Explore our [Design System](./design-system.md)
- Check out [Examples](./examples.md)