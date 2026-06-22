"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'smartapply-secret-key-12345';
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader)
        return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        const value = decodeURIComponent(parts.join('='));
        if (name) {
            list[name] = value;
        }
    });
    return list;
}
function authenticateJWT(req, res, next) {
    let token;
    // 1. Try reading from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // 2. Try reading from Cookies
    if (!token && req.headers.cookie) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies['sa_token'];
    }
    if (token) {
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = decoded;
            next();
        });
    }
    else {
        res.status(401).json({ error: 'Authorization token required' });
    }
}
//# sourceMappingURL=auth.js.map