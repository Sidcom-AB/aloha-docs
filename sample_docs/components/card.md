# Card

A flexible container component for grouping related content and actions.

## Overview

The Card component provides a clean, bordered container with consistent padding and styling. It's perfect for displaying grouped information, product details, user profiles, or any content that benefits from visual separation.

## Usage

```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content goes here...</p>
  </div>
  <div class="card-footer">
    <button>Action</button>
  </div>
</div>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `string` | `"default"` | Visual style. Options: `default`, `outlined`, `elevated` |
| `padding` | `string` | `"medium"` | Internal spacing. Options: `none`, `small`, `medium`, `large` |
| `hoverable` | `boolean` | `false` | Adds hover effect with slight elevation |
| `clickable` | `boolean` | `false` | Makes entire card clickable with hover cursor |

## Sections

### Header
Optional header section for titles and metadata.

```html
<div class="card-header">
  <h3>Title</h3>
  <span class="badge">New</span>
</div>
```

### Body
Main content area of the card.

```html
<div class="card-body">
  <p>Your content here...</p>
</div>
```

### Footer
Optional footer for actions or metadata.

```html
<div class="card-footer">
  <button class="btn btn-primary">Learn More</button>
</div>
```

## Slots

| Slot | Description |
|------|-------------|
| `header` | Content for the card header section |
| `default` | Main content area (body) |
| `footer` | Content for the card footer section |
| `media` | Optional media/image section at the top |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | `MouseEvent` | Fired when card is clicked (if `clickable` is true) |
| `mouseenter` | `MouseEvent` | Fired when mouse enters card area |
| `mouseleave` | `MouseEvent` | Fired when mouse leaves card area |

## Examples

### Basic Card

```html
<div class="card">
  <div class="card-body">
    <h3>Simple Card</h3>
    <p>This is a basic card with just body content.</p>
  </div>
</div>
```

### Card with Image

```html
<div class="card">
  <img src="image.jpg" alt="Card image" class="card-media">
  <div class="card-body">
    <h3>Card with Image</h3>
    <p>Image displayed at the top of the card.</p>
  </div>
</div>
```

### Clickable Card

```html
<div class="card card-clickable" onclick="handleCardClick()">
  <div class="card-body">
    <h3>Click Me</h3>
    <p>This entire card is clickable.</p>
  </div>
</div>
```

### Product Card

```html
<div class="card card-elevated">
  <img src="product.jpg" alt="Product" class="card-media">
  <div class="card-body">
    <h3>Product Name</h3>
    <p class="price">$29.99</p>
    <p>Product description goes here...</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary btn-full-width">Add to Cart</button>
  </div>
</div>
```

## Accessibility

- Use semantic HTML within cards (`<article>`, `<section>`, etc.)
- Ensure sufficient color contrast for text
- If card is clickable, include proper keyboard navigation
- Use `role="article"` for standalone content cards
- Add `aria-label` for cards without visible titles

## Best Practices

1. **Keep it simple** - Don't overcrowd cards with too much information
2. **Consistent spacing** - Use the padding property for consistent internal spacing
3. **Group related content** - Cards work best when content is logically related
4. **Visual hierarchy** - Use header for titles, body for content, footer for actions
5. **Responsive design** - Cards should adapt well to different screen sizes
6. **Loading states** - Consider showing skeleton cards while loading data

## Layout Patterns

### Card Grid

```html
<div class="card-grid">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

### Card List

```html
<div class="card-list">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

## Related Components

- [Modal](#) - For focused card-like content overlays
- [Panel](#) - For collapsible card sections
- [Accordion](#) - For multiple expandable cards
