"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRecordsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.studentRecordsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'StudentRecords route working' }));
//# sourceMappingURL=studentRecords.js.map