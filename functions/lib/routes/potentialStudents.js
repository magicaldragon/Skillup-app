"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.potentialStudentsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.potentialStudentsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'PotentialStudents route working' }));
//# sourceMappingURL=potentialStudents.js.map