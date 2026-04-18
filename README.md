# CrackRank - Coding Interview Preparation Platform

![CrackRank Banner](crackrankbanner.jpeg)  
*A LeetCode-style platform to ace technical interviews with curated DSA problems, progress tracking, and community support.*

## 🚀 Features

### 📚 Problem Library
- 50+ curated DSA problems tagged by:
  - **Difficulty**: Easy/Medium/Hard
  - **Companies**: Google, Amazon, Meta, etc.
  - **Topics**: Arrays, Graphs, DP, etc.
- Advanced search & filtering

### 💻 Code Editor
- Syntax highlighting (Python/JS/Java)
- Simulated code execution
- Submission history tracking

### 📊 Progress Analytics
- Personalized dashboard showing:
  - Solved problems count
  - Streak tracking (🔥)
  - Accuracy metrics
  - Submission history graph

### 🛠 Admin Tools
- Problem management system
- Content moderation

## 🛠 Tech Stack

**Frontend**:
- React + TypeScript
- Vite (Build Tool)
- Tailwind CSS + shadcn-ui
- Monaco Editor (Code Editor)

**Backend**:
- Node.js (API Routes)
- PostgreSQL (Database)

**Deployment**:
- Vercel (Frontend)
- Supabase (Backend/Database)

## 🏗 Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/himkarsingh/crackrank.git
   cd crackrank
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   Create `.env` file:
   ```bash
   VITE_API_URL=your_api_url
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```
   You can also use `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_KEY` as the key variable name.
4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔐 Auth Setup (Supabase)

1. Open **Supabase Dashboard → Authentication → URL Configuration**.
2. Set **Site URL**:
   - Local: `http://localhost:5173`
   - Production: your deployed domain (for example, `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `http://localhost:5173/`
   - `https://yourdomain.com/`
4. In **Authentication → Providers**, enable only the providers you use:
   - **Email**
   - **Google** (add OAuth client ID/secret)
   - **GitHub** (add OAuth app ID/secret)
5. In Google/GitHub OAuth app settings, add Supabase callback URL:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
6. If email signup is not completing, confirm **Authentication → Email** settings (confirmation email, templates, sender domain).
