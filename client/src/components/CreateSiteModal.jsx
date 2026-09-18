import React, { useState, useEffect } from 'react';
import { siteAPI } from '../services/api';
import { X, MapPin, CheckCircle2, AlertCircle, Sparkles, Compass } from 'lucide-react';

const CreateSiteModal = ({ isOpen, onClose, drawnGeometry, projects, onSiteCreated }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    description: '',
    biome: 'Tropical Rainforest',
    baselineYear: 2023,
    baselineBiomassTonnesPerHa: 50,
    targetAnnualSequestrationTonnes: 500,
    canopyTargetPct: 80,
    healthStatus: 'Recovering',
    tags: 'reforestation, polygon-site',
  });
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projects && projects.length > 0 && !formData.projectId) {
      setFormData((prev) => ({ ...prev, projectId: projects[0]._id || projects[0].id }));
    }
  }, [projects]);

  useEffect(() => {
    if (drawnGeometry && drawnGeometry.coordinates && drawnGeometry.coordinates[0]) {
      // Approximate polygon area from coordinates if turf isn't loaded on client yet
      const coords = drawnGeometry.coordinates[0];
      if (coords.length >= 4) {
        // Simple geodesic estimate for UI feedback
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          const p1 = coords[i];
          const p2 = coords[i + 1];
          area += (p2[0] - p1[0]) * (p2[1] + p1[1]);
        }
        // Conversion factor estimate in square km to hectares
        const approxHa = Math.max(12, Math.abs(Math.round(area * 111 * 111 * 100 * 10) / 10));
        setCalculatedArea(approxHa);
        setFormData((prev) => ({
          ...prev,
          targetAnnualSequestrationTonnes: Math.round(approxHa * 8.5),
        }));
      }
    }
  }, [drawnGeometry]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drawnGeometry) {
      setError('No polygon geometry provided from map drawing.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        projectId: formData.projectId,
        name: formData.name,
        description: formData.description,
        geometry: drawnGeometry,
        biome: formData.biome,
        baselineYear: Number(formData.baselineYear),
        baselineBiomassTonnesPerHa: Number(formData.baselineBiomassTonnesPerHa),
        targetAnnualSequestrationTonnes: Number(formData.targetAnnualSequestrationTonnes),
        canopyTargetPct: Number(formData.canopyTargetPct),
        healthStatus: formData.healthStatus,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await siteAPI.create(payload);
      if (res.success) {
        onSiteCreated(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save site polygon');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
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
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan-400)',
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Register Drawn Site</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Polygon captured from interactive map drawing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Polygon Metric Badge */}
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--cyan-400)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Vertices:{' '}
              <strong style={{ color: '#fff' }}>
                {drawnGeometry?.coordinates?.[0]?.length || 0} points
              </strong>
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Estimated Area:{' '}
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.82rem' }}>
              ~{calculatedArea} Hectares
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Assign to Project *
            </label>
            <select
              required
              className="input-field"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              {projects && projects.length > 0 ? (
                projects.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name} ({p.country}) - {p.projectType}
                  </option>
                ))
              ) : (
                <option value="">No projects available. Create a project first.</option>
              )}
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Site Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Sector 7 Canopy Restoration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '5px',
              }}
            >
              Description
            </label>
            <textarea
              rows={2}
              className="input-field"
              placeholder="Key tree species, soil type, and restoration baseline..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Biome Type
              </label>
              <select
                className="input-field"
                value={formData.biome}
                onChange={(e) => setFormData({ ...formData, biome: e.target.value })}
              >
                <option value="Tropical Rainforest">Tropical Rainforest</option>
                <option value="Mangrove Estuary">Mangrove Estuary</option>
                <option value="Montane Cloud Forest">Montane Cloud Forest</option>
                <option value="Temperate Broadleaf">Temperate Broadleaf</option>
                <option value="Peatland Bog">Peatland Bog</option>
                <option value="Subtropical Dry Forest">Subtropical Dry Forest</option>
                <option value="Savanna/Grassland">Savanna/Grassland</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Health Status
              </label>
              <select
                className="input-field"
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
              >
                <option value="Optimal">Optimal</option>
                <option value="Recovering">Recovering</option>
                <option value="Moderate">Moderate</option>
                <option value="Degraded">Degraded</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Baseline Biomass (t/ha)
              </label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={formData.baselineBiomassTonnesPerHa}
                onChange={(e) =>
                  setFormData({ ...formData, baselineBiomassTonnesPerHa: e.target.value })
                }
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Target Sequestration (tCO2e/yr)
              </label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={formData.targetAnnualSequestrationTonnes}
                onChange={(e) =>
                  setFormData({ ...formData, targetAnnualSequestrationTonnes: e.target.value })
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
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Canopy Target (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className="input-field"
                value={formData.canopyTargetPct}
                onChange={(e) => setFormData({ ...formData, canopyTargetPct: e.target.value })}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Tags (comma separated)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="mangrove, sentinel-2, verified"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}
          >
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <CheckCircle2 size={16} />
              <span>{loading ? 'Saving Polygon...' : 'Register Site'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSiteModal;
