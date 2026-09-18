const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getPlatformStats,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats/macro', getPlatformStats);
router.route('/').get(getProjects).post(protect, authorize('admin'), createProject);
router
  .route('/:id')
  .get(getProject)
  .put(protect, authorize('admin'), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

module.exports = router;
