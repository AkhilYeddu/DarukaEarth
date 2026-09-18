const Analytics = require('../models/Analytics');
const Site = require('../models/Site');

// @desc    Get chronological analytics time series for a specific site
// @route   GET /api/sites/:siteId/analytics
// @access  Public
exports.getSiteAnalytics = async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findById(siteId).populate('projectId', 'name projectType');
    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found with id ${siteId}`,
      });
    }

    const records = await Analytics.find({ siteId }).sort({ timestamp: 1 });

    // Compute summary analytics KPIs
    const latest = records[records.length - 1] || null;
    const earliest = records[0] || null;

    const netCarbonGain =
      latest && earliest
        ? Math.round((latest.cumulativeCarbonTonnes - earliest.cumulativeCarbonTonnes) * 10) / 10
        : 0;

    const ndviImprovementPct =
      latest && earliest && earliest.ndvi > 0
        ? Math.round(((latest.ndvi - earliest.ndvi) / earliest.ndvi) * 100 * 10) / 10
        : 0;

    // Formatting series for Highcharts and Chart.js
    const chartSeries = {
      categories: records.map((r) => r.period),
      timestamps: records.map((r) => r.timestamp),
      carbonSequestration: records.map((r) => ({
        period: r.period,
        cumulativeCarbon: r.cumulativeCarbonTonnes,
        annualRate: r.annualCarbonSequestrationTonnes,
      })),
      vegetationIndices: records.map((r) => ({
        period: r.period,
        ndvi: r.ndvi,
        evi: r.evi,
        canopyCoverPct: r.canopyCoverPct,
      })),
      biodiversityAndBiomass: records.map((r) => ({
        period: r.period,
        biodiversityScore: r.biodiversityScore,
        biomassDensity: r.biomassDensityTonnesPerHa,
      })),
    };

    res.status(200).json({
      success: true,
      site: {
        id: site._id,
        name: site.name,
        areaHectares: site.areaHectares,
        biome: site.biome,
        healthStatus: site.healthStatus,
        canopyTargetPct: site.canopyTargetPct,
        projectName: site.projectId ? site.projectId.name : 'Unknown',
        projectType: site.projectId ? site.projectId.projectType : 'Conservation',
      },
      summary: {
        totalRecords: records.length,
        currentCarbonTonnes: latest ? latest.cumulativeCarbonTonnes : 0,
        netCarbonGain,
        currentNdvi: latest ? latest.ndvi : 0,
        ndviImprovementPct,
        currentCanopyCoverPct: latest ? latest.canopyCoverPct : 0,
        currentBiodiversityScore: latest ? latest.biodiversityScore : 0,
        currentBiomassDensity: latest ? latest.biomassDensityTonnesPerHa : 0,
        targetAnnualSequestration: site.targetAnnualSequestrationTonnes,
      },
      chartSeries,
      rawRecords: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add new telemetry data point to a site
// @route   POST /api/sites/:siteId/analytics
// @access  Private (Admin)
exports.addAnalyticsRecord = async (req, res) => {
  try {
    const { siteId } = req.params;
    const site = await Site.findById(siteId);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found with id ${siteId}`,
      });
    }

    const {
      timestamp,
      period,
      ndvi,
      evi,
      canopyCoverPct,
      biomassDensityTonnesPerHa,
      cumulativeCarbonTonnes,
      annualCarbonSequestrationTonnes,
      biodiversityScore,
      sensorSource,
    } = req.body;

    const record = await Analytics.create({
      siteId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      period: period || `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      ndvi: Number(ndvi),
      evi: evi ? Number(evi) : Number(ndvi) * 0.72,
      canopyCoverPct: Number(canopyCoverPct),
      biomassDensityTonnesPerHa: Number(biomassDensityTonnesPerHa),
      cumulativeCarbonTonnes: Number(cumulativeCarbonTonnes),
      annualCarbonSequestrationTonnes: Number(annualCarbonSequestrationTonnes),
      biodiversityScore: Number(biodiversityScore),
      sensorSource: sensorSource || 'Sentinel-2 MSI (ESA Copernicus)',
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
