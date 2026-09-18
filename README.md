# Darukaa.Earth: Full-Stack Geospatial Data Analytics Platform

[![Darukaa.Earth CI/CD](https://github.com/AkhilYeddu/DarukaEarth/actions/workflows/ci.yml/badge.svg)](https://github.com/AkhilYeddu/DarukaEarth/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Stack: MERN](https://img.shields.io/badge/Stack-MERN%20%2B%20GeoJSON-06b6d4.svg)](https://mongodb.com)
[![Mapping: Mapbox GL JS](https://img.shields.io/badge/Mapping-Mapbox%20GL%20JS-blue.svg)](https://mapbox.com)
[![Charting: Highcharts](https://img.shields.io/badge/Charting-Highcharts-purple.svg)](https://highcharts.com)

**Darukaa.Earth** is a next-generation, full-stack geospatial data analytics platform designed for ecological project developers, carbon credit auditors, and conservation organizations. It enables administrators to register and manage carbon and biodiversity projects, delineate geographical sites directly on interactive satellite maps using **GeoJSON polygon drawing**, and monitor multi-spectral vegetation indices (**NDVI**, **EVI**, **canopy density**, **biomass density**, and **carbon sequestration**) over multi-year time horizons.

---

## Table of Contents

1. [Core Features & User Stories](#core-features--user-stories)
2. [High-Level System Architecture](#high-level-system-architecture)
3. [Database Schema Breakdown](#database-schema-breakdown)
4. [Technology Stack & Architectural Trade-offs](#technology-stack--architectural-trade-offs)
5. [CI/CD Pipeline & Developer Experience](#cicd-pipeline--developer-experience)
6. [Local Setup & Getting Started](#local-setup--getting-started)
7. [Demo Accounts & Quick Credentials](#demo-accounts--quick-credentials)
8. [Automated Testing & Code Quality Checks](#automated-testing--code-quality-checks)
9. [Submission Deliverables & Hiring Team Access](#submission-deliverables--hiring-team-access)

---

## Core Features & User Stories

| User Story                                      | Implementation & Capability                                                                                                                                                                                                                                      |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin creates projects & geographical sites** | Administrators can create ecological projects across 6 project types (_Afforestation, Mangrove Restoration, Agroforestry, Peatland, etc._) and assign multiple polygon sites with automatic area calculations in hectares.                                       |
| **Interactive Map Visualization**               | Global interactive map with dual-basemaps (Dark Vector & High-Res Satellite), rendering all conservation sites as interactive GeoJSON polygon layers with biome-tailored color coding and health status.                                                         |
| **Draw Custom Sites on Map**                    | Built-in Mapbox Draw tool allowing administrators to click directly on satellite imagery to trace real boundaries. Automatically calculates polygon surface area in hectares and centroid coordinates via Turf.js.                                               |
| **Deep Time-Series Analytics**                  | Clicking any site opens multi-metric time-series visualizations powered by **Highcharts**: cumulative carbon sequestration (tCO2e), annual carbon accretion rate, NDVI vegetation vigor, canopy cover %, biomass density (t/ha), and Shannon biodiversity index. |
| **Historical Telemetry Log & Export**           | Calibrated satellite sensor log (Copernicus Sentinel-2 MSI, Landsat-9 OLI) with instant **CSV and JSON data export**.                                                                                                                                            |
| **Automated Code Quality & CI/CD**              | Automated pre-commit hooks enforcing Prettier formatting via **Husky** and **lint-staged**, with automated GitHub Actions testing and building every commit.                                                                                                     |

---

## High-Level System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                  CLIENT LAYER (React 18)                                |
|  - Vite + React SPA with Glassmorphism Design System & Lucide Icons                     |
|  - Mapbox GL JS + Mapbox Draw: Interactive polygon rendering, vector/satellite basemaps  |
|  - Highcharts & Chart.js: Dual-axis time series, carbon sequestration, NDVI curves      |
|  - Auth Context: JWT bearer token management & 1-click evaluator login shortcuts        |
+--------------------------------------------+--------------------------------------------+
                                             | REST API / JSON (Axios Interceptors)
                                             v
+-----------------------------------------------------------------------------------------+
|                                  SERVER LAYER (Node / Express)                          |
|  - Express.js REST API with Helmet security headers, CORS, & Morgan request logging    |
|  - JWT Authentication Middleware & Role-Based Access Control (Admin vs Analyst)         |
|  - Turf.js Geospatial Engine: Geodesic polygon area (ha), centroid, validation          |
|  - Analytics Aggregator: Multi-quarter historical curves & macro KPI calculations       |
+--------------------------------------------+--------------------------------------------+
                                             | Mongoose ODM (GeoJSON 2dsphere)
                                             v
+-----------------------------------------------------------------------------------------+
|                                 DATABASE LAYER (MongoDB)                                |
|  - Users Collection (bcrypt password hashing, roles)                                    |
|  - Projects Collection (target credits, standards: Verra VCS, Gold Standard, Plan Vivo) |
|  - Sites Collection (GeoJSON Polygon coordinates, 2dsphere spatial index, centroid)      |
|  - Analytics Collection (time-series telemetry: NDVI, EVI, biomass, carbon, biodiversity)|
|  * Smart Connection: Supports MongoDB Atlas URI or automatic zero-friction fallback     |
|    in-memory database (mongodb-memory-server) for instant evaluation out-of-the-box     |
+-----------------------------------------------------------------------------------------+
```

---

## Database Schema Breakdown

The database is built on MongoDB utilizing **GeoJSON standards** (`type: 'Polygon'` and `type: 'Point'`) with native `2dsphere` spatial indexing for fast spatial queries.

### 1. `User` Schema

```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // bcrypt hashed (10 salt rounds)
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'admin' },
  organization: { type: String, default: 'Darukaa.Earth Ecological Network' },
  timestamps: true
}
```

### 2. `Project` Schema

```javascript
{
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1500 },
  projectType: {
    type: String,
    enum: ['Afforestation', 'Reforestation', 'Mangrove Restoration', 'Agroforestry', 'Peatland Conservation', 'Grassland Restoration'],
    default: 'Reforestation'
  },
  status: { type: String, enum: ['Active', 'Planning', 'Verified', 'Under Review'], default: 'Active' },
  country: { type: String, required: true },
  region: { type: String },
  targetCreditsTonnes: { type: Number, required: true, min: 0 },
  standard: { type: String, enum: ['Verra VCS', 'Gold Standard', 'Plan Vivo', 'Puro.earth', 'Darukaa Ecological Standard'] },
  leadDeveloper: { type: String },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  timestamps: true
}
```

### 3. `Site` Schema (Geospatial Polygon)

```javascript
{
  projectId: { type: ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  geometry: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon', required: true },
    coordinates: { type: [[[Number]]], required: true } // Closed rings of [lng, lat]
  },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // Centroid [lng, lat]
  },
  areaHectares: { type: Number, required: true }, // Computed via Turf.js
  biome: {
    type: String,
    enum: ['Tropical Rainforest', 'Mangrove Estuary', 'Montane Cloud Forest', 'Temperate Broadleaf', 'Peatland Bog', 'Subtropical Dry Forest', 'Savanna/Grassland']
  },
  baselineYear: { type: Number, default: 2021 },
  baselineBiomassTonnesPerHa: { type: Number, default: 45 },
  targetAnnualSequestrationTonnes: { type: Number, default: 250 },
  canopyTargetPct: { type: Number, min: 0, max: 100, default: 75 },
  healthStatus: { type: String, enum: ['Optimal', 'Recovering', 'Moderate', 'Degraded'], default: 'Recovering' },
  tags: [String],
  timestamps: true
}
// 2dsphere Spatial Index:
// SiteSchema.index({ geometry: '2dsphere' });
// SiteSchema.index({ center: '2dsphere' });
```

### 4. `Analytics` Schema (Time-Series Telemetry)

```javascript
{
  siteId: { type: ObjectId, ref: 'Site', required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  period: { type: String, required: true }, // e.g. '2023-Q1', '2023-Q2'
  ndvi: { type: Number, required: true, min: -1, max: 1 }, // Normalized Difference Vegetation Index
  evi: { type: Number, min: -1, max: 1 }, // Enhanced Vegetation Index
  canopyCoverPct: { type: Number, required: true, min: 0, max: 100 },
  biomassDensityTonnesPerHa: { type: Number, required: true },
  cumulativeCarbonTonnes: { type: Number, required: true },
  annualCarbonSequestrationTonnes: { type: Number, required: true },
  soilOrganicCarbonTonnesPerHa: { type: Number, default: 35 },
  biodiversityScore: { type: Number, required: true, min: 0, max: 100 }, // Shannon-Wiener derived
  sensorSource: {
    type: String,
    enum: ['Sentinel-2 MSI (ESA Copernicus)', 'Landsat-9 OLI-2 (NASA/USGS)', 'PlanetScope High-Res (3m)', 'LiDAR / UAV Airborne Scan', 'Field Ground Truth Verification']
  },
  timestamps: true
}
// Compound Index: AnalyticsSchema.index({ siteId: 1, timestamp: 1 });
```

---

## Technology Stack & Architectural Trade-offs

| Domain                     | Technology                    | Justification & Architectural Trade-offs                                                                                                                                                                        |
| :------------------------- | :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Framework**     | React 18 + Vite               | Lightning-fast HMR and build times compared to CRA; component modularity for map layers and analytics widgets.                                                                                                  |
| **Geospatial Mapping**     | Mapbox GL JS + Mapbox Draw    | Hardware-accelerated WebGL rendering for high-density polygon layers; interactive polygon drawing tool with polygon vertex editing; high-res satellite and dark vector basemaps with zero-secret open fallback. |
| **Data Visualization**     | Highcharts + Chart.js         | Selected for complex dual-axis charts (cumulative carbon vs annual accretion rate) and spline area smoothing for vegetation health indices.                                                                     |
| **Backend Framework**      | Node.js + Express.js          | Unified JavaScript/TypeScript ecosystem across full stack (MERN); non-blocking event-driven architecture handles high-throughput telemetry ingestion with low memory footprint.                                 |
| **Geospatial Processing**  | `@turf/turf`                  | High-precision spherical geodesic algorithms executed server-side to calculate polygon area (`turf.area`) and geographic centroids (`turf.centroid`) reliably.                                                  |
| **Database**               | MongoDB with 2dsphere GeoJSON | Native support for GeoJSON Polygon and Point types; spatial query operators (`$geoIntersects`, `$geoWithin`, `$near`) combined with BSON document flexibility for time-series analytics.                        |
| **Zero-Friction Fallback** | `mongodb-memory-server`       | Allows anyone cloning the repository to run `npm run dev` or `npm test` immediately without requiring a pre-installed local MongoDB service or external Atlas account.                                          |

---

## CI/CD Pipeline & Developer Experience

### 1. Pre-Commit Hooks (Husky & lint-staged)

Every commit triggers `.husky/pre-commit`:

- Runs `npx lint-staged` on staged files.
- Automatically formats code with **Prettier** (`.prettierrc`) to maintain pristine code style across the team.
- Enforces syntax integrity before code touches the Git history.

### 2. GitHub Actions Workflow (`.github/workflows/ci.yml`)

On every push and pull request to the `main` branch, the pipeline executes 3 concurrent automated jobs:

1. **Code Quality Check**: Runs Prettier format verification.
2. **Backend API Tests**: Spins up Node.js, installs dependencies, and runs the full automated Jest & Supertest integration suite testing authentication, project CRUD, GeoJSON polygon calculations, and analytics APIs.
3. **Frontend Build Verification**: Compiles the React Vite client to ensure zero build errors or bundle regressions.

---

## Local Setup & Getting Started

### Prerequisites

- **Node.js**: v18+ (tested on v20 and v24)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/AkhilYeddu/DarukaEarth.git
cd DarukaEarth
```

### 2. Install All Dependencies

One command installs root, server, and client dependencies:

```bash
npm run install:all
```

### 3. Launch Development Platform

```bash
npm run dev
```

This runs both backend and frontend concurrently:

- **Frontend Dashboard**: [https://daruka-earth-ivory.vercel.app/](https://daruka-earth-ivory.vercel.app/)
- **Backend API**: [https://darukaa-earth-api-2niw.onrender.com](https://darukaa-earth-api-2niw.onrender.com)
- **API Health Check**: [https://darukaa-earth-api-2niw.onrender.com/api/health](https://darukaa-earth-api-2niw.onrender.com/api/health)

_(Note: The server automatically detects if the database is fresh and self-seeds 4 global conservation projects, 4 GeoJSON polygon sites, and 32 quarters of satellite telemetry!)_

---

## Demo Accounts & Quick Credentials

For convenience during evaluation, the login screen includes **1-Click Demo Buttons** for immediate access:

| Role                   | Email                   | Password              | Privileges                                                             |
| :--------------------- | :---------------------- | :-------------------- | :--------------------------------------------------------------------- |
| **Administrator**      | `admin@darukaa.earth`   | `Admin@Darukaa2025`   | Full CRUD, Polygon Site Drawing, Project Creation, Telemetry Ingestion |
| **Geospatial Analyst** | `analyst@darukaa.earth` | `Analyst@Darukaa2025` | Map Navigation, Time-Series Inspection, Data Export                    |

---

## Automated Testing & Code Quality Checks

Run all backend integration test suites:

```bash
npm test
```

_Executes all 12 test cases covering JWT authentication, project CRUD, GeoJSON polygon validation, Turf area calculation, and analytics time-series._

Run code formatting checks:

```bash
npm run format:check
```

Build production bundle:

```bash
npm run build
```

---

## Submission Deliverables & Hiring Team Access

### 1. Repository

- **GitHub Link**: [https://github.com/AkhilYeddu/DarukaEarth.git](https://github.com/AkhilYeddu/DarukaEarth.git)

### 2. Hiring Team Access Invitations

In accordance with the challenge guidelines, access has been provisioned for the hiring team:

- `ankita.dasgupta@darukaa.com`
- `harsh.kumar@darukaa.com`
- `utkarsh.gauniyal@darukaa.com`
- `guneet.mutreja@darukaa.com`

---

_Built with passion for nature-based climate solutions and ecological restoration by the Darukaa.Earth Full-Stack Engineering Team._
