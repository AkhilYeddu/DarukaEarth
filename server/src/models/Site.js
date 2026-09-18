const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please assign a project ID to this site'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a site name'],
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // GeoJSON Polygon geometry with 2dsphere index
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of [longitude, latitude] pairs
        required: [true, 'Please provide polygon coordinates [[lng, lat], ...]'],
      },
    },
    // Calculated centroid point for quick map centering and marker clustering
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    areaHectares: {
      type: Number,
      required: true,
      min: [0.01, 'Area must be at least 0.01 hectares'],
    },
    biome: {
      type: String,
      enum: [
        'Tropical Rainforest',
        'Mangrove Estuary',
        'Temperate Broadleaf',
        'Montane Cloud Forest',
        'Peatland Bog',
        'Subtropical Dry Forest',
        'Savanna/Grassland',
      ],
      default: 'Tropical Rainforest',
    },
    baselineYear: {
      type: Number,
      default: 2020,
    },
    baselineBiomassTonnesPerHa: {
      type: Number,
      default: 45,
    },
    targetAnnualSequestrationTonnes: {
      type: Number,
      default: 250,
    },
    canopyTargetPct: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    healthStatus: {
      type: String,
      enum: ['Optimal', 'Recovering', 'Moderate', 'Degraded'],
      default: 'Recovering',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere geospatial index for spatial queries
SiteSchema.index({ geometry: '2dsphere' });
SiteSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('Site', SiteSchema);
