const Project = require('../models/Project');
const Site = require('../models/Site');
const Analytics = require('../models/Analytics');

// @desc    Get all projects with site count and hectares summary
// @route   GET /api/projects
// @access  Public / Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    // Enrich each project with site counts and total hectares
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const sites = await Site.find({ projectId: project._id }).select(
          '_id name areaHectares healthStatus biome center'
        );
        const totalHectares = sites.reduce((sum, s) => sum + (s.areaHectares || 0), 0);
        return {
          ...project.toObject(),
          siteCount: sites.length,
          totalHectares: Math.round(totalHectares * 100) / 100,
          sites,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedProjects.length,
      data: enrichedProjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public / Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id ${req.params.id}`,
      });
    }

    const sites = await Site.find({ projectId: project._id });
    const totalHectares = sites.reduce((sum, s) => sum + (s.areaHectares || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        sites,
        siteCount: sites.length,
        totalHectares: Math.round(totalHectares * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin)
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      projectType,
      status,
      country,
      region,
      targetCreditsTonnes,
      standard,
      leadDeveloper,
    } = req.body;

    if (!name || !description || !country || targetCreditsTonnes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, country, and target credits',
      });
    }

    const project = await Project.create({
      name,
      description,
      projectType: projectType || 'Reforestation',
      status: status || 'Active',
      country,
      region: region || '',
      targetCreditsTonnes: Number(targetCreditsTonnes),
      standard: standard || 'Verra VCS',
      leadDeveloper: leadDeveloper || (req.user ? req.user.name : 'Darukaa Operations'),
      createdBy: req.user ? req.user.id : req.body.createdBy,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin)
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id ${req.params.id}`,
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete project and its sites
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id ${req.params.id}`,
      });
    }

    // Delete associated sites and analytics
    const sites = await Site.find({ projectId: project._id });
    const siteIds = sites.map((s) => s._id);

    await Analytics.deleteMany({ siteId: { $in: siteIds } });
    await Site.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and all associated sites & analytics successfully deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get global platform macro stats
// @route   GET /api/projects/stats/macro
// @access  Public
exports.getPlatformStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalSites = await Site.countDocuments();
    const sites = await Site.find().select('areaHectares');
    const totalHectares = sites.reduce((acc, s) => acc + (s.areaHectares || 0), 0);

    // Aggregate latest carbon sequestration metrics across all sites
    const latestAnalytics = await Analytics.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$siteId',
          latestCarbon: { $first: '$cumulativeCarbonTonnes' },
          latestNdvi: { $first: '$ndvi' },
          latestBiodiversity: { $first: '$biodiversityScore' },
        },
      },
    ]);

    const totalCarbonTonnes = latestAnalytics.reduce(
      (acc, item) => acc + (item.latestCarbon || 0),
      0
    );

    const avgNdvi =
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((acc, item) => acc + (item.latestNdvi || 0), 0) /
          latestAnalytics.length
        : 0.68;

    const avgBiodiversity =
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((acc, item) => acc + (item.latestBiodiversity || 0), 0) /
          latestAnalytics.length
        : 82;

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalSites,
        totalHectares: Math.round(totalHectares * 10) / 10,
        totalCarbonTonnes: Math.round(totalCarbonTonnes),
        avgNdvi: Math.round(avgNdvi * 100) / 100,
        avgBiodiversityScore: Math.round(avgBiodiversity),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
