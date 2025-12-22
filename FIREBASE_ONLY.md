# Using Firebase Firestore Only (No MongoDB)

Since you already have Firebase Firestore set up, we can use it for ALL data storage instead of MongoDB. This simplifies your architecture significantly.

## Architecture Change

### Before (Hybrid)
- **Firebase Firestore**: Users only
- **MongoDB**: Listings, Orders, Chats, Reviews, Escrow

### After (Firebase Only)
- **Firebase Firestore**: Everything (Users, Listings, Orders, Chats, Reviews, Escrow)

## Benefits

✅ **Simpler**: One database instead of two
✅ **Cheaper**: No MongoDB Atlas subscription needed
✅ **Faster**: No need to sync between two databases
✅ **Easier deployment**: Only Firebase credentials needed
✅ **Better integration**: Everything uses the same Firebase SDK

## What Needs to Change

### Remove MongoDB Dependencies

In `client/package.json`, you DON'T need:
- ❌ `mongodb` package

### Update Firestore Collections

Your Firestore database will have these collections:

```
firestore/
├── users/              (already exists)
├── listings/           (new)
├── orders/             (new)
├── chats/              (new)
├── messages/           (new)
├── reviews/            (new)
├── escrow/             (new)
├── reports/            (new)
└── contacts/           (new)
```

### Environment Variables Needed

You only need Firebase variables (no MongoDB):

```env
# Client-side (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server-side (for API routes)
JWT_SECRET=your_secret
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_CERT_URL=...
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_ENCRYPTION_KEY=...
```

## Updated Dependencies

Install only these packages:

```bash
cd client
npm install jose bcryptjs firebase-admin @types/bcryptjs
```

**No need for `mongodb` package!**

## Next Steps

I can update all the API routes to use Firestore instead of MongoDB. This means:

1. Remove `mongodb.ts` utility
2. Update all API routes to use Firestore
3. Simpler deployment (no MongoDB connection string needed)
4. Everything works with your existing Firebase project

Would you like me to update the code to use Firebase Firestore only?
