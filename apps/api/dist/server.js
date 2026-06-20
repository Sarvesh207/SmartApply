"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("@smartapply/database");
const app_1 = __importDefault(require("./app"));
// Initialize env
dotenv_1.default.config({ path: '../../.env' });
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Connect to db and start server
async function start() {
    try {
        await database_1.prisma.$connect();
        console.log('Successfully connected to PostgreSQL database');
        app_1.default.listen(PORT, () => {
            console.log(`SmartApply API server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map