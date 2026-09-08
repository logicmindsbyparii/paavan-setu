# Paavan Setu — Website & Admin Panel

> Bridging Values with Education

## 🚀 Tech Stack

### Frontend
- **React 18** with Create React App
- **Material UI (MUI) v5** — Component library
- **Tailwind CSS 3.4** — Utility-first styling
- **GSAP** — Scroll animations
- **React Router v6** — Client-side routing
- **Axios** — HTTP client

### Backend
- **Express.js** — Web framework
- **MongoDB + Mongoose** — Database
- **JWT** — Authentication
- **Razorpay** — Payment integration
- **Resend** — Email service

---

## 📁 Project Structure

```
paavan-setu/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Presentational primitives
│   │   │   │   ├── BentoGrid.jsx    # BentoGrid + BentoCard + cn()
│   │   │   │   ├── AnimatedText.jsx
│   │   │   │   └── Marquee.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── lib/
│   │   │   ├── api.js           # fetch wrapper + adminRequest
│   │   │   ├── motion.js        # GSAP scoping + reduced-motion
│   │   │   └── razorpay.js      # Checkout flow
│   │   ├── hooks/
│   │   │   └── useContent.js    # Settings/books with bundled fallbacks
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Books.jsx
│   │   │   ├── CareerCounselling.jsx
│   │   │   ├── SchoolsWorkshops.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── PsychometricTests.jsx
│   │   │   ├── Test.jsx
│   │   │   ├── Privacy.jsx
│   │   │   ├── Terms.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── admin/
│   │   │       ├── AdminIndex.jsx        # Routing + auth guard
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── BooksManagement.jsx
│   │   │       ├── OrdersManagement.jsx
│   │   │       ├── CategoriesManagement.jsx
│   │   │       ├── AuthorsManagement.jsx
│   │   │       ├── ContactsManagement.jsx
│   │   │       └── SettingsManagement.jsx
│   │   ├── constants/
│   │   │   ├── tokens.js        # Design tokens
│   │   │   ├── animations.js    # Shared CSS
│   │   │   └── urls.js          # URL constants
│   │   ├── theme/
│   │   │   └── theme.js         # MUI theme
│   │   └── assets/
│   └── .env
│
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── bookController.js
│   │   ├── orderController.js
│   │   ├── categoryController.js
│   │   ├── authorController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Book.js
│   │   ├── Category.js
│   │   ├── Author.js
│   │   ├── Order.js
│   │   ├── Contact.js
│   │   ├── Booking.js
│   │   └── SiteSettings.js
│   ├── utils/
│   │   └── query.js             # Regex escaping + pagination
│   ├── scripts/
│   │   ├── seed.js              # Seed books/categories/settings
│   │   └── admin.js             # Admin account maintenance
│   ├── routes/
│   │   ├── admin.js
│   │   ├── books.js
│   │   ├── orders.js
│   │   ├── categories.js
│   │   ├── authors.js
│   │   ├── settings.js
│   │   ├── contact.js
│   │   └── bookings.js
│   ├── .env
│   └── server.js
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env  # Edit with your credentials
npm install

# Frontend
cd frontend
cp .env.example .env  # Edit with your API URL
npm install
```

### 2. Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RESEND_API_KEY=re_xxxxx
EMAIL_USER=paavan.setu@gmail.com
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 3. Run Development

```bash
# Backend (port 5000)
cd backend
npm run dev

# Frontend (port 3000)
cd frontend
npm start
```

### 4. First Admin Setup

```bash
# Register first admin (only works when no admins exist)
curl -X POST http://localhost:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@paavansetu.com","password":"your_password"}'
```

---

## 📚 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | Get published books |
| GET | `/api/books/:slug` | Get single book |
| GET | `/api/categories` | Get categories |
| GET | `/api/authors` | Get authors |
| GET | `/api/settings` | Get public settings |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/bookings` | Create booking |
| POST | `/api/orders/create-order` | Create Razorpay order |
| POST | `/api/orders/verify-payment` | Verify payment |

### Admin (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/profile` | Get profile |
| GET | `/api/books/admin/all` | Get all books |
| POST | `/api/books/admin` | Create book |
| PUT | `/api/books/admin/:id` | Update book |
| DELETE | `/api/books/admin/:id` | Delete book |
| GET | `/api/orders/admin` | Get all orders |
| PUT | `/api/orders/admin/:id/status` | Update order status |

---

## 🎨 Design System

All tokens live in `frontend/src/constants/tokens.js` (JS) and
`frontend/src/index.css` (CSS custom properties). The MUI theme in
`frontend/src/theme/theme.js` and `tailwind.config.js` both derive from them —
change a colour in one place.

### Brand Colors
- **Green**: `#0a4f22` (Primary)
- **Blue**: `#174a72` (Secondary)
- **Amber**: `#b06e10` (Accent)
- **Rose**: `#c0395a` (Errors, "For Parents" accent)

### Typography
- **Headings**: DM Serif Display
- **Body / UI**: DM Sans

Both are loaded via `<link>` in `public/index.html`.

### Motion
GSAP does not observe `prefers-reduced-motion`, so all entry animations go
through `useRevealAnimation` in `frontend/src/lib/motion.js`. It scopes tweens
with `gsap.context()` (never `ScrollTrigger.getAll().kill()`, which would
destroy other components' triggers) and reveals content outright when the
visitor has reduced motion enabled.

### Site content
Copy on the homepage, footer and contact page is editable from
**Admin → Settings**. The setting keys are a three-way contract between
`backend/scripts/seed.js`, `SettingsManagement.jsx` and the components that read
them — keep all three in step when adding a key.

---

## 🔒 Security

- JWT authentication for admin routes
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 requests/minute)
- Security headers (XSS, CSRF, clickjacking)
- CORS configured for allowed origins
- Environment variables for all secrets
- No secrets exposed to frontend

---

## 🌱 Seeding & admin accounts

```bash
cd backend
node scripts/seed.js            # books, categories, author, settings
node scripts/seed.js --fresh    # wipe those collections first

node scripts/admin.js list
node scripts/admin.js create you@example.com <password> "Your Name"
node scripts/admin.js reset-password you@example.com <newPassword>
```

The API refuses to start without `JWT_SECRET`. Without `MONGODB_URI` it still
serves; the public site falls back to bundled content.

## 📝 TODO

- [ ] Media upload endpoint (`/api/upload` is referenced but not implemented)
- [ ] Book cover upload from the admin panel (covers are currently file paths)
- [ ] Sales analytics charts on the dashboard
- [ ] Email notifications for orders
- [ ] SEO meta tag management
- [ ] Pagination controls in the admin lists (the API paginates; the UI shows page 1)
- [ ] Search box for the admin book/order lists (the API supports `?search=`)

---

## 📄 License

© 2024 Paavan Setu. All rights reserved.
