# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vendora POS is a React Native point-of-sale application built with Expo SDK 54. It features both a POS interface for cashiers and an e-commerce storefront view. The app uses NativeWind (Tailwind CSS for React Native) for styling.

## Development Commands

```bash
# Start development server
npm start              # or: npx expo start

# Run on specific platforms
npm run android        # expo run:android
npm run ios           # expo run:ios
npm run web           # expo start --web

# Install dependencies (runs patch-package automatically)
npm install
```

## Architecture

### App Structure

The app uses a custom animated navigator (`RootNavigator`) instead of React Navigation's tab navigator. Six main screens are available via a floating navigation bar:

- **POS** - Cashier interface with product grid and cart panel
- **Store** - Customer-facing e-commerce view with banners, flash sales, filters
- **Inventory** - Product management and stock tracking
- **Orders** - Order history and details
- **Reports** - Sales analytics (placeholder)
- **Settings** - App configuration (placeholder)

### Context Providers (Global State)

All contexts are nested in `App.js` and available app-wide:

| Context | Purpose | Key State |
|---------|---------|-----------|
| `ProductContext` | Product catalog, categories, stock management | `products`, `decrementStockAfterSale()` |
| `OrderContext` | Completed transactions | `orders`, `addOrder()` |
| `CartContext` | Shopping cart with AsyncStorage persistence | `cart`, `savedCarts`, `abandonedCart` |
| `CustomerContext` | Customer data, recently viewed | `recentlyViewed` |
| `ReviewContext` | Product reviews and ratings | `reviews`, `allProductRatings` |

### Styling

Uses NativeWind v4 with custom Vendora theme colors defined in `tailwind.config.js`:

```
vendora-bg: #1a1025       (dark purple background)
vendora-card: #2d1f3d     (card background)
vendora-purple: #9333ea   (primary accent)
vendora-purple-light: #a855f7
vendora-input: #3d2a52    (input backgrounds)
vendora-border: #4a3660
vendora-text: #e5e5e5
vendora-text-muted: #9ca3af
```

**Important**: NativeWind classes may not work in some components (especially modals). Use inline `style` props as fallback when className styling fails.

### Key Patterns

**Dual Cart Systems**: POS screen uses `CartContext` for shared cart state. Store screen maintains its own local cart state - they are separate inventories.

**Product Variants**: Products can have variants with separate SKUs and stock levels. Cart items include `variantSku` and `variantOption` when applicable.

**Saved Carts Feature**: Users can save, load, and merge carts. Abandoned carts auto-save when app backgrounds and prompt restoration on relaunch. Data persists via AsyncStorage with keys `@vendora_saved_carts` and `@vendora_abandoned_cart`.

### Data Flow

Products are defined in `src/data/products.js` with static sample data. The `ProductContext` wraps this data and provides stock management. Stock decrements happen through `decrementStockAfterSale()` after successful checkout.

### Receipt Generation

`src/utils/receiptHelpers.js` generates HTML receipts that can be printed via `expo-print` or shared as PDF via `expo-sharing`.
