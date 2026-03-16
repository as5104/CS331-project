import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load .env.local FIRST (before importing the handler)
dotenv.config({ path: '.env.local' });
dotenv.config();

// Dynamically import handlers AFTER env vars are loaded
const [
    { default: createUserHandler },
    { default: recoveryEmailStatusHandler },
    { default: recoveryEmailRequestOtpHandler },
    { default: recoveryEmailVerifyOtpHandler },
    { default: passwordResetRequestOtpHandler },
    { default: passwordResetVerifyOtpHandler },
    { default: passwordResetCompleteHandler },
] = await Promise.all([
    import('./api/create-user.js'),
    import('./api/recovery-email-status.js'),
    import('./api/recovery-email-request-otp.js'),
    import('./api/recovery-email-verify-otp.js'),
    import('./api/password-reset-request-otp.js'),
    import('./api/password-reset-verify-otp.js'),
    import('./api/password-reset-complete.js'),
]);

const app = express();
const allowedOrigins = new Set(
    (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());

app.options('/api/create-user', (req, res) => createUserHandler(req, res));
app.post('/api/create-user', (req, res) => createUserHandler(req, res));

app.options('/api/recovery-email-status', (req, res) => recoveryEmailStatusHandler(req, res));
app.get('/api/recovery-email-status', (req, res) => recoveryEmailStatusHandler(req, res));

app.options('/api/recovery-email-request-otp', (req, res) => recoveryEmailRequestOtpHandler(req, res));
app.post('/api/recovery-email-request-otp', (req, res) => recoveryEmailRequestOtpHandler(req, res));

app.options('/api/recovery-email-verify-otp', (req, res) => recoveryEmailVerifyOtpHandler(req, res));
app.post('/api/recovery-email-verify-otp', (req, res) => recoveryEmailVerifyOtpHandler(req, res));

app.options('/api/password-reset-request-otp', (req, res) => passwordResetRequestOtpHandler(req, res));
app.post('/api/password-reset-request-otp', (req, res) => passwordResetRequestOtpHandler(req, res));

app.options('/api/password-reset-verify-otp', (req, res) => passwordResetVerifyOtpHandler(req, res));
app.post('/api/password-reset-verify-otp', (req, res) => passwordResetVerifyOtpHandler(req, res));

app.options('/api/password-reset-complete', (req, res) => passwordResetCompleteHandler(req, res));
app.post('/api/password-reset-complete', (req, res) => passwordResetCompleteHandler(req, res));

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[UniAdmin API] Dev server running on http://localhost:${PORT}`);
    console.log(`[UniAdmin API] SUPABASE_URL loaded: ${process.env.SUPABASE_URL ? 'OK' : 'MISSING'}`);
    console.log(`[UniAdmin API] SERVICE_ROLE_KEY loaded: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING'}`);
});
