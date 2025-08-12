"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.submissionsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'Submissions route working' }));
//# sourceMappingURL=submissions.js.map