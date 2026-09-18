import React, { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';
import {
  Layers,
  MapPin,
  Plus,
  TreePine,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Search,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';

// Inline confirmation dialog for delete
const DeleteConfirmModal = ({ project, onConfirm, onCancel, deleting }) => {
  if (!project) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          border: '1px solid rgba(248, 113, 113, 0.4)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(248,113,113,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(248, 113, 113, 0.15)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} color="#f87171" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Delete Project</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This action is{' '}
              <strong style={{ color: '#f87171' }}>permanent and irreversible</strong>. All
              associated sites and telemetry analytics will be permanently deleted.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="btn-secondary btn-sm"
            style={{ padding: '4px 8px', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Project preview */}
        <div
          style={{
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            SELECTED FOR DELETION
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            {project.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {project.siteCount || 0} sites · {project.totalHectares || 0} ha managed ·{' '}
            {project.country}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: deleting
                ? 'rgba(248,113,113,0.4)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Yes, Delete Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectsRegistry = ({ onNavigateToMap, onSelectSiteForAnalytics }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete state
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getAll();
      if (res.success) {
        setProjects(res.data || []);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await projectAPI.delete(projectToDelete._id);
      // Remove from local state instantly
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      setProjectToDelete(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalHectares = projects.reduce((acc, p) => acc + (p.totalHectares || 0), 0);
  const totalTargetCredits = projects.reduce((acc, p) => acc + (p.targetCreditsTonnes || 0), 0);
  const totalSitesCount = projects.reduce((acc, p) => acc + (p.siteCount || 0), 0);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        project={projectToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setProjectToDelete(null);
          setDeleteError('');
        }}
        deleting={deleting}
      />

      {/* Delete error toast */}
      {deleteError && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(12px)',
            color: '#f87171',
            fontSize: '0.85rem',
            maxWidth: '380px',
          }}
        >
          <AlertTriangle size={16} />
          {deleteError}
          <button
            onClick={() => setDeleteError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header & Action */}
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
            <h1 style={{ fontSize: '2rem' }}>Projects Registry</h1>
            <span className="badge badge-emerald">{projects.length} Active Portfolios</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Centralized registry of nature-based carbon and biodiversity restoration initiatives
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          <span>Register New Project</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              TOTAL PROJECTS
            </span>
            <Layers size={18} color="var(--emerald-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{projects.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across 3 Continents
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MANAGED AREA</span>
            <Globe size={18} color="var(--cyan-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
            {Math.round(totalHectares).toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>ha</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Monitored via Satellite
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              GEOSPATIAL SITES
            </span>
            <MapPin size={18} color="var(--emerald-400)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
            {totalSitesCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Polygons</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            GeoJSON 2dsphere Indexed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              TARGET CREDITS
            </span>
            <TrendingUp size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24' }}>
            {totalTargetCredits.toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>tCO2e</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Under Registry Standards
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: '6px 0' }}
            placeholder="Search projects by name, country, or biome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            'ALL',
            'Reforestation',
            'Mangrove Restoration',
            'Agroforestry',
            'Peatland Conservation',
          ].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={typeFilter === type ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{ fontSize: '0.78rem' }}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading projects registry...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <TreePine size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No projects match your filter</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Try resetting your search query or create a new project.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-emerald">{project.projectType}</span>
                    <span className="badge badge-cyan">{project.standard}</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => setProjectToDelete(project)}
                    title="Delete project"
                    style={{
                      background: 'rgba(248, 113, 113, 0.08)',
                      border: '1px solid rgba(248, 113, 113, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#f87171',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(248, 113, 113, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(248, 113, 113, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.25)';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', lineHeight: 1.3 }}>
                  {project.name}
                </h3>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--cyan-400)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={14} />
                  <span>
                    {project.country} {project.region ? `• ${project.region}` : ''}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '20px',
                  }}
                >
                  {project.description}
                </p>

                {/* Project Sites List preview */}
                {project.sites && project.sites.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      ASSIGNED GEOGRAPHICAL SITES ({project.sites.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {project.sites.map((site) => (
                        <div
                          key={site._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            padding: '4px 0',
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>📍 {site.name}</span>
                          <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
                            {site.areaHectares} ha
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Summary */}
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      MANAGED HECTARES
                    </div>
                    <div
                      style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-400)' }}
                    >
                      {project.totalHectares || 0} ha
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      TARGET CREDITS
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                      {project.targetCreditsTonnes?.toLocaleString()} tCO2e
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onNavigateToMap(project._id)}
                    className="btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Globe size={15} />
                    <span>View on Map</span>
                  </button>
                  {project.sites && project.sites.length > 0 && (
                    <button
                      onClick={() => onSelectSiteForAnalytics(project.sites[0]._id)}
                      className="btn-secondary btn-sm"
                      title="View Site Analytics"
                    >
                      <ArrowUpRight size={15} />
                      <span>Analytics</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => fetchProjects()}
      />
    </div>
  );
};

export default ProjectsRegistry;
