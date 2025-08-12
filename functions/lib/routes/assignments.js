"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.assignmentsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'Assignments route working' }));
//# sourceMappingURL=assignments.js.map