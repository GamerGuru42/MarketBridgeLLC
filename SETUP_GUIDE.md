# MarketBridge Setup Guide

Follow these steps to get the MarketBridge application running on your local machine.

## Prerequisites

**You do not have Node.js installed.** You must install it to run this application.

1.  **Download Node.js:** Go to [https://nodejs.org/](https://nodejs.org/) and download the **LTS (Long Term Support)** version for Windows.
2.  **Install:** Run the installer. Accept the defaults.
3.  **Verify:** After installation, open a new terminal (Command Prompt or PowerShell) and run `node -v`. It should print a version number (e.g., `v20.x.x`).

## Step 1: Configure Environment Variables

**✅ DONE**

I have automatically created the `.env.local` file for you with the Supabase credentials you provided.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://byufbsjenomnuuyyezty.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (hidden)

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Step 2: Get Supabase Credentials

**✅ DONE**

You have provided the credentials, and they are now saved in `.env.local`.

## Step 3: Install Dependencies

1.  Open your terminal (PowerShell or Command Prompt).
2.  Navigate to the client directory:
    ```powershell
    cd C:\Users\CBY22\.gemini\antigravity\scratch\Marketbridge\client
    ```
3.  Run the installation command:
    ```powershell
    npm install
    ```
    *Note: I have downgraded React to v18 to ensure compatibility with all libraries. If you see warnings, they are safe to ignore.*

## Step 4: Run the Application

1.  In the same terminal, start the development server:
    ```powershell
    npm run dev
    ```
2.  Open your browser and go to [http://localhost:3000](http://localhost:3000).

## Troubleshooting

*   **"npm is not recognized"**: This means Node.js wasn't installed correctly or you need to restart your terminal/computer after installation.
*   **Database Errors**: Ensure you have run the SQL scripts in `supabase-schema.sql` in your Supabase SQL Editor to create the necessary tables.
