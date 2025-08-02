# Dark and Light Mode Theme System

This document describes the comprehensive dark and light mode theme system implemented for the Training Management System.

## Overview

The theme system provides three theme options:
- **Light Mode**: Clean, bright interface with high contrast
- **Dark Mode**: Easy on the eyes with reduced brightness
- **System**: Automatically follows the user's system preference

## Features

### ✅ Implemented Features

1. **Theme Context (`ThemeContext.tsx`)**
   - Manages theme state (light/dark/system)
   - Persists theme preference in localStorage
   - Automatically syncs with system preference
   - Provides smooth transitions between themes

2. **Theme Toggle Components (`ThemeToggle.tsx`)**
   - `ThemeToggle`: Dropdown menu with all three options
   - `SimpleThemeToggle`: Simple toggle between light/dark
   - Animated icons that rotate and scale during transitions

3. **CSS Variables System (`index.css`)**
   - Comprehensive color palette for both themes
   - Smooth transitions (0.3s ease)
   - Custom scrollbar styling
   - Focus state improvements

4. **Tailwind Configuration (`tailwind.config.ts`)**
   - Extended color system using CSS variables
   - Shadow variables for consistent theming
   - Dark mode class-based implementation

5. **Theme Demo Page (`/theme-demo`)**
   - Interactive showcase of all theme components
   - Real-time theme switching
   - Component examples with proper theming
   - Color palette demonstration

### 🎨 Theme Colors

#### Light Mode
- Background: `hsl(0, 0%, 100%)` (Pure white)
- Foreground: `hsl(20, 14.3%, 4.1%)` (Dark gray)
- Primary: `hsl(207, 90%, 54%)` (Blue)
- Secondary: `hsl(60, 4.8%, 95.9%)` (Light gray)
- Muted: `hsl(60, 4.8%, 95.9%)` (Very light gray)
- Border: `hsl(20, 5.9%, 90%)` (Light border)

#### Dark Mode
- Background: `hsl(240, 10%, 3.9%)` (Very dark gray)
- Foreground: `hsl(0, 0%, 98%)` (Almost white)
- Primary: `hsl(207, 90%, 54%)` (Same blue)
- Secondary: `hsl(240, 3.7%, 15.9%)` (Dark gray)
- Muted: `hsl(240, 3.7%, 15.9%)` (Dark muted)
- Border: `hsl(240, 3.7%, 15.9%)` (Dark border)

## Usage

### Basic Theme Toggle

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

function MyComponent() {
  return (
    <div>
      <ThemeToggle />
    </div>
  );
}
```

### Using Theme Context

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

### Theme-Aware Styling

Use Tailwind classes that automatically adapt to the theme:

```tsx
// These classes automatically work in both light and dark modes
<div className="bg-background text-foreground">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <button className="bg-primary text-primary-foreground">Button</button>
</div>
```

## Implementation Details

### Theme Provider Setup

The `ThemeProvider` is wrapped around the entire app in `App.tsx`:

```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### CSS Variables

The theme system uses CSS custom properties for consistent theming:

```css
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(20, 14.3%, 4.1%);
  --primary: hsl(207, 90%, 54%);
  /* ... more variables */
}

.dark {
  --background: hsl(240, 10%, 3.9%);
  --foreground: hsl(0, 0%, 98%);
  --primary: hsl(207, 90%, 54%);
  /* ... more variables */
}
```

### Smooth Transitions

All theme changes include smooth transitions:

```css
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
```

## Pages with Theme Support

### ✅ Updated Pages
1. **Home Page** (`/`)
   - Theme toggle in header
   - Theme-aware card styling
   - Link to theme demo

2. **Dashboard** (`/dashboard`)
   - Theme toggle in header
   - Theme-aware card styling
   - Proper contrast for all elements

3. **Theme Demo** (`/theme-demo`)
   - Comprehensive theme showcase
   - Interactive theme switching
   - Component examples

### 🔄 Pages to Update
- Registration pages
- Login pages
- Trainee management pages
- Evaluation pages
- All other pages in the system

## Best Practices

### ✅ Do's
- Use theme-aware Tailwind classes (`bg-background`, `text-foreground`, etc.)
- Test components in both light and dark modes
- Use semantic color names (primary, secondary, muted, etc.)
- Include proper contrast ratios
- Add smooth transitions

### ❌ Don'ts
- Don't use hardcoded colors (`text-gray-900`, `bg-white`)
- Don't forget to test in both themes
- Don't use colors that don't adapt to theme changes
- Don't skip accessibility considerations

## Testing

### Manual Testing
1. Visit `/theme-demo` to see all components
2. Switch between light, dark, and system themes
3. Check that all components adapt properly
4. Verify smooth transitions
5. Test on different devices and browsers

### Automated Testing
- Theme context tests
- Component rendering in different themes
- LocalStorage persistence
- System preference detection

## Future Enhancements

### 🚀 Planned Features
1. **Custom Theme Builder**
   - Allow users to create custom color schemes
   - Save and share theme configurations

2. **High Contrast Mode**
   - Additional accessibility option
   - Enhanced contrast for visually impaired users

3. **Theme Presets**
   - Pre-built theme collections
   - Seasonal themes (winter, summer, etc.)

4. **Animation Preferences**
   - Reduce motion option
   - Custom transition speeds

5. **Component Library**
   - Comprehensive theme-aware component library
   - Documentation for each component

## Troubleshooting

### Common Issues

1. **Theme not persisting**
   - Check localStorage permissions
   - Verify ThemeProvider is properly wrapped

2. **Flickering on page load**
   - Ensure theme is applied before render
   - Use proper hydration strategies

3. **Inconsistent colors**
   - Use theme-aware classes instead of hardcoded colors
   - Check CSS variable definitions

4. **Performance issues**
   - Limit transition properties
   - Use `will-change` sparingly

## Contributing

When adding new components or pages:

1. Use theme-aware Tailwind classes
2. Test in both light and dark modes
3. Add to theme demo page if applicable
4. Update this documentation

## Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) 