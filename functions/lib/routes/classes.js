"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classesRouter = void 0;
// functions/src/routes/classes.ts - Classes API Routes (Placeholder)
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.classesRouter = router;
router.get('/test', (_req, res) => {
    res.json({ message: 'Classes route working' });
});
//# sourceMappingURL=classes.js.map