const turf = require('@turf/turf');
const Site = require('../models/Site');
const Project = require('../models/Project');
const Analytics = require('../models/Analytics');

// Helper to validate and calculate GeoJSON polygon properties
const processPolygonGeometry = (coordinates) => {
  // Ensure coordinates array exists
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error('Polygon coordinates must be a non-empty array of rings');
  }

  const ring = coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    throw new Error('A polygon ring must have at least 4 coordinate points [lng, lat]');
  }

  // Ensure polygon is closed (first point equals last point)
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  // Create turf polygon feature
  const polygonFeature = turf.polygon(coordinates);

  // Calculate area in square meters and convert to hectares (1 ha = 10,000 m2)
  const areaSqMeters = turf.area(polygonFeature);
  const areaHectares = Math.round((areaSqMeters / 10000) * 100) / 100;

  // Calculate centroid
  const centroid = turf.centroid(polygonFeature);
  const center = {
    type: 'Point',
    coordinates: centroid.geometry.coordinates,
  };

  return {
    normalizedCoordinates: coordinates,
    areaHectares: Math.max(0.01, areaHectares),
    center,
  };
};

// @desc    Get all sites, optionally filtered by projectId
// @route   GET /api/sites
// @access  Public
exports.getSites = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const sites = await Site.find(filter).populate('projectId', 'name projectType status country');

    res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all sites formatted as a GeoJSON FeatureCollection (optimized for Mapbox)
// @route   GET /api/sites/geojson
// @access  Public
exports.getSitesGeoJSON = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const sites = await Site.find(filter).populate('projectId', 'name projectType status country');

    const featureCollection = {
      type: 'FeatureCollection',
      features: sites.map((site) => ({
        type: 'Feature',
        id: site._id,
        geometry: site.geometry,
        properties: {
          id: site._id,
          name: site.name,
          description: site.description,
          areaHectares: site.areaHectares,
          biome: site.biome,
          healthStatus: site.healthStatus,
          canopyTargetPct: site.canopyTargetPct,
          baselineYear: site.baselineYear,
          center: site.center.coordinates,
          projectName: site.projectId ? site.projectId.name : 'Unknown Project',
          projectType: site.projectId ? site.projectId.projectType : 'Conservation',
          projectId: site.projectId ? site.projectId._id : null,
        },
      })),
    };

    res.status(200).json(featureCollection);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single site by ID
// @route   GET /api/sites/:id
// @access  Public
exports.getSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id).populate(
      'projectId',
      'name description projectType status country targetCreditsTonnes standard'
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found with id ${req.params.id}`,
      });
    }

    // Fetch latest telemetry summary
    const latestAnalytics = await Analytics.findOne({ siteId: site._id }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: site,
      latestMetrics: latestAnalytics || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new site with polygon drawing
// @route   POST /api/sites
// @access  Private (Admin)
exports.createSite = async (req, res) => {
  try {
    const {
      projectId,
      name,
      description,
      geometry,
      biome,
      baselineYear,
      baselineBiomassTonnesPerHa,
      targetAnnualSequestrationTonnes,
      canopyTargetPct,
      healthStatus,
      tags,
    } = req.body;

    if (!projectId || !name || !geometry || !geometry.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId, name, and GeoJSON polygon geometry coordinates',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Associated project not found with id ${projectId}`,
      });
    }

    // Process and validate polygon coordinates with Turf
    const { normalizedCoordinates, areaHectares, center } = processPolygonGeometry(
      geometry.coordinates
    );

    const site = await Site.create({
      projectId,
      name,
      description: description || '',
      geometry: {
        type: 'Polygon',
        coordinates: normalizedCoordinates,
      },
      center,
      areaHectares,
      biome: biome || 'Tropical Rainforest',
      baselineYear: baselineYear || 2021,
      baselineBiomassTonnesPerHa: baselineBiomassTonnesPerHa || 50,
      targetAnnualSequestrationTonnes:
        targetAnnualSequestrationTonnes || Math.round(areaHectares * 8.5),
      canopyTargetPct: canopyTargetPct || 75,
      healthStatus: healthStatus || 'Recovering',
      tags: tags || [],
      createdBy: req.user ? req.user.id : null,
    });

    // Auto-generate initial historical telemetry record so site immediately has analytics
    const initialCarbon = Math.round(areaHectares * 2.2);
    await Analytics.create({
      siteId: site._id,
      timestamp: new Date(),
      period: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      ndvi: 0.65,
      evi: 0.48,
      canopyCoverPct: canopyTargetPct ? Math.min(canopyTargetPct, 62) : 62,
      biomassDensityTonnesPerHa: baselineBiomassTonnesPerHa || 50,
      cumulativeCarbonTonnes: initialCarbon,
      annualCarbonSequestrationTonnes: Math.round(areaHectares * 6.8),
      biodiversityScore: 78,
      sensorSource: 'Sentinel-2 MSI (ESA Copernicus)',
    });

    res.status(201).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private (Admin)
exports.updateSite = async (req, res) => {
  try {
    let site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found with id ${req.params.id}`,
      });
    }

    const updateData = { ...req.body };

    // If geometry was updated, recalculate area and centroid
    if (updateData.geometry && updateData.geometry.coordinates) {
      const { normalizedCoordinates, areaHectares, center } = processPolygonGeometry(
        updateData.geometry.coordinates
      );
      updateData.geometry = {
        type: 'Polygon',
        coordinates: normalizedCoordinates,
      };
      updateData.areaHectares = areaHectares;
      updateData.center = center;
    }

    site = await Site.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete site and its analytics
// @route   DELETE /api/sites/:id
// @access  Private (Admin)
exports.deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found with id ${req.params.id}`,
      });
    }

    await Analytics.deleteMany({ siteId: site._id });
    await site.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Site and its associated analytics successfully removed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
