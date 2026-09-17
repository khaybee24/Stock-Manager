const express = require('express');

const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');

router.get('/', dashboardController.getDashboard);
router.get('/history', dashboardController.getDailyHistory);

module.exports = router;