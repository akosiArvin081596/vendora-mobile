# Laravel WebSocket Integration - Implementation Guide

Implement real-time synchronization webhooks for the Vendora POS system. These webhooks notify a Node.js WebSocket server when data changes, which then broadcasts updates to connected mobile apps.

## Architecture

```
Laravel Backend ──webhook POST──> Node.js WebSocket Server ──socket.io──> Mobile Apps
```

When a Product, Order, or Category is created/updated/deleted in Laravel, send a webhook to the WebSocket server so all connected mobile devices refresh their data in real-time.

---

## Task 1: Create WebhookService

**File:** `app/Services/WebhookService.php`

Create a service that:
- Sends HTTP POST requests to the WebSocket server
- Signs payloads with HMAC SHA-256
- Sends signature in `X-Webhook-Signature` header
- Logs errors without throwing exceptions

**Payload format:**
```json
{
  "event": "product:updated",
  "data": { ...model data... }
}
```

**Signature generation:**
```php
$signature = hash_hmac('sha256', json_encode($payload), $secret);
```

**Configuration values to use:**
- URL: `config('services.websocket.url')`
- Secret: `config('services.websocket.secret')`

---

## Task 2: Create ProductObserver

**File:** `app/Observers/ProductObserver.php`

| Method | Event to Dispatch | Payload |
|--------|------------------|---------|
| `created` | `product:created` | Full product array |
| `updated` | `product:updated` | Full product array |
| `updated` | `stock:updated` | `['productId' => $id, 'newStock' => $stock]` (only if stock changed) |
| `deleted` | `product:deleted` | `['id' => $id]` |

Inject `WebhookService` via constructor.

---

## Task 3: Create OrderObserver

**File:** `app/Observers/OrderObserver.php`

| Method | Event to Dispatch | Payload |
|--------|------------------|---------|
| `created` | `order:created` | Full order array |
| `updated` | `order:updated` | Full order array |

Inject `WebhookService` via constructor.

---

## Task 4: Create CategoryObserver

**File:** `app/Observers/CategoryObserver.php`

| Method | Event to Dispatch | Payload |
|--------|------------------|---------|
| `created` | `category:created` | Full category array |
| `updated` | `category:updated` | Full category array |
| `deleted` | `category:deleted` | `['id' => $id]` |

Inject `WebhookService` via constructor.

---

## Task 5: Register Observers

**File:** `app/Providers/AppServiceProvider.php`

In the `boot()` method, register all three observers:

```php
Product::observe(ProductObserver::class);
Order::observe(OrderObserver::class);
Category::observe(CategoryObserver::class);
```

Add the necessary imports at the top of the file.

---

## Task 6: Add Configuration

**File:** `config/services.php`

Add this to the config array:

```php
'websocket' => [
    'url' => env('WEBSOCKET_SERVER_URL', 'http://localhost:3001'),
    'secret' => env('WEBHOOK_SECRET'),
],
```

---

## Task 7: Update Environment Example

**File:** `.env.example`

Add these lines:

```
WEBSOCKET_SERVER_URL=http://localhost:3001
WEBHOOK_SECRET=
```

---

## Event Types Summary

| Event | Trigger |
|-------|---------|
| `product:created` | New product added |
| `product:updated` | Product details edited |
| `product:deleted` | Product removed |
| `stock:updated` | Stock level changed (subset of product:updated) |
| `order:created` | New order/sale completed |
| `order:updated` | Order status or details changed |
| `category:created` | New category added |
| `category:updated` | Category details edited |
| `category:deleted` | Category removed |

---

## Important Notes

1. The `WEBHOOK_SECRET` must match between Laravel and the Node.js WebSocket server
2. Use `Http::timeout(5)` to prevent slow webhooks from blocking requests
3. Wrap HTTP calls in try-catch and log failures (don't throw)
4. The WebSocket server expects the signature in header `X-Webhook-Signature`
5. Content-Type must be `application/json`
