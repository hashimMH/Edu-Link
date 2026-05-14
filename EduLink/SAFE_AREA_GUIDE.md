# Safe Area Implementation Guide for EduLink

This guide explains how safe areas are implemented in the EduLink app to ensure proper spacing around notches, status bars, home indicators, and other system UI elements on iOS and Android devices.

## Core Components

### 1. SafeAreaProvider

The entire app is wrapped with `SafeAreaProvider` in `App.tsx` to provide safe area insets to all screens:

```jsx
<SafeAreaProvider>
  <NavigationContainer>
    <StackNavigator />
  </NavigationContainer>
</SafeAreaProvider>
```

### 2. SafeAreaView Usage

Use `SafeAreaView` from 'react-native-safe-area-context' instead of React Native's built-in SafeAreaView for more control:

```jsx
import { SafeAreaView } from 'react-native-safe-area-context';

// In your component:
<SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
  {/* Content */}
</SafeAreaView>
```

The `edges` prop allows you to specify which edges should respect the safe area insets.

### 3. Using insets directly

For more fine-grained control, use the `useSafeAreaInsets` hook:

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MyComponent = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }}>
      {/* Content */}
    </View>
  );
};
```

## Implementation Guidelines

### Headers

- Use `SafeHeader` component for consistent header styling with safe area insets
- For custom headers, apply top insets conditionally:

```jsx
<View style={[
  styles.header, 
  { paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 10 : 0 }
]}>
  {/* Header content */}
</View>
```

### Tab Bars

- The tab bar has been configured to respect bottom safe area insets
- Custom tab bar height is adjusted based on platform and presence of home indicator:

```jsx
<View style={[
  styles.container, 
  { height: Platform.OS === 'ios' ? 70 + (insets.bottom > 0 ? 20 : 0) : 70 }
]}>
  {/* Tab bar content */}
</View>
```

### Content Areas

- Use `paddingBottom` with insets.bottom for scrollable content that needs to be visible above the tab bar
- For fixed position elements, consider both tab bar height and bottom insets

## Testing

Always test your UI on devices with:
- Notches (iPhone X and newer)
- Home indicators (iPhone X and newer)
- Different screen sizes
- Both portrait and landscape orientations

## Troubleshooting

If elements appear too close to system UI:
1. Check if the component is wrapped in SafeAreaView
2. Verify that appropriate edges are specified
3. Consider using direct insets for more precise control
4. For absolute positioned elements, account for insets in positioning
