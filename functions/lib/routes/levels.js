"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.levelsRouter = router;
router.get('/test', (_req, res) => res.json({ message: 'Levels route working' }));
//# sourceMappingURL=levels.js.map