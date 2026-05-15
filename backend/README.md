# Smart Tracker Backend

Node.js + Express API with Supabase integration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Add your Supabase credentials to `.env`

4. Start development server:
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check endpoint
