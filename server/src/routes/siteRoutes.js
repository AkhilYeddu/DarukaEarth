const express = require('express');
const router = express.Router();
const {
  getSites,
  getSitesGeoJSON,
  getSite,
  createSite,
  updateSite,
  deleteSite,
} = require('../controllers/siteController');
const { getSiteAnalytics, addAnalyticsRecord } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/geojson', getSitesGeoJSON);
router.route('/').get(getSites).post(protect, authorize('admin'), createSite);
router
  .route('/:id')
  .get(getSite)
  .put(protect, authorize('admin'), updateSite)
  .delete(protect, authorize('admin'), deleteSite);

// Nested analytics routes
router
  .route('/:siteId/analytics')
  .get(getSiteAnalytics)
  .post(protect, authorize('admin'), addAnalyticsRecord);

module.exports = router;
