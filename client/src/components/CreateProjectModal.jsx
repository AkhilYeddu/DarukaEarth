import React, { useState } from 'react';
import { projectAPI } from '../services/api';
import { X, FolderPlus, CheckCircle2, AlertCircle } from 'lucide-react';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'Reforestation',
    status: 'Active',
    country: '',
    region: '',
    targetCreditsTonnes: '',
    standard: 'Verra VCS',
    leadDeveloper: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await projectAPI.create({
        ...formData,
        targetCreditsTonnes: Number(formData.targetCreditsTonnes),
      });
      if (res.success) {
        onProjectCreated(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 13, 22, 0.8)',
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
          maxWidth: '580px',
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
            marginBottom: '20px',
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
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Create Ecological Project</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Add new carbon or biodiversity registry project
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
              Project Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Borneo Peat Swamp Forest Carbon"
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
              Project Description *
            </label>
            <textarea
              required
              rows={3}
              className="input-field"
              style={{ resize: 'vertical' }}
              placeholder="Describe the ecological restoration methodology, target biomes, and community impact..."
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
                Project Type *
              </label>
              <select
                className="input-field"
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              >
                <option value="Afforestation">Afforestation</option>
                <option value="Reforestation">Reforestation</option>
                <option value="Mangrove Restoration">Mangrove Restoration</option>
                <option value="Agroforestry">Agroforestry</option>
                <option value="Peatland Conservation">Peatland Conservation</option>
                <option value="Grassland Restoration">Grassland Restoration</option>
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
                Status
              </label>
              <select
                className="input-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Verified">Verified</option>
                <option value="Under Review">Under Review</option>
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
                Country *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Indonesia"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
                Region / State
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Central Kalimantan"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
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
                Target Credits (tCO2e) *
              </label>
              <input
                type="number"
                required
                min={0}
                className="input-field"
                placeholder="e.g. 50000"
                value={formData.targetCreditsTonnes}
                onChange={(e) => setFormData({ ...formData, targetCreditsTonnes: e.target.value })}
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
                Verification Standard
              </label>
              <select
                className="input-field"
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
              >
                <option value="Verra VCS">Verra VCS</option>
                <option value="Gold Standard">Gold Standard</option>
                <option value="Plan Vivo">Plan Vivo</option>
                <option value="Puro.earth">Puro.earth</option>
                <option value="Darukaa Ecological Standard">Darukaa Ecological Standard</option>
              </select>
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
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
