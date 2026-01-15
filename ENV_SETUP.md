# Environment Variables Setup

This document outlines all required environment variables for the Marketbridge application.

Since we have migrated to a full Next.js stack (Frontend + API Routes), all environment variables are managed in the `client` directory.

## Client Environment Variables (.env.local in /client)

Create a `.env.local` file in the `client` directory with the following content:

```env
# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# JWT Secret (for API authentication)
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# Firebase Admin SDK Configuration (Server-side only)
# These are used by the API routes to interact with Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK Configuration (Public)
# These are exposed to the browser for authentication and basic app features
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Flutterwave Configuration (Payment Processing)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxxxxxxxxxxxxxxx
```

## How to Get These Values

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. For **Client SDK Config** (starts with `NEXT_PUBLIC_`):
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click on the web app icon (</>) or add a new web app
   - Copy the config values to your `.env.local`

4. For **Admin SDK Config** (Server-side):
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Extract `project_id`, `client_email`, and `private_key`
   - **IMPORTANT**: For `FIREBASE_PRIVATE_KEY`, ensure the newlines (`\n`) are preserved correctly. In Vercel, you can copy the whole string including quotes.

### Flutterwave

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Sign up or log in
3. Go to Settings > API Keys
4. Copy your Public Key, Secret Key, and Encryption Key
5. **For Testing**: Use the test keys (they start with `FLWPUBK-TEST` and `FLWSECK-TEST`)
6. **For Production**: Use the live keys

### JWT Secret

Generate a random string for JWT_SECRET:
```bash
# On Linux/Mac:
openssl rand -base64 64

# Or use any random string generator
```

## Installation Steps

1. **Setup**:
   ```bash
   cd client
   npm install
   # Create .env.local file with the variables above
   npm run dev
   ```

## Security Notes

- **Never commit** `.env.local` to version control
- It is already added to `.gitignore`
- Use different keys for development and production
- Rotate secrets regularly
- **Vercel Deployment**: Add these variables in the Vercel Project Settings > Environment Variables.

