const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Site = require('../src/models/Site');
const Analytics = require('../src/models/Analytics');

let adminToken;
let testProjectId;
let testSiteId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key_projects';
  await connectDB();

  // Create admin user and obtain token
  const admin = await User.create({
    name: 'Chief Forest Officer',
    email: 'officer@darukaa.earth',
    password: 'securePassword123',
    role: 'admin',
  });
  adminToken = admin.getSignedJwtToken();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Projects & Geospatial Sites API', () => {
  test('POST /api/projects should create a new conservation project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Amazon Headwaters Reforestation',
        description: 'Riparian buffer planting in the Madre de Dios basin.',
        projectType: 'Reforestation',
        status: 'Active',
        country: 'Peru',
        region: 'Madre de Dios',
        targetCreditsTonnes: 60000,
        standard: 'Verra VCS',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Amazon Headwaters Reforestation');
    testProjectId = res.body.data._id;
  });

  test('GET /api/projects should return project list with siteCount and totalHectares', async () => {
    const res = await request(app).get('/api/projects');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/sites should create site with polygon coordinates and auto-calculate area and center', async () => {
    // 5-point polygon in Peru (closed loop: first == last)
    const polygonCoords = [
      [
        [-69.215, -12.585],
        [-69.185, -12.585],
        [-69.185, -12.615],
        [-69.215, -12.615],
        [-69.215, -12.585],
      ],
    ];

    const res = await request(app)
      .post('/api/sites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId: testProjectId,
        name: 'Tambopata Riparian Sector 1',
        description: 'Native canopy recovery on river bend.',
        geometry: {
          type: 'Polygon',
          coordinates: polygonCoords,
        },
        biome: 'Tropical Rainforest',
        baselineYear: 2022,
        baselineBiomassTonnesPerHa: 45,
        canopyTargetPct: 80,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.areaHectares).toBeGreaterThan(0);
    expect(res.body.data.center.coordinates).toBeDefined();
    expect(res.body.data.center.coordinates.length).toBe(2);
    testSiteId = res.body.data._id;
  });

  test('GET /api/sites/geojson should return GeoJSON FeatureCollection', async () => {
    const res = await request(app).get('/api/sites/geojson');

    expect(res.statusCode).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
    expect(res.body.features.length).toBeGreaterThanOrEqual(1);
    expect(res.body.features[0].geometry.type).toBe('Polygon');
  });

  test('GET /api/sites/:id/analytics should return time-series records and summaries', async () => {
    const res = await request(app).get(`/api/sites/${testSiteId}/analytics`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.site.name).toBe('Tambopata Riparian Sector 1');
    expect(res.body.chartSeries).toBeDefined();
    expect(res.body.chartSeries.carbonSequestration).toBeDefined();
  });

  test('GET /api/projects/stats/macro should return global summary stats', async () => {
    const res = await request(app).get('/api/projects/stats/macro');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProjects).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalSites).toBeGreaterThanOrEqual(1);
  });
});
