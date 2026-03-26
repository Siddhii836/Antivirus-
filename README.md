# PackBack – Packaging Return & Reward System

PackBack is a web-based platform designed for urban localities such as Mira Bhayandar to reduce e-commerce packaging waste. It helps residents return cardboard/plastic packaging, enables local collectors to handle pickups, and gives admins control over verification, logistics, and reward policies.

## 1) Problem Statement
High-density residential zones are seeing rapid growth in packaging waste from Amazon/Flipkart and similar deliveries. Municipal systems often lack dedicated reverse logistics and incentivized return loops. PackBack bridges this gap by combining:
- citizen participation,
- collector network workflows,
- reward-based behavior nudges,
- and analytics for local governance.

---

## 2) Technology Stack
- **Frontend:** HTML/CSS/JavaScript (responsive multi-page UI)
- **Backend:** Node.js + Express
- **Database:** In-memory data store in this demo (schema modeled for MongoDB/MySQL migration)

> For production, replace in-memory objects with MongoDB (Mongoose) or MySQL tables using the schema below.

---

## 3) Core Modules

### User Module
- Email signup/login + simulated Google login.
- User dashboard with:
  - total reward points,
  - recycling history,
  - environmental impact (kg waste diverted),
  - leaderboard.
- Return Packaging page:
  - packaging image URL (simulated upload),
  - packaging type selection (cardboard/plastic/mixed),
  - source platform selection (Amazon/Flipkart/Other),
  - pickup scheduling or drop-off point selection.
- Request status tracking.
- Rewards redemption simulation (coupon/cashback catalog).

### Collector Module
- Separate collector login.
- Collector dashboard with assigned pickups.
- Actions: **accept / reject / complete**.
- Daily summary card for completed collections.

### Admin Module
- Admin dashboard for city-level monitoring.
- Verify pending submissions (approve/reject).
- Update reward points policy by packaging type.
- Analytics:
  - total waste collected,
  - area-wise request/completion stats,
  - participation rate.

### Pickup & Logistics
- Date/time pickup scheduling.
- Basic nearest collector assignment by area match.
- Society-based bulk collection supported through pickup flow.
- Drop-off model supported via predefined drop-off points.

### Gamification & Impact
- Points per verified return.
- User leaderboard.
- Impact metric: kg of packaging diverted from landfill.

---

## 4) Database Schema (Design)

## `users`
- `id` (PK / ObjectId)
- `name`
- `email` (unique)
- `password` (nullable for Google users)
- `role` (`user` | `collector` | `admin`)
- `area`
- `society`
- `points`
- `impactKg`
- `createdAt`

## `return_requests`
- `id`
- `userId` (FK -> users)
- `packagingType` (`cardboard` | `plastic` | `mixed`)
- `sourcePlatform` (`Amazon` | `Flipkart` | `Other`)
- `imageUrl`
- `mode` (`pickup` | `dropoff`)
- `pickupDate`
- `pickupTime`
- `dropOffPointId`
- `collectorId` (FK -> users, nullable)
- `status` (`submitted` | `assigned` | `approved` | `rejected` | `accepted` | `completed`)
- `estimatedWeightKg`
- `pointsAwarded`
- `createdAt`
- `updatedAt`

## `rewards_catalog`
- `id`
- `title`
- `cost` (points)
- `type` (`coupon` | `cashback`)

## `redemptions`
- `id`
- `userId`
- `rewardId`
- `pointsUsed`
- `status`
- `createdAt`

## `drop_off_points`
- `id`
- `name`
- `area`
- `hours`

---

## 5) API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`

### User
- `GET /api/users/:userId/dashboard`
- `POST /api/returns`
- `GET /api/dropoff-points`
- `POST /api/redeem`

### Collector
- `GET /api/collectors/:collectorId/requests`
- `PATCH /api/collectors/:collectorId/requests/:requestId`

### Admin
- `GET /api/admin/overview`
- `PATCH /api/admin/requests/:requestId`
- `PATCH /api/admin/rewards`

### Meta
- `GET /api/meta/schema`

---

## 6) UI Layout (Pages)
1. **Home page** (`/`) – mission, quick explanation, module highlights.
2. **Login/Signup** (`/login.html`) – role-based login, email signup, simulated Google login.
3. **User dashboard** (`/user-dashboard.html`) – points, history, leaderboard, redemption cards.
4. **Return packaging page** (`/return-packaging.html`) – upload/meta form, pickup/drop-off workflow.
5. **Collector dashboard** (`/collector-dashboard.html`) – assigned requests and status actions.
6. **Admin dashboard** (`/admin-dashboard.html`) – verification queue, reward rules, analytics.

---

## 7) How to Run
```bash
npm install
npm start
```
Then open: `http://localhost:3000`

### Demo Accounts
- **User:** `priya@example.com` / `password123`
- **Collector:** `collector@example.com` / `password123`
- **Admin:** `admin@example.com` / `password123`

---

## 8) Presentation Explanation (Pitch)
**What PackBack solves:**
- Creates a practical, low-friction reverse-logistics loop for household packaging.
- Turns waste return into a reward-driven citizen action.
- Gives MBMC measurable dashboards to plan zone-wise interventions.

**Why it is implementable:**
- No direct dependency on e-commerce APIs.
- Uses user-submitted proof + collector/admin verification.
- Can launch ward-by-ward and scale to multiple societies.

**Scalability path:**
1. Replace in-memory DB with MongoDB/MySQL.
2. Add OCR/barcode/AI image checks for validation confidence.
3. Add SMS/WhatsApp reminders and collection route optimization.
4. Integrate GIS/maps for cluster-level pickup planning.

**Expected impact in Mira Bhayandar:**
- Lower mixed solid waste volume.
- Better segregation compliance.
- Increased resident participation through gamification and tangible rewards.
