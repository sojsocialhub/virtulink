# VirtuLink Project Migration & Backup Guide

This guide provides the necessary information to back up your project and move it to another hosting provider or local development environment.

## 1. Project Framework Confirmation
- **Frontend/Backend Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + ShadCN UI
- **Database:** Firebase Firestore
- **Authentication:** Firebase Authentication
- **AI Integration:** Genkit (Google Gemini)

## 2. Complete List of Firestore Collections
The application utilizes the following collections in Firestore:
- `users`: Stores user profiles, wallet balances, roles (admin/user), and account metadata.
- `transactions`: Logs all financial activities (funding, purchases, airtime, data).
- `purchase_requests`: Stores manual bank transfer requests and their current approval status.
- `dataPlans`: Catalog of available data bundle products.
- `virtualNumbers`: Catalog of available virtual phone number products.
- `Sociallogs`: Catalog of available social media account products (Social Logs).

## 3. How to Export/Backup Source Code
To download the complete source code of your project:
1. In the **Firebase Studio** sidebar, locate the file explorer.
2. Click on the **Download icon** (usually a cloud with a down arrow or a "Download as ZIP" option in the File menu).
3. This will generate a `.zip` file containing all files, including your configuration and components.

## 4. How to Back Up Firestore Data
Since you are on a free tier without a billing account, you cannot use the automated "Export" feature to Cloud Storage. Instead, use these methods:
- **Manual Backup (Small Data):** Go to the [Firebase Console](https://console.firebase.google.com/), select your project, go to **Firestore Database**, and manually copy the data for critical users/products.
- **CLI Export (Advanced):** If you have Node.js installed locally, you can use the `firebase-tools` CLI to read collections and save them as JSON files.

## 5. Future Migration Strategy
To move this project to another platform (like Vercel or Netlify) without losing data:

### Phase A: The Database (Keep Firebase)
You do **not** need to leave Firebase entirely. The **Firebase Spark (Free) Tier** allows you to keep your Authentication and Firestore database active without a billing account. You only need to move the *Hosting* part.

### Phase B: Moving the Hosting
1. **Push to GitHub:** Create a private repository on GitHub and upload your source code.
2. **Connect to Vercel:** Create a free account on [Vercel](https://vercel.com/). Connect your GitHub repo.
3. **Set Environment Variables:** Copy the variables from your `.env` and `src/firebase/config.ts` into the Vercel dashboard.
4. **Deploy:** Vercel will automatically build and deploy your Next.js app. It will continue to talk to your existing Firebase database.

### Phase C: Moving away from Firebase (Optional)
If you want to leave Firebase entirely in the future:
1. **Database:** Look into **Supabase** (PostgreSQL). You will need to rewrite the data fetching logic in `src/firebase/` to use the Supabase client.
2. **Authentication:** Supabase also provides Auth services similar to Firebase.

## 6. Local Development
You can run this project on your own computer:
1. Install [Node.js](https://nodejs.org/).
2. Extract your downloaded project ZIP.
3. Open a terminal in that folder and run:
   ```bash
   npm install
   npm run dev
   ```
4. Your app will be available at `http://localhost:3000`.
