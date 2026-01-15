# MarketBridge - Nigeria's First Trustless Marketplace

A modern e-commerce platform built with Next.js and Express, featuring JWT authentication, Firebase/Firestore database, and a trustless marketplace concept where transparency replaces blind trust.

## 🚀 Features

### Authentication & Security
- Email/Password and **Google OAuth** authentication
- **Vendor verification** with document uploads (NIN, CAC, ID)
- JWT-based authentication with Firebase
- Rate limiting and IP tracking
- Role-based access control (Customer, Dealer, Admin, CEO, Operations, Technical, Marketing)

### For Customers
- Browse verified dealer listings
- **Location-based dealer search**
- **Wishlist/Favorites** functionality
- Shopping cart with localStorage persistence
- **Secure escrow payments** via Flutterwave
- **Dispute filing** and resolution
- Chat with dealers (with reporting capability)
- Order tracking with visual timeline
- Transparent pricing with verified badges

### For Dealers
- **Comprehensive vendor dashboard** with analytics
- Create and manage product listings
- **Inventory management** interface
- View and manage orders
- **Order tracking & sales analytics**
- **Payout notifications**
- Document verification system
- Verification badge system

### For Admins
- **Multi-role admin system** (Technical, Operations, Marketing)
- **User management** and dealer verification
- **Dispute resolution** interface with refund/release options
- **Executive memo board** for internal communication
- Real-time analytics dashboard
- Pending dealer approvals
- System monitoring and security

### Payments & Security
- **Escrow payment system** with Flutterwave integration
- Automatic fund release after delivery confirmation
- **Dispute management** with admin resolution
- Refund processing
- Secure payment callbacks
- Rate limiting (100 requests per 15 minutes)
- IP tracking for audit trails
- Helmet.js for HTTP headers

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components (shadcn/ui inspired)
- **State Management**: React Context API
- **Authentication**: Firebase Client SDK
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Databases**: 
  - Firebase Firestore (User authentication and profiles)
  - MongoDB (Listings, Orders, Chats, Reviews, Escrow)
- **Authentication**: Firebase Admin SDK + JWT
- **Payments**: Flutterwave API
- **Security**: Helmet, express-rate-limit, IP tracking
- **Password Hashing**: bcryptjs

## 📦 Project Structure

```
marketbridge/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts (Auth, Cart)
│   └── lib/              # Utilities and API client
├── server/                # Express backend
│   ├── config/           # Firebase configuration
│   ├── middleware/       # Auth middleware
│   ├── models/           # Firestore models
│   └── routes/           # API routes
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- Firebase service account credentials

### 1. Clone the Repository

```bash
git clone https://github.com/emailseconder-cpu/Marketbridge.git
cd Marketbridge
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit http://localhost:3000 to see the app!

## 📱 Key Pages

### Public Pages
- `/` - Homepage with trustless marketplace messaging
- `/about` - Explanation of trustless marketplace concept
- `/faq` - Frequently asked questions
- `/listings` - Browse all products with filters
- `/listings/[id]` - Product detail page
- `/login` - Login with email or Google
- `/signup` - Register as customer or dealer

### Customer Pages
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/orders` - Order history and tracking
- `/wishlist` - Saved favorite listings
- `/payment/callback` - Payment verification

### Dealer Pages
- `/vendor/dashboard` - Vendor dashboard with analytics
- `/dealer/listings` - Manage listings
- `/dealer/listings/new` - Create new listing
- `/dealer/listings/[id]/edit` - Edit listing

### Admin Pages
- `/admin` - Admin dashboard (role-based views)
- `/admin/users` - User management
- `/admin/disputes` - Dispute resolution
- `/admin/executive-chat` - Internal memo board

## 🔐 Authentication

- JWT-based authentication
- Secure password hashing with bcryptjs
- Role-based access control (customer/dealer)
- Protected routes for authenticated users

## 🗄️ Database Schema

### Users Collection
- Email, password (hashed), display name
- Role (customer/dealer)
- Location, business info (for dealers)
- Verification status

### Listings Collection
- Title, description, price, category
- Images, location
- Dealer reference
- Status (active/inactive)

### Orders Collection
- Customer and listing references
- Quantity, total amount
- Shipping address, phone number
- Status (pending/confirmed/shipped/delivered)
- Order notes

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory to `client`
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set root directory to `server`
3. Add all environment variables
4. Deploy

See [production_deployment.md](./production_deployment.md) for detailed instructions.

## 🎯 Beta Features

- ✅ Complete e-commerce flow
- ✅ JWT authentication
- ✅ Dealer management
- ✅ Order tracking
- ✅ Shopping cart
- ✅ Checkout process
- ✅ Trustless marketplace messaging
- ⏳ Review system (coming soon)
- ⏳ Messaging system (coming soon)

## 🤝 Contributing

This is a beta project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for Nigeria's e-commerce future

## 🙏 Acknowledgments

- shadcn/ui for beautiful components
- Vercel for Next.js
- Firebase for database
- Railway for backend hosting

---

**MarketBridge** - Shop Without Trust 🛡️
