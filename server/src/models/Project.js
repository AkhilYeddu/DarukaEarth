const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    projectType: {
      type: String,
      required: [true, 'Please specify the project type'],
      enum: [
        'Afforestation',
        'Reforestation',
        'Mangrove Restoration',
        'Agroforestry',
        'Peatland Conservation',
        'Grassland Restoration',
      ],
      default: 'Reforestation',
    },
    status: {
      type: String,
      enum: ['Active', 'Planning', 'Verified', 'Under Review'],
      default: 'Active',
    },
    country: {
      type: String,
      required: [true, 'Please provide the project country'],
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    targetCreditsTonnes: {
      type: Number,
      required: [true, 'Please provide target carbon credits in tCO2e'],
      min: [0, 'Target credits must be non-negative'],
    },
    standard: {
      type: String,
      enum: [
        'Verra VCS',
        'Gold Standard',
        'Plan Vivo',
        'Puro.earth',
        'Darukaa Ecological Standard',
      ],
      default: 'Verra VCS',
    },
    leadDeveloper: {
      type: String,
      default: 'Darukaa.Earth Field Operations',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for sites in this project
ProjectSchema.virtual('sites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'projectId',
  justOne: false,
});

module.exports = mongoose.model('Project', ProjectSchema);
