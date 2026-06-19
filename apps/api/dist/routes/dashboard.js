"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@smartapply/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /dashboard/stats
router.get('/stats', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 1. Jobs Scraped (Total jobs available in database)
        const jobsScraped = await database_1.prisma.job.count();
        // 2. Jobs Matched (Total jobs matched for the user)
        const jobsMatched = await database_1.prisma.jobMatch.count({
            where: { userId },
        });
        // 3. Application status breakdown
        const applications = await database_1.prisma.application.findMany({
            where: { userId },
        });
        const statusCounts = {
            Saved: 0,
            Applied: 0,
            Interview: 0,
            Rejected: 0,
            Offer: 0,
        };
        applications.forEach(app => {
            const status = app.status;
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });
        // Applications Sent (Applied + Interview + Rejected + Offer)
        const applicationsSent = statusCounts.Applied + statusCounts.Interview + statusCounts.Rejected + statusCounts.Offer;
        // Interview Rate: Interviews / Total Applications Sent
        const interviewRate = applicationsSent > 0
            ? Math.round((statusCounts.Interview / applicationsSent) * 100)
            : 0;
        // Offer Rate: Offers / Total Applications Sent
        const offerRate = applicationsSent > 0
            ? Math.round((statusCounts.Offer / applicationsSent) * 100)
            : 0;
        res.json({
            jobsScraped,
            jobsMatched,
            applicationsSent,
            interviewRate,
            offerRate,
            statusCounts,
        });
    }
    catch (error) {
        console.error('Fetch dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map