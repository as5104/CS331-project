import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load .env.local FIRST (before importing the handler)
dotenv.config({ path: '.env.local' });
dotenv.config();

// Dynamically import handler AFTER env vars are loaded
const { default: handler } = await import('./api/create-user.js');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-user', (req, res) => handler(req, res));

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[UniAdmin API] Dev server running on http://localhost:${PORT}`);
    console.log(`[UniAdmin API] SUPABASE_URL loaded: ${process.env.SUPABASE_URL ? 'OK' : 'MISSING'}`);
    console.log(`[UniAdmin API] SERVICE_ROLE_KEY loaded: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING'}`);
});