import React, { useState, useEffect } from 'react';
import { siteAPI, projectAPI } from '../services/api';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  BarChart3,
  TrendingUp,
  Leaf,
  Layers,
  Sparkles,
  Download,
  Calendar,
  Satellite,
  Compass,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

const SiteAnalytics = ({ selectedSiteId, onSelectSite }) => {
  const [sites, setSites] = useState([]);
  const [currentSiteId, setCurrentSiteId] = useState(selectedSiteId || '');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddTelemetryModalOpen, setIsAddTelemetryModalOpen] = useState(false);

  // New telemetry form state
  const [telemetryForm, setTelemetryForm] = useState({
    period: '2025-Q1',
    ndvi: 0.76,
    evi: 0.55,
    canopyCoverPct: 78,
    biomassDensityTonnesPerHa: 72,
    cumulativeCarbonTonnes: 14500,
    annualCarbonSequestrationTonnes: 2800,
    biodiversityScore: 86,
    sensorSource: 'Sentinel-2 MSI (ESA Copernicus)',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all sites for the dropdown selector
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await siteAPI.getAll();
        if (res.success && res.data.length > 0) {
          setSites(res.data);
          if (!currentSiteId) {
            setCurrentSiteId(res.data[0]._id || res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
      }
    };
    fetchSites();
  }, []);

  // Fetch analytics for current site
  const fetchAnalytics = async (siteId) => {
    if (!siteId) return;
    try {
      setLoading(true);
      const res = await siteAPI.getAnalytics(siteId);
      if (res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSiteId) {
      fetchAnalytics(currentSiteId);
    }
  }, [currentSiteId]);

  const handleSiteChange = (e) => {
    const newId = e.target.value;
    setCurrentSiteId(newId);
    if (onSelectSite) onSelectSite(newId);
  };

  const handleExportCSV = () => {
    if (!analyticsData || !analyticsData.rawRecords) return;
    const records = analyticsData.rawRecords;
    const headers = [
      'Period',
      'Date',
      'NDVI',
      'EVI',
      'CanopyCoverPct',
      'BiomassTonnesPerHa',
      'CumulativeCarbonTonnes',
      'AnnualCarbonSequestrationTonnes',
      'BiodiversityScore',
      'SensorSource',
    ];
    const rows = records.map((r) => [
      r.period,
      new Date(r.timestamp).toISOString().split('T')[0],
      r.ndvi,
      r.evi,
      r.canopyCoverPct,
      r.biomassDensityTonnesPerHa,
      r.cumulativeCarbonTonnes,
      r.annualCarbonSequestrationTonnes,
      r.biodiversityScore,
      `"${r.sensorSource}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${analyticsData.site?.name.replace(/\s+/g, '_')}_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTelemetry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await siteAPI.addAnalytics(currentSiteId, telemetryForm);
      if (res.success) {
        setIsAddTelemetryModalOpen(false);
        fetchAnalytics(currentSiteId);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to record telemetry');
    } finally {
      setSubmitting(false);
    }
  };

  // Highcharts Dark Theme Global defaults
  const darkChartTheme = {
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'var(--font-body)' },
    },
    title: { style: { color: '#f8fafc', fontWeight: '600' } },
    xAxis: {
      labels: { style: { color: '#94a3b8' } },
      gridLineColor: 'rgba(255, 255, 255, 0.06)',
      lineColor: 'rgba(255, 255, 255, 0.1)',
    },
    yAxis: {
      labels: { style: { color: '#94a3b8' } },
      gridLineColor: 'rgba(255, 255, 255, 0.06)',
      title: { style: { color: '#94a3b8' } },
    },
    tooltip: {
      backgroundColor: 'rgba(13, 21, 39, 0.95)',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      style: { color: '#f8fafc' },
      shared: true,
    },
    legend: {
      itemStyle: { color: '#cbd5e1' },
      itemHoverStyle: { color: '#10b981' },
    },
    credits: { enabled: false },
  };

  // 1. Carbon Chart Options
  const categories = analyticsData?.chartSeries?.categories || [];
  const carbonOptions = {
    ...darkChartTheme,
    title: { text: 'Cumulative Carbon Sequestration & Annual Accretion' },
    xAxis: { ...darkChartTheme.xAxis, categories },
    yAxis: [
      {
        title: { text: 'Cumulative Carbon (tCO2e)' },
        labels: { format: '{value} t' },
        opposite: false,
      },
      {
        title: { text: 'Annual Sequestration Rate (tCO2e/yr)' },
        labels: { format: '{value} t/yr' },
        opposite: true,
      },
    ],
    series: [
      {
        name: 'Cumulative Carbon (tCO2e)',
        type: 'area',
        yAxis: 0,
        data: analyticsData?.chartSeries?.carbonSequestration?.map((c) => c.cumulativeCarbon) || [],
        color: '#10b981',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.45)'],
            [1, 'rgba(16, 185, 129, 0.0)'],
          ],
        },
      },
      {
        name: 'Annual Accretion Rate (tCO2e/yr)',
        type: 'column',
        yAxis: 1,
        data: analyticsData?.chartSeries?.carbonSequestration?.map((c) => c.annualRate) || [],
        color: '#06b6d4',
      },
    ],
  };

  // 2. Vegetation Health (NDVI & Canopy Cover) Options
  const vegetationOptions = {
    ...darkChartTheme,
    title: { text: 'Vegetation Indices (NDVI / EVI) & Canopy Cover %' },
    xAxis: { ...darkChartTheme.xAxis, categories },
    yAxis: [
      {
        title: { text: 'Vegetation Index (NDVI / EVI)' },
        min: 0,
        max: 1.0,
        opposite: false,
      },
      {
        title: { text: 'Canopy Density (%)' },
        min: 0,
        max: 100,
        labels: { format: '{value}%' },
        opposite: true,
      },
    ],
    series: [
      {
        name: 'Normalized Difference Veg Index (NDVI)',
        type: 'spline',
        yAxis: 0,
        data: analyticsData?.chartSeries?.vegetationIndices?.map((v) => v.ndvi) || [],
        color: '#34d399',
        lineWidth: 3,
      },
      {
        name: 'Enhanced Veg Index (EVI)',
        type: 'spline',
        yAxis: 0,
        data: analyticsData?.chartSeries?.vegetationIndices?.map((v) => v.evi) || [],
        color: '#22d3ee',
        dashStyle: 'ShortDash',
      },
      {
        name: 'Canopy Cover %',
        type: 'areaspline',
        yAxis: 1,
        data: analyticsData?.chartSeries?.vegetationIndices?.map((v) => v.canopyCoverPct) || [],
        color: 'rgba(251, 191, 36, 0.8)',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(251, 191, 36, 0.25)'],
            [1, 'rgba(251, 191, 36, 0.0)'],
          ],
        },
      },
    ],
  };

  // 3. Biodiversity & Biomass Options
  const biodiversityOptions = {
    ...darkChartTheme,
    title: { text: 'Shannon Biodiversity Index & Biomass Density' },
    xAxis: { ...darkChartTheme.xAxis, categories },
    yAxis: [
      {
        title: { text: 'Biodiversity Score (0-100)' },
        min: 0,
        max: 100,
        opposite: false,
      },
      {
        title: { text: 'Biomass Density (t/ha)' },
        opposite: true,
      },
    ],
    series: [
      {
        name: 'Biodiversity Score',
        type: 'line',
        yAxis: 0,
        data:
          analyticsData?.chartSeries?.biodiversityAndBiomass?.map((b) => b.biodiversityScore) || [],
        color: '#a855f7',
        lineWidth: 3,
      },
      {
        name: 'Biomass Density (t/ha)',
        type: 'spline',
        yAxis: 1,
        data:
          analyticsData?.chartSeries?.biodiversityAndBiomass?.map((b) => b.biomassDensity) || [],
        color: '#3b82f6',
        lineWidth: 2,
      },
    ],
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header & Site Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '2rem' }}>Site Geospatial Analytics</h1>
            <span className="badge badge-cyan">Copernicus Sentinel-2 Live Ingest</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Multi-spectral remote sensing time-series, biomass accretion, and carbon credit
            verification
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Site Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--emerald-400)" />
            <select
              className="input-field"
              style={{ minWidth: '260px' }}
              value={currentSiteId}
              onChange={handleSiteChange}
            >
              {sites.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} ({s.biome})
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setIsAddTelemetryModalOpen(true)} className="btn-secondary btn-sm">
            <Plus size={15} />
            <span>Record Telemetry</span>
          </button>

          <button onClick={handleExportCSV} className="btn-primary btn-sm">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
          Loading satellite time-series analytics...
        </div>
      ) : !analyticsData ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No telemetry records available for this site</h3>
        </div>
      ) : (
        <>
          {/* Site Overview Badge Banner */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem' }}>{analyticsData.site?.name}</h2>
                <span className="badge badge-emerald">{analyticsData.site?.biome}</span>
                <span className="badge badge-cyan">{analyticsData.site?.healthStatus}</span>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span>Project: {analyticsData.site?.projectName}</span>
                <span>Area: {analyticsData.site?.areaHectares} Hectares</span>
                <span>
                  Target Sequestration:{' '}
                  {analyticsData.summary?.targetAnnualSequestration?.toLocaleString()} tCO2e/yr
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Satellite size={16} color="var(--emerald-400)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Multi-spectral MSI: <strong>ESA Copernicus Sentinel-2</strong>
              </span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                CUMULATIVE SEQUESTRATION
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--emerald-400)',
                  margin: '4px 0',
                }}
              >
                {analyticsData.summary?.currentCarbonTonnes?.toLocaleString()}{' '}
                <span style={{ fontSize: '0.9rem' }}>tCO2e</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald-400)' }}>
                +{analyticsData.summary?.netCarbonGain?.toLocaleString()} tCO2e since baseline
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                VEGETATION INDEX (NDVI)
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--cyan-400)',
                  margin: '4px 0',
                }}
              >
                {analyticsData.summary?.currentNdvi}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cyan-400)' }}>
                +{analyticsData.summary?.ndviImprovementPct}% canopy vigor
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                CANOPY DENSITY
              </div>
              <div
                style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24', margin: '4px 0' }}
              >
                {analyticsData.summary?.currentCanopyCoverPct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target: {analyticsData.site?.canopyTargetPct}%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                BIODIVERSITY INDEX
              </div>
              <div
                style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: '4px 0' }}
              >
                {analyticsData.summary?.currentBiodiversityScore} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>Shannon Ecological Model</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                BIOMASS DENSITY
              </div>
              <div
                style={{ fontSize: '1.8rem', fontWeight: 700, color: '#60a5fa', margin: '4px 0' }}
              >
                {analyticsData.summary?.currentBiomassDensity}{' '}
                <span style={{ fontSize: '0.9rem' }}>t/ha</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aboveground Dry Matter
              </div>
            </div>
          </div>

          {/* Main Visualizations Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(620px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Chart 1: Carbon Accretion */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <HighchartsReact highcharts={Highcharts} options={carbonOptions} />
            </div>

            {/* Chart 2: NDVI Vegetation Health */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <HighchartsReact highcharts={Highcharts} options={vegetationOptions} />
            </div>
          </div>

          {/* Secondary Chart: Biodiversity & Biomass */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
            <HighchartsReact highcharts={Highcharts} options={biodiversityOptions} />
          </div>

          {/* Telemetry Raw Records Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Remote Sensing Historical Telemetry Log</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Quarterly sensor passes calibrated against ground-truth field plots
                </p>
              </div>
              <span className="badge badge-emerald">
                {analyticsData.rawRecords?.length || 0} Calibrated Passes
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th style={{ padding: '12px 10px' }}>Period</th>
                    <th style={{ padding: '12px 10px' }}>Date</th>
                    <th style={{ padding: '12px 10px' }}>NDVI</th>
                    <th style={{ padding: '12px 10px' }}>Canopy Cover</th>
                    <th style={{ padding: '12px 10px' }}>Biomass (t/ha)</th>
                    <th style={{ padding: '12px 10px' }}>Cumulative CO2e</th>
                    <th style={{ padding: '12px 10px' }}>Biodiversity</th>
                    <th style={{ padding: '12px 10px' }}>Sensor / Satellite</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.rawRecords?.map((row) => (
                    <tr
                      key={row._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--cyan-400)' }}>
                        {row.period}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {new Date(row.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--emerald-400)', fontWeight: 600 }}>
                        {row.ndvi}
                      </td>
                      <td style={{ padding: '10px' }}>{row.canopyCoverPct}%</td>
                      <td style={{ padding: '10px' }}>{row.biomassDensityTonnesPerHa} t/ha</td>
                      <td style={{ padding: '10px', fontWeight: 600, color: '#fbbf24' }}>
                        {row.cumulativeCarbonTonnes.toLocaleString()} t
                      </td>
                      <td style={{ padding: '10px', color: '#a855f7', fontWeight: 600 }}>
                        {row.biodiversityScore}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {row.sensorSource}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Record Telemetry Modal */}
      {isAddTelemetryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 13, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '540px', padding: '28px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--emerald-400)',
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Record Satellite Telemetry</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Ingest new remote sensing reading
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddTelemetryModalOpen(false)}
                className="btn-secondary btn-sm"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddTelemetry}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Period (e.g. 2025-Q1)
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={telemetryForm.period}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, period: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    NDVI Index (0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    required
                    className="input-field"
                    value={telemetryForm.ndvi}
                    onChange={(e) =>
                      setTelemetryForm({ ...telemetryForm, ndvi: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Canopy Cover %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="input-field"
                    value={telemetryForm.canopyCoverPct}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        canopyCoverPct: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Biomass Density (t/ha)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field"
                    value={telemetryForm.biomassDensityTonnesPerHa}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        biomassDensityTonnesPerHa: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Cumulative Carbon (tCO2e)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field"
                    value={telemetryForm.cumulativeCarbonTonnes}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        cumulativeCarbonTonnes: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    Biodiversity Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="input-field"
                    value={telemetryForm.biodiversityScore}
                    onChange={(e) =>
                      setTelemetryForm({
                        ...telemetryForm,
                        biodiversityScore: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  Sensor Source
                </label>
                <select
                  className="input-field"
                  value={telemetryForm.sensorSource}
                  onChange={(e) =>
                    setTelemetryForm({ ...telemetryForm, sensorSource: e.target.value })
                  }
                >
                  <option value="Sentinel-2 MSI (ESA Copernicus)">
                    Sentinel-2 MSI (ESA Copernicus)
                  </option>
                  <option value="Landsat-9 OLI-2 (NASA/USGS)">Landsat-9 OLI-2 (NASA/USGS)</option>
                  <option value="PlanetScope High-Res (3m)">PlanetScope High-Res (3m)</option>
                  <option value="LiDAR / UAV Airborne Scan">LiDAR / UAV Airborne Scan</option>
                  <option value="Field Ground Truth Verification">
                    Field Ground Truth Verification
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddTelemetryModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Recording...' : 'Save Telemetry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteAnalytics;
