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

## 3. Mobile Navigation & Download Instructions
If you are using a mobile phone, the interface is hidden behind menus:

### How to find the Files (Explorer)
1. Tap the **Hamburger Menu (≡)** in the top-left corner.
2. Tap the **Overlapping Squares icon** at the top of the sidebar. This is the **Explorer**.
3. You will now see your folders (`src`, `docs`, etc.).

### How to Download as ZIP
1. Open the **Explorer** (as described above).
2. Look at the very top of the Explorer pane (next to the word "FILES").
3. Tap the **three vertical dots (⋮)** menu.
4. Select **"Download as ZIP"**. This saves your entire project to your phone.

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
