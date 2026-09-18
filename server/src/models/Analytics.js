const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Please associate analytics record with a site'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true, // e.g., '2023-Q1', '2023-Q2'
    },
    // Normalized Difference Vegetation Index (NDVI: -1 to 1, typical vegetation 0.2 to 0.85)
    ndvi: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    // Enhanced Vegetation Index (EVI)
    evi: {
      type: Number,
      min: -1,
      max: 1,
    },
    // Canopy Cover Percentage (%)
    canopyCoverPct: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Aboveground Biomass Density (t/ha)
    biomassDensityTonnesPerHa: {
      type: Number,
      required: true,
      min: 0,
    },
    // Cumulative sequestered carbon (tCO2e)
    cumulativeCarbonTonnes: {
      type: Number,
      required: true,
      min: 0,
    },
    // Annual sequestration rate (tCO2e/yr)
    annualCarbonSequestrationTonnes: {
      type: Number,
      required: true,
      min: 0,
    },
    // Soil Organic Carbon (SOC t/ha)
    soilOrganicCarbonTonnesPerHa: {
      type: Number,
      default: 35,
    },
    // Shannon-Wiener derived Biodiversity Score (0 - 100 index)
    biodiversityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sensorSource: {
      type: String,
      enum: [
        'Sentinel-2 MSI (ESA Copernicus)',
        'Landsat-9 OLI-2 (NASA/USGS)',
        'PlanetScope High-Res (3m)',
        'LiDAR / UAV Airborne Scan',
        'Field Ground Truth Verification',
      ],
      default: 'Sentinel-2 MSI (ESA Copernicus)',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast time-series queries per site
AnalyticsSchema.index({ siteId: 1, timestamp: 1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
