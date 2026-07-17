# API Reference

All endpoints are mounted under `/api`. Admin routes require a `Bearer <token>` Authorization header.

---

## Response Format

All successful responses:
```json
{ "success": true, "data": <payload> }
```

All error responses:
```json
{ "success": false, "error": "Human-readable message", "code": "ERR_NOT_FOUND" }
```

Error codes: `ERR_BAD_REQUEST`, `ERR_UNAUTHORIZED`, `ERR_FORBIDDEN`, `ERR_NOT_FOUND`, `ERR_CONFLICT`, `ERR_INTERNAL`, `ERR_TOO_MANY`, `ERR_VALIDATION`.

---

## Public — Health

### `GET /api/health`

**Response** `200`
```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

## Public — Menu

### `GET /api/menu/full`

Returns categories with their items nested inside.

**Response** `200`
```json
[
  {
    "id": "wings",
    "number": "01",
    "title": "Crispies Style Wings",
    "image": "https://...",
    "sort_order": 0,
    "created_at": "...",
    "updated_at": "...",
    "items": [
      {
        "id": "wings-5",
        "category_id": "wings",
        "name": "5 Wings",
        "description": "Five crispy golden wings...",
        "price": 5.99,
        "image": "https://...",
        "badge": null,
        "badge_variant": null,
        "sort_order": 0,
        "active": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
]
```

---

### `GET /api/menu/categories`

Flat list of menu categories.

**Query params** — none

**Response** `200` — `MenuCategory[]`

---

### `GET /api/menu/items`

Flat list of menu items (active only).

**Query params** — `?category_id=wings` (optional filter)

**Response** `200` — `MenuItem[]`

---

### `GET /api/menu/deals`

Active deals only.

**Response** `200` — `Deal[]`

---

## Public — Store

### `GET /api/store/locations`

All store locations.

**Response** `200`
```json
[
  {
    "id": "brixton",
    "name": "Crispies Brixton",
    "address": "45 Electric Lane, Brixton, London SW9 8JZ",
    "hours": "11:00 AM – 11:00 PM",
    "phone": "+44 20 7946 0123",
    "lat": null,
    "lng": null,
    "sort_order": 0,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### `GET /api/store/locations/:id`

Single location by ID.

**Response** `200` — `Location`
**Error** `404` — Not found

---

### `GET /api/store/location`

Returns location stored in the `crispy_location_id` cookie, or `null`.

**Response** `200`
```json
{ "success": true, "data": { ... } }
```

**Response** `200` (no cookie)
```json
{ "success": true, "data": null }
```

---

### `PATCH /api/store/location`

Sets `crispy_location_id` cookie to remember the user's preferred store.

**Request body**
```json
{ "location_id": "brixton" }
```

**Response** `200` — Location object
**Error** `400` — Missing or invalid `location_id`

---

### `GET /api/store/settings`

Business settings (delivery fee, free delivery threshold).

**Response** `200`
```json
{
  "id": 1,
  "delivery_fee": 2.99,
  "free_delivery_threshold": 20,
  "updated_at": "..."
}
```

---

## Public — Actions

### `POST /api/orders`

Create an order.

**Request body**
```json
{
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+44 7123 456789",
  "address": "123 High Street",
  "postcode": "SW1A 1AA",
  "city": "London",
  "notes": "Ring the bell",
  "fulfilment": "delivery",
  "payment_method": "card",
  "location_id": "brixton",
  "subtotal": 15.97,
  "delivery_fee": 2.99,
  "total": 18.96,
  "items": [
    {
      "menu_item_id": "wings-5",
      "name": "5 Wings",
      "price": 5.99,
      "quantity": 2
    }
  ]
}
```

`address` / `postcode` / `city` can be `null` for collection.
`location_id` is optional — falls back to cookie if not provided.

**Response** `201` — Created order
**Error** `400` — Validation failed

---

### `POST /api/contact`

Submit a contact form message.

**Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Order enquiry",
  "message": "I had a question about...",
  "type": "general"
}
```

`type` must be one of: `general`, `franchise`, `careers`, `press`.

**Response** `201` — Created message
**Error** `400` — Validation failed

---

### `POST /api/jobs/:id/apply`

Submit a job application for the given job post.

**Request body**
```json
{
  "job_post_id": "kitchen-staff-brixton",
  "applicant_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+44 7123 456789",
  "cv_url": "https://...",
  "cover_letter": "I am very interested..."
}
```

**Response** `201` — Created application
**Error** `400` — Validation failed

---

## Admin — Auth

### `POST /api/admin/auth/login`

Login with email and password via Supabase Auth, then checks admin profile.

**Request body**
```json
{ "email": "admin@crispies.com", "password": "..." }
```

**Response** `200`
```json
{
  "token": "eyJhbGciOiJI...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "admin" }
}
```

**Error** `401` — Invalid email or password
**Error** `403` — Not authorized as admin

---

### `GET /api/admin/auth/me`

Returns the authenticated admin's profile. Requires `Authorization: Bearer <token>`.

**Response** `200` — `AdminProfile`
**Error** `401` — Missing or invalid token

---

## Admin — Categories

### `GET /api/admin/categories`

List all categories (full menu with nested items).

### `GET /api/admin/categories/:id`

Single category by ID.

**Error** `404` — Not found

### `POST /api/admin/categories`

**Request body**
```json
{
  "id": "wings",
  "number": "01",
  "title": "Wings",
  "image": "https://...",
  "sort_order": 0
}
```

`id` is auto-generated via UUID if omitted.

**Response** `201` — Created category

### `PUT /api/admin/categories/:id`

Partial update (any field optional).

### `DELETE /api/admin/categories/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Menu Items

### `GET /api/admin/menu`

List all menu items (includes inactive). `?category_id=wings` to filter.

### `GET /api/admin/menu/:id`

Single menu item by ID.

**Error** `404` — Not found

### `POST /api/admin/menu`

**Request body**
```json
{
  "category_id": "wings",
  "name": "5 Wings",
  "description": "Five crispy golden wings...",
  "price": 5.99,
  "image": "https://...",
  "badge": null,
  "badge_variant": null,
  "sort_order": 0,
  "active": true
}
```

`id` is auto-generated via UUID if omitted.

**Response** `201` — Created item

### `PUT /api/admin/menu/:id`

Partial update.

### `DELETE /api/admin/menu/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Deals

### `GET /api/admin/deals`

List all deals (including inactive).

### `POST /api/admin/deals`

**Request body**
```json
{
  "name": "Wing + Side Combo",
  "description": "7 wings plus loaded fries...",
  "price": 9.99,
  "image": "https://...",
  "badge": "Popular",
  "badge_variant": null,
  "active": true
}
```

**Response** `201` — Created deal

### `PUT /api/admin/deals/:id`

Partial update.

### `PATCH /api/admin/deals/:id/toggle`

Flips the `active` boolean.

### `DELETE /api/admin/deals/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Orders

### `GET /api/admin/orders`

List orders. `?status=pending` or `?location_id=brixton` to filter.

### `GET /api/admin/orders/:id`

Single order with its items nested.

**Response** `200`
```json
{
  "order": { ... },
  "items": [ ... ]
}
```

**Error** `404` — Not found

### `PATCH /api/admin/orders/:id/status`

**Request body**
```json
{ "status": "preparing" }
```

Status values: `pending`, `preparing`, `ready`, `out-for-delivery`, `delivered`, `cancelled`.

---

## Admin — Locations

### `GET /api/admin/locations`

All locations.

### `POST /api/admin/locations`

**Request body**
```json
{
  "name": "Crispies Brixton",
  "address": "45 Electric Lane, London SW9 8JZ",
  "hours": "11:00 AM – 11:00 PM",
  "phone": "+44 20 7946 0123",
  "lat": 51.4613,
  "lng": -0.1155,
  "sort_order": 0
}
```

`id` is auto-generated via UUID. `sort_order` defaults to `0`.

### `PATCH /api/admin/locations/:id`

Partial update (any field).

### `DELETE /api/admin/locations/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Settings

### `GET /api/admin/settings`

Business settings (singleton row).

### `PUT /api/admin/settings`

**Request body**
```json
{ "delivery_fee": 2.99, "free_delivery_threshold": 20 }
```

---

## Admin — Jobs

### `GET /api/admin/jobs`

List job posts. `?status=active` to filter.

### `GET /api/admin/jobs/:id`

Single job post by ID.

**Error** `404` — Not found

### `POST /api/admin/jobs`

**Request body**
```json
{
  "title": "Kitchen Staff",
  "location": "Brixton",
  "type": "Full-time",
  "salary": "£11.50/hr",
  "description": "We are looking for...",
  "requirements": ["Experience preferred", "Team player"],
  "status": "active"
}
```

`id` is auto-generated via UUID. `applications` starts at `0`.

**Response** `201` — Created job post

### `PUT /api/admin/jobs/:id`

Partial update (any field).

### `PATCH /api/admin/jobs/:id/status`

**Request body**
```json
{ "status": "closed" }
```

Status values: `draft`, `active`, `closed`.

### `DELETE /api/admin/jobs/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Job Applications

### `GET /api/admin/job-applications`

List job applications. `?job_post_id=kitchen-staff-brixton` or `?status=pending` to filter.

### `GET /api/admin/job-applications/:id`

Single application by ID.

**Error** `404` — Not found

### `POST /api/admin/job-applications`

**Request body**
```json
{
  "job_post_id": "kitchen-staff-brixton",
  "applicant_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+44 7123 456789",
  "cv_url": "https://...",
  "cover_letter": "I am very interested..."
}
```

**Response** `201` — Created application

### `PUT /api/admin/job-applications/:id`

Partial update (any field — notes, status, etc.).

### `PATCH /api/admin/job-applications/:id/status`

**Request body**
```json
{ "status": "reviewed" }
```

Status values: `pending`, `reviewed`, `shortlisted`, `rejected`, `hired`.

### `DELETE /api/admin/job-applications/:id`

**Response** `200` — `{ "deleted": true }`

---

## Admin — Dashboard

### `GET /api/admin/dashboard/stats`

**Response** `200`
```json
{
  "total_orders": 42,
  "active_orders": 5,
  "revenue": 456.78,
  "today_revenue": 89.50
}
```

---

## Rate Limiting

- **Global**: 100 requests per 15 minutes per IP (skipped for admin routes)
- **Auth routes** (`/api/admin/auth`): 10 requests per 15 minutes per IP
- **Health check** (`/health`) is exempt
