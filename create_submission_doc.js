import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import fs from 'fs';

async function generateSubmissionDoc() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'Darukaa.Earth Full-Stack Developer Hackathon Submission',
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Candidate: ', bold: true }),
              new TextRun('Akhil Yeddu'),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Project Name: ', bold: true }),
              new TextRun('Darukaa.Earth - Geospatial Carbon & Biodiversity Analytics Platform'),
            ],
            spacing: { after: 200 },
          }),

          // Section 1: Deliverables Links
          new Paragraph({
            text: '1. Repository & Deployment Links',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'GitHub Repository: ', bold: true }),
              new TextRun('https://github.com/AkhilYeddu/DarukaEarth.git'),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Live Demo URL: ', bold: true }),
              new TextRun(
                'https://github.com/AkhilYeddu/DarukaEarth (Locally accessible via npm run dev on http://localhost:3000; easily deployed to Render/Vercel)'
              ),
            ],
            spacing: { after: 200 },
          }),

          // Section 2: Repository Access
          new Paragraph({
            text: '2. Repository Access Invitations',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: 'As per the submission guidelines, invitations have been granted to the Darukaa hiring team:',
            spacing: { after: 80 },
          }),
          new Paragraph({ text: '• ankita.dasgupta@darukaa.com', bullet: { level: 0 } }),
          new Paragraph({ text: '• harsh.kumar@darukaa.com', bullet: { level: 0 } }),
          new Paragraph({ text: '• utkarsh.gauniyal@darukaa.com', bullet: { level: 0 } }),
          new Paragraph({
            text: '• guneet.mutreja@darukaa.com',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),

          // Section 3: Credentials
          new Paragraph({
            text: '3. Evaluation Demo Credentials',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: 'For zero-friction evaluation, the login screen includes 1-Click Quick Demo Login buttons. Manual credentials are also provided below:',
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Administrator Account: ', bold: true }),
              new TextRun(
                'admin@darukaa.earth / Admin@Darukaa2025 (Full CRUD, Polygon Drawing, Site Management)'
              ),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Analyst Account: ', bold: true }),
              new TextRun(
                'analyst@darukaa.earth / Analyst@Darukaa2025 (Telemetry Inspection, Time-Series Charts)'
              ),
            ],
            spacing: { after: 200 },
          }),

          // Section 4: Architecture Overview
          new Paragraph({
            text: '4. System Architecture Overview',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: 'The platform is built on the modern MERN stack with dedicated geospatial and analytics engines:',
            spacing: { after: 80 },
          }),
          new Paragraph({
            text: '• Frontend: React 18, Vite, Mapbox GL JS with Mapbox Draw for interactive polygon delineation, Highcharts for dual-axis time series, and Lucide icons with an ecological dark glassmorphism design system.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Backend: Node.js, Express.js REST API with Helmet security headers, CORS, JWT-based role authentication (Admin/Analyst), and Morgan logging.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Geospatial Processing: @turf/turf executing server-side spherical geodesic polygon area calculations (in hectares) and centroid derivation.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Database Layer: MongoDB with GeoJSON 2dsphere spatial indexing for Polygon and Point geometries. Features a zero-friction fallback to mongodb-memory-server with automated database seeding on boot.',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),

          // Section 5: Database Schema
          new Paragraph({
            text: '5. Database Schema Breakdown',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: '1. Users: name, email (unique), password (bcrypt salt hash), role (admin/analyst), organization, timestamps.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '2. Projects: name, description, projectType (Afforestation, Reforestation, Mangrove, Agroforestry, Peatland), status (Active, Planning, Verified), country, region, targetCreditsTonnes, standard (Verra VCS, Gold Standard, Plan Vivo), createdBy.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '3. Sites: projectId (ref), name, description, geometry (GeoJSON Polygon with 2dsphere index), center (GeoJSON Point with 2dsphere index), areaHectares (Turf.js computed), biome, baselineBiomassTonnesPerHa, targetAnnualSequestrationTonnes, canopyTargetPct, healthStatus.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '4. Analytics: siteId (ref), timestamp, period (e.g. 2024-Q3), ndvi (Normalized Difference Vegetation Index), evi, canopyCoverPct, biomassDensityTonnesPerHa, cumulativeCarbonTonnes, annualCarbonSequestrationTonnes, soilOrganicCarbonTonnesPerHa, biodiversityScore (Shannon index), sensorSource (Sentinel-2 MSI Copernicus, Landsat-9).',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),

          // Section 6: CI/CD & Developer Experience
          new Paragraph({
            text: '6. CI/CD Pipeline & Code Quality Enforcement',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: '• Pre-Commit Hooks: Configured with Husky and lint-staged to automatically format all code with Prettier before every commit.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• GitHub Actions CI/CD (.github/workflows/ci.yml): Runs 3 concurrent jobs on push/PR to main: (1) Code formatting validation, (2) Backend automated Jest integration tests (12 test cases), and (3) React Vite production build compilation.',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),

          // Section 7: Local Setup
          new Paragraph({
            text: '7. Quick Local Setup Instructions',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),

          new Paragraph({
            text: '1. git clone https://github.com/AkhilYeddu/DarukaEarth.git',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '2. cd DarukaEarth && npm run install:all',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '3. npm run dev (Launches frontend on http://localhost:3000 and backend on http://localhost:5000 with auto-seeded demo data)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '4. npm test (Runs all 12 backend integration test suites)',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('Darukaa_Earth_Hackathon_Submission.docx', buffer);
  console.log('✅ Generated Darukaa_Earth_Hackathon_Submission.docx successfully!');
}

generateSubmissionDoc().catch(console.error);
