"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeLogsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.changeLogsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'ChangeLogs route working' }));
//# sourceMappingURL=changeLogs.js.map