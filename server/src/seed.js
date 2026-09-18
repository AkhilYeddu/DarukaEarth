const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Site = require('./models/Site');
const Analytics = require('./models/Analytics');
const { connectDB, disconnectDB } = require('./config/db');

const seedData = async () => {
  try {
    console.log('🌱 Starting Darukaa.Earth Database Seeding...');

    // Clear existing data
    await Analytics.deleteMany({});
    await Site.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Dr. Aris Thorne',
      email: 'admin@darukaa.earth',
      password: 'Admin@Darukaa2025',
      role: 'admin',
      organization: 'Darukaa.Earth Global Ecological Registry',
    });

    const analystUser = await User.create({
      name: 'Elena Rostova',
      email: 'analyst@darukaa.earth',
      password: 'Analyst@Darukaa2025',
      role: 'analyst',
      organization: 'Darukaa Geospatial Data Lab',
    });

    console.log('✅ Created Admin and Analyst users');

    // 2. Project 1: Sundarbans Blue Carbon Mangrove Restoration
    const project1 = await Project.create({
      name: 'Sundarbans Blue Carbon & Mangrove Estuary Buffer',
      description:
        'Large-scale coastal blue carbon project restoring tidal mangrove wetlands in the UNESCO World Heritage Sundarbans delta. Project prevents shoreline erosion, enhances benthic biodiversity, and sequesters long-term blue carbon in deep sediments.',
      projectType: 'Mangrove Restoration',
      status: 'Active',
      country: 'India',
      region: 'West Bengal / Bay of Bengal',
      targetCreditsTonnes: 120000,
      standard: 'Verra VCS',
      leadDeveloper: 'Darukaa Blue Carbon Initiative',
      createdBy: adminUser._id,
    });

    // Site 1.1: Gosaba Tidal Mangrove Sanctuary
    const site1_1 = await Site.create({
      projectId: project1._id,
      name: 'Gosaba Island Tidal Fringe A',
      description: 'Restoration of Avicennia marina and Rhizophora mucronata intertidal mangroves.',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [88.785, 22.145],
            [88.825, 22.148],
            [88.835, 22.115],
            [88.795, 22.11],
            [88.785, 22.145],
          ],
        ],
      },
      center: {
        type: 'Point',
        coordinates: [88.81, 22.129],
      },
      areaHectares: 1420.5,
      biome: 'Mangrove Estuary',
      baselineYear: 2021,
      baselineBiomassTonnesPerHa: 38,
      targetAnnualSequestrationTonnes: 12500,
      canopyTargetPct: 82,
      healthStatus: 'Optimal',
      tags: ['blue-carbon', 'mangrove', 'tidal-zone', 'high-co2-density'],
      createdBy: adminUser._id,
    });

    // Site 1.2: Satjelia Mudflat Restoration Zone
    const site1_2 = await Site.create({
      projectId: project1._id,
      name: 'Satjelia Mudflat Rehabilitation Zone',
      description: 'High-salinity mudflat reclamation and nursery-assisted natural regeneration.',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [88.845, 22.175],
            [88.885, 22.178],
            [88.895, 22.142],
            [88.855, 22.138],
            [88.845, 22.175],
          ],
        ],
      },
      center: {
        type: 'Point',
        coordinates: [88.87, 22.158],
      },
      areaHectares: 980.2,
      biome: 'Mangrove Estuary',
      baselineYear: 2022,
      baselineBiomassTonnesPerHa: 24,
      targetAnnualSequestrationTonnes: 7800,
      canopyTargetPct: 75,
      healthStatus: 'Recovering',
      tags: ['mudflat', 'reforestation', 'cyclone-buffer'],
      createdBy: adminUser._id,
    });

    // 3. Project 2: Western Ghats Rainforest Canopy Corridor
    const project2 = await Project.create({
      name: 'Western Ghats High-Canopy Agro-Reforestation Corridor',
      description:
        'Ecological corridor linking fragmented montane shola forests and tea estate buffers in the Western Ghats global biodiversity hotspot. Restores native endemic dipterocarps and multi-layered canopy structures.',
      projectType: 'Reforestation',
      status: 'Active',
      country: 'India',
      region: 'Tamil Nadu & Kerala (Anamalai Hills)',
      targetCreditsTonnes: 85000,
      standard: 'Gold Standard',
      leadDeveloper: 'Darukaa Wildlife Corridor Trust',
      createdBy: adminUser._id,
    });

    // Site 2.1: Valparai Native Canopy Reconnection
    const site2_1 = await Site.create({
      projectId: project2._id,
      name: 'Valparai Montane Corridor Sector 4',
      description: 'Native evergreen forest reconnection over abandoned coffee and shade plots.',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [76.925, 10.315],
            [76.965, 10.32],
            [76.97, 10.285],
            [76.93, 10.28],
            [76.925, 10.315],
          ],
        ],
      },
      center: {
        type: 'Point',
        coordinates: [76.947, 10.3],
      },
      areaHectares: 850.4,
      biome: 'Montane Cloud Forest',
      baselineYear: 2020,
      baselineBiomassTonnesPerHa: 62,
      targetAnnualSequestrationTonnes: 9200,
      canopyTargetPct: 88,
      healthStatus: 'Optimal',
      tags: ['shola-forest', 'endemic-species', 'corridor', 'wildlife-crossing'],
      createdBy: adminUser._id,
    });

    // 4. Project 3: Costa Rica Osa Peninsula Agroforestry
    const project3 = await Project.create({
      name: 'Costa Rica Osa Peninsula Regenerative Agroforestry',
      description:
        'Community-centered regenerative shade-grown cocoa and agroforestry systems bordering Corcovado National Park, maximizing soil organic carbon and endangered jaguar habitat continuity.',
      projectType: 'Agroforestry',
      status: 'Verified',
      country: 'Costa Rica',
      region: 'Puntarenas (Osa Peninsula)',
      targetCreditsTonnes: 45000,
      standard: 'Plan Vivo',
      leadDeveloper: 'Osa Conservation Partnership',
      createdBy: adminUser._id,
    });

    const site3_1 = await Site.create({
      projectId: project3._id,
      name: 'Corcovado Agro-Buffer Block North',
      description:
        'Shade cacao intercropped with mahogany, cedar, and native nitrogen-fixing legumes.',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-83.585, 8.565],
            [-83.545, 8.57],
            [-83.535, 8.535],
            [-83.575, 8.53],
            [-83.585, 8.565],
          ],
        ],
      },
      center: {
        type: 'Point',
        coordinates: [-83.56, 8.55],
      },
      areaHectares: 640.8,
      biome: 'Tropical Rainforest',
      baselineYear: 2021,
      baselineBiomassTonnesPerHa: 52,
      targetAnnualSequestrationTonnes: 5400,
      canopyTargetPct: 78,
      healthStatus: 'Optimal',
      tags: ['agroforestry', 'corcovado', 'organic-soil', 'shade-cocoa'],
      createdBy: adminUser._id,
    });

    console.log('✅ Created 3 Conservation Projects and 4 Geospatial Sites with Polygons');

    // 5. Generate Multi-Quarter Time Series Analytics for Sites
    const generateTimeSeries = async (site, baselineNdvi, targetNdvi, annualRateBase) => {
      const quarters = [
        { period: '2023-Q1', date: new Date('2023-03-31'), progress: 0.15 },
        { period: '2023-Q2', date: new Date('2023-06-30'), progress: 0.28 },
        { period: '2023-Q3', date: new Date('2023-09-30'), progress: 0.42 },
        { period: '2023-Q4', date: new Date('2023-12-31'), progress: 0.55 },
        { period: '2024-Q1', date: new Date('2024-03-31'), progress: 0.68 },
        { period: '2024-Q2', date: new Date('2024-06-30'), progress: 0.79 },
        { period: '2024-Q3', date: new Date('2024-09-30'), progress: 0.89 },
        { period: '2024-Q4', date: new Date('2024-12-31'), progress: 1.0 },
      ];

      let runningCumulativeCarbon = 0;

      for (const q of quarters) {
        const ndviVal =
          Math.round((baselineNdvi + (targetNdvi - baselineNdvi) * q.progress) * 100) / 100;
        const eviVal = Math.round(ndviVal * 0.72 * 100) / 100;
        const canopyCover = Math.round(35 + (site.canopyTargetPct - 35) * q.progress);
        const biomass = Math.round(site.baselineBiomassTonnesPerHa + 28 * q.progress);
        const quarterCarbonInc = Math.round((annualRateBase / 4) * (0.8 + 0.4 * q.progress));
        runningCumulativeCarbon += quarterCarbonInc;
        const bioScore = Math.round(58 + 32 * q.progress);

        await Analytics.create({
          siteId: site._id,
          timestamp: q.date,
          period: q.period,
          ndvi: ndviVal,
          evi: eviVal,
          canopyCoverPct: canopyCover,
          biomassDensityTonnesPerHa: biomass,
          cumulativeCarbonTonnes: runningCumulativeCarbon,
          annualCarbonSequestrationTonnes: Math.round(quarterCarbonInc * 4),
          soilOrganicCarbonTonnesPerHa: Math.round(32 + 18 * q.progress),
          biodiversityScore: bioScore,
          sensorSource: 'Sentinel-2 MSI (ESA Copernicus)',
        });
      }
    };

    await generateTimeSeries(site1_1, 0.48, 0.82, site1_1.targetAnnualSequestrationTonnes);
    await generateTimeSeries(site1_2, 0.38, 0.74, site1_2.targetAnnualSequestrationTonnes);
    await generateTimeSeries(site2_1, 0.54, 0.86, site2_1.targetAnnualSequestrationTonnes);
    await generateTimeSeries(site3_1, 0.52, 0.81, site3_1.targetAnnualSequestrationTonnes);

    console.log('✅ Generated 32 quarters of environmental time-series analytics');
    console.log('================================================================');
    console.log('🌱 Seed completed successfully!');
    console.log('🔐 Demo Credentials:');
    console.log('   Admin:   admin@darukaa.earth / Admin@Darukaa2025');
    console.log('   Analyst: analyst@darukaa.earth / Analyst@Darukaa2025');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

// Allow standalone CLI execution
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedData();
    await disconnectDB();
    process.exit(0);
  })();
}

module.exports = seedData;
