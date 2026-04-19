# LifeSync

A full-stack subscription management and analytics platform built to help users take control of their recurring expenses. LifeSync provides real-time spending insights, budget tracking, and intelligent alerts — so nothing slips through the cracks.

---

## Overview

Managing subscriptions across entertainment, productivity, and utilities is easy to lose track of. LifeSync consolidates everything into a single dashboard that surfaces spending trends, flags financial hotspots, and reminds you of upcoming renewals. From monthly streaming services to annual software licenses, LifeSync keeps your finances in sync.

---

## Features

**Authentication**
- Secure registration and login with bcrypt-hashed passwords
- JWT-based session persistence for protected routes
- Route-level access control for authenticated users only

**Dashboard**
- Financial snapshot showing monthly, yearly, and daily spend at a glance
- Active subscription counter
- Live budget progress bar tracking spend against a user-defined monthly limit

**Subscription Management**
- Add subscriptions from a predefined library (Netflix, Spotify, etc.) or create custom entries
- Categorize expenses — Entertainment, Productivity, Utilities, and more
- Full create, edit, and delete support for subscription records

**Insights**
- Spending growth card with month-over-month delta and budget status
- High dependency alert when a single subscription dominates total spend
- Renewal load detection for periods with concentrated billing
- Category contribution breakdown to identify top spending areas

---

## Key Logic

**High Dependency**  
Calculates the share of total monthly spend occupied by the most expensive subscription.  
`(Highest Subscription Price / Total Monthly Spend) * 100`

**Budget Status**  
Dynamically tracks remaining balance against the user's budget. Shifts to an exceeded state with visual warnings when the limit is breached.

**Category Contribution**  
Groups subscriptions by category, aggregates spend per group, and surfaces where the majority of money is going — supporting informed cancellation decisions.

---

## Tech Stack

**Frontend**
- React (Vite)
- Context API for global state management
- CSS with glassmorphism design system
- Lucide React for iconography

**Backend**
- Node.js and Express.js
- MongoDB with Mongoose ODM

**Authentication**
- JSON Web Tokens (JWT)

---

## Project Structure

```
lifesync/
├── client/
│   └── src/
│       ├── components/   # Reusable UI elements (Modals, Cards, Navbar)
│       ├── pages/        # Top-level views (Dashboard, Login, Insights)
│       ├── context/      # Auth and subscription state providers
│       ├── utils/        # Formatting and calculation helpers
│       └── constants/    # Predefined apps and category definitions
└── server/
    ├── controllers/      # API request handlers
    ├── models/           # Mongoose schemas (Users, Subscriptions)
    ├── routes/           # Express route definitions
    └── middleware/       # JWT verification and error handling
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A MongoDB Atlas account or local MongoDB instance

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lifesync.git
cd lifesync
```

### 2. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the Application

```bash
# Start the backend
cd server
npm run dev

# Start the frontend (in a separate terminal)
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Testing the Application

1. Register a new account and log in
2. Set a monthly budget from the Dashboard
3. Add at least 3–4 subscriptions using both predefined and custom entries
4. Verify that total spend updates correctly on the Dashboard
5. Navigate to the Insights tab and confirm that high dependency and category contribution alerts trigger as expected

---

## Roadmap

- AI spend prediction using historical data to forecast future charges
- Multi-currency support with real-time exchange rate conversion
- Browser and mobile push notifications for upcoming renewals
- Read-only bank integration to auto-detect and sync subscription charges

---

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

Developed by [Aenish Khullar/ Altawebstudio.xyz]