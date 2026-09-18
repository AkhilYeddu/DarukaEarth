import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { siteAPI, projectAPI } from '../services/api';
import CreateSiteModal from './CreateSiteModal';
import CreateProjectModal from './CreateProjectModal';
import {
  PenTool,
  Plus,
  BarChart2,
  Filter,
  X,
  Mountain,
  Globe2,
  Maximize2,
  Satellite,
} from 'lucide-react';

// Set Mapbox Access Token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const BASEMAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

const getBiomeColor = (biome) => {
  switch (biome) {
    case 'Mangrove Estuary':
      return '#06b6d4';
    case 'Tropical Rainforest':
      return '#10b981';
    case 'Montane Cloud Forest':
      return '#34d399';
    case 'Agroforestry':
      return '#fbbf24';
    case 'Peatland Bog':
      return '#a855f7';
    default:
      return '#10b981';
  }
};

const MapDashboard = ({ onSelectSite, initialSelectedSiteId = null }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const drawControl = useRef(null);
  const popupRef = useRef(null);

  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [macroStats, setMacroStats] = useState(null);
  const [activeStyle, setActiveStyle] = useState('dark');
  const [is3D, setIs3D] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPointCount, setDrawnPointCount] = useState(0);

  // Modals
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [selectedSitePopup, setSelectedSitePopup] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [sitesRes, projectsRes, statsRes] = await Promise.all([
        siteAPI.getAll(),
        projectAPI.getAll(),
        projectAPI.getMacroStats(),
      ]);
      if (sitesRes.success) setSites(sitesRes.data || []);
      if (projectsRes.success) setProjects(projectsRes.data || []);
      if (statsRes.success) setMacroStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching map data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize Mapbox GL
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLES[activeStyle],
      center: [78.9629, 20.5937],
      zoom: 4.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    // Controls
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );

    // Mapbox Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.35,
          },
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#10b981',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
          },
        },
        {
          id: 'gl-draw-polygon-vertex',
          type: 'circle',
          filter: [
            'all',
            ['==', 'meta', 'vertex'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static'],
          ],
          paint: {
            'circle-radius': 6,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#06b6d4',
            'circle-stroke-width': 2,
          },
        },
        {
          id: 'gl-draw-point-midpoint',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
          paint: {
            'circle-radius': 3,
            'circle-color': '#06b6d4',
          },
        },
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#10b981',
            'line-dasharray': [0.2, 2],
            'line-width': 2,
          },
        },
      ],
    });
    map.addControl(draw, 'top-right');
    drawControl.current = draw;

    // Track vertex count during drawing
    map.on('draw.create', () => setDrawnPointCount(0));
    map.on('draw.render', () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry.type === 'Polygon') {
          setDrawnPointCount(feature.geometry.coordinates[0].length - 1);
        }
      }
    });

    // After map loads — add site polygon layers
    map.on('load', () => {
      // Add terrain + sky for 3D mode
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });

      // Site polygon source (empty initially, populated after sites load)
      map.addSource('sites', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Fill layer
      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.4,
        },
      });

      // Stroke layer
      map.addLayer({
        id: 'sites-stroke',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      });

      // Hover highlight layer
      map.addLayer({
        id: 'sites-fill-hover',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.75, 0],
        },
      });

      // Hover cursor
      map.on('mouseenter', 'sites-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          map.setFeatureState({ source: 'sites', id: e.features[0].id }, { hover: true });
        }
      });
      map.on('mouseleave', 'sites-fill', (e) => {
        map.getCanvas().style.cursor = '';
        map.querySourceFeatures('sites').forEach((f) => {
          map.setFeatureState({ source: 'sites', id: f.id }, { hover: false });
        });
        if (popupRef.current) popupRef.current.remove();
      });

      // Mousemove tooltip
      map.on('mousemove', 'sites-fill', (e) => {
        if (!e.features.length) return;
        const props = e.features[0].properties;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'site-hover-popup',
          offset: 12,
        })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:'Inter',sans-serif; padding:4px 2px">
              <div style="font-size:0.85rem;font-weight:700;color:#fff;margin-bottom:4px">${props.name}</div>
              <div style="font-size:0.73rem;color:#34d399">${props.areaHectares} ha</div>
              <div style="font-size:0.73rem;color:#94a3b8">${props.biome}</div>
            </div>`
          )
          .addTo(map);
      });

      // Click to select site
      map.on('click', 'sites-fill', (e) => {
        if (!e.features.length) return;
        const props = e.features[0].properties;
        setSelectedSitePopup({
          id: props.siteId,
          name: props.name,
          biome: props.biome,
          areaHectares: props.areaHectares,
          healthStatus: props.healthStatus || 'Optimal',
          projectName: props.projectName || 'Ecological Project',
        });
      });
    });

    mapInstance.current = map;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapInstance.current = null;
      drawControl.current = null;
    };
  }, []);

  // Sync site polygons to Mapbox source when sites or filter changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('sites');
    if (!source) return;

    const filteredSites =
      selectedProjectId === 'ALL'
        ? sites
        : sites.filter((s) => {
            const pId = s.projectId?._id || s.projectId?.id || s.projectId;
            return pId === selectedProjectId;
          });

    const features = filteredSites
      .filter((s) => s.geometry?.coordinates?.length > 0)
      .map((site, idx) => ({
        type: 'Feature',
        id: idx,
        geometry: site.geometry,
        properties: {
          siteId: site._id || site.id,
          name: site.name,
          biome: site.biome,
          areaHectares: site.areaHectares,
          healthStatus: site.healthStatus || 'Optimal',
          projectName: site.projectId?.name || 'Ecological Project',
          color: getBiomeColor(site.biome),
        },
      }));

    source.setData({ type: 'FeatureCollection', features });
  }, [sites, selectedProjectId]);

  // Also re-apply on style change
  const applyStyleAndSites = (map) => {
    map.once('styledata', () => {
      // Re-add terrain source
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }
      // Re-add sites source
      if (!map.getSource('sites')) {
        map.addSource('sites', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'sites-fill',
          type: 'fill',
          source: 'sites',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.4 },
        });
        map.addLayer({
          id: 'sites-stroke',
          type: 'line',
          source: 'sites',
          paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.9 },
        });
        map.addLayer({
          id: 'sites-fill-hover',
          type: 'fill',
          source: 'sites',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.75, 0],
          },
        });
      }
      // Re-apply site data
      const source = map.getSource('sites');
      if (source) {
        const filteredSites =
          selectedProjectId === 'ALL'
            ? sites
            : sites.filter((s) => {
                const pId = s.projectId?._id || s.projectId?.id || s.projectId;
                return pId === selectedProjectId;
              });
        const features = filteredSites
          .filter((s) => s.geometry?.coordinates?.length > 0)
          .map((site, idx) => ({
            type: 'Feature',
            id: idx,
            geometry: site.geometry,
            properties: {
              siteId: site._id || site.id,
              name: site.name,
              biome: site.biome,
              areaHectares: site.areaHectares,
              healthStatus: site.healthStatus || 'Optimal',
              projectName: site.projectId?.name || 'Ecological Project',
              color: getBiomeColor(site.biome),
            },
          }));
        source.setData({ type: 'FeatureCollection', features });
      }
      // Re-apply terrain if needed
      if (is3D && !map.getTerrain()) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      }
    });
  };

  const switchBasemap = (styleKey) => {
    const map = mapInstance.current;
    if (!map || styleKey === activeStyle) return;
    setActiveStyle(styleKey);
    map.setStyle(BASEMAP_STYLES[styleKey]);
    applyStyleAndSites(map);
  };

  const toggle3D = () => {
    const map = mapInstance.current;
    if (!map) return;
    const next = !is3D;
    setIs3D(next);
    if (next) {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      map.easeTo({ pitch: 55, duration: 1000 });
    } else {
      map.setTerrain(null);
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
  };

  // Drawing handlers using MapboxDraw
  const startDrawing = () => {
    const draw = drawControl.current;
    if (!draw) return;
    draw.deleteAll();
    draw.changeMode('draw_polygon');
    setIsDrawing(true);
    setDrawnPointCount(0);
  };

  const cancelDrawing = () => {
    const draw = drawControl.current;
    if (!draw) return;
    draw.deleteAll();
    draw.changeMode('simple_select');
    setIsDrawing(false);
    setDrawnPointCount(0);
  };

  const completeDrawing = () => {
    const draw = drawControl.current;
    if (!draw) return;

    // Finish the current polygon by ending drawing mode
    const data = draw.getAll();
    if (data.features.length > 0) {
      const feature = data.features[0];
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0].length >= 4) {
        setDrawnGeometry(feature.geometry);
        setIsSiteModalOpen(true);
        draw.deleteAll();
        draw.changeMode('simple_select');
        setIsDrawing(false);
        setDrawnPointCount(0);
      } else {
        alert('Please add at least 3 vertices to define a site boundary.');
      }
    } else {
      alert('No polygon drawn yet. Click on the map to add vertices.');
    }
  };

  const flyToRegion = (lat, lng, zoom, pitch = 0, bearing = 0) => {
    const map = mapInstance.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom, pitch, bearing, duration: 2000, essential: true });
  };

  const handleSiteCreated = (newSite) => {
    setSites((prev) => [newSite, ...prev]);
    fetchData();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 65px)',
        overflow: 'hidden',
      }}
    >
      {/* Mapbox GL Map Container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Drawing Mode Banner */}
      {isDrawing && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(13, 21, 39, 0.96)',
            border: '1px solid var(--emerald-400)',
            borderRadius: '12px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.2)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PenTool
              size={18}
              color="var(--emerald-400)"
              style={{ animation: 'pulse-slow 2s infinite' }}
            />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Drawing Site Polygon</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {drawnPointCount < 3
                  ? `Click map to add vertices — need at least 3 (${drawnPointCount} placed)`
                  : `${drawnPointCount} vertices placed — click "Finish" or add more`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={completeDrawing}
              disabled={drawnPointCount < 3}
              className="btn-primary btn-sm"
            >
              ✓ Finish Polygon
            </button>
            <button onClick={cancelDrawing} className="btn-secondary btn-sm">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Top Center KPI Bar */}
      {!isDrawing && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          {[
            {
              label: 'MANAGED AREA',
              value: macroStats?.totalHectares
                ? `${macroStats.totalHectares.toLocaleString()} ha`
                : '3,891.9 ha',
              color: 'var(--emerald-400)',
            },
            {
              label: 'ACTIVE SITES',
              value: macroStats?.totalSites || sites.length || 4,
              color: 'var(--cyan-400)',
            },
            {
              label: 'CARBON BANKED',
              value: macroStats?.totalCarbonTonnes
                ? `${macroStats.totalCarbonTonnes.toLocaleString()} tCO2e`
                : '78,450 tCO2e',
              color: '#fbbf24',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="glass-panel"
              style={{
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Left Control Panel */}
      <div
        style={{
          position: 'absolute',
          top: '75px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 500,
          width: '300px',
        }}
      >
        {/* Geospatial Actions */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Geospatial Actions</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              Admin
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={isDrawing ? cancelDrawing : startDrawing}
              className={isDrawing ? 'btn-secondary' : 'btn-primary'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <PenTool size={16} />
              <span>{isDrawing ? 'Cancel Drawing' : 'Draw Site Polygon'}</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={16} />
              <span>Add New Project</span>
            </button>
          </div>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            Use the draw tool to define precise site boundaries on the map.
          </p>
        </div>

        {/* Project Filter */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Filter size={15} color="var(--emerald-400)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter by Project</span>
          </div>
          <select
            className="input-field"
            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="ALL">All Projects ({sites.length} sites)</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Map Controls */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '10px',
            }}
          >
            Map Style
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { key: 'dark', icon: <Globe2 size={14} />, label: 'Dark Vector' },
              { key: 'satellite', icon: <Satellite size={14} />, label: 'Satellite HD' },
              { key: 'outdoors', icon: <Mountain size={14} />, label: 'Terrain / Outdoors' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => switchBasemap(key)}
                className={activeStyle === key ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                style={{ justifyContent: 'flex-start', fontSize: '0.78rem', gap: '8px' }}
              >
                {icon} {label}
              </button>
            ))}
            <button
              onClick={toggle3D}
              className={is3D ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              style={{
                justifyContent: 'flex-start',
                fontSize: '0.78rem',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              <Mountain size={14} /> {is3D ? '3D Terrain: ON' : '3D Terrain: OFF'}
            </button>
          </div>
        </div>

        {/* Ecological Hotspots */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Featured Hotspots
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: '🌊 Sundarbans Mangroves', lat: 22.14, lng: 88.83, zoom: 11, pitch: 30 },
              { label: '🌿 Western Ghats Canopy', lat: 10.3, lng: 76.94, zoom: 11, pitch: 30 },
              {
                label: '🦜 Costa Rica Cloud Corridor',
                lat: 8.55,
                lng: -83.56,
                zoom: 11,
                pitch: 45,
              },
              { label: '🏔️ Himalayan Buffer Zones', lat: 28.2, lng: 84.1, zoom: 10, pitch: 55 },
            ].map(({ label, lat, lng, zoom, pitch }) => (
              <button
                key={label}
                onClick={() => flyToRegion(lat, lng, zoom, pitch)}
                className="btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.74rem' }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => flyToRegion(20.59, 78.96, 4.5, 0, 0)}
              className="btn-secondary btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.74rem', marginTop: '2px' }}
            >
              <Maximize2 size={13} /> Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Site Click Popup Card */}
      {selectedSitePopup && (
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            right: '24px',
            width: '360px',
            zIndex: 600,
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '22px',
              border: '1px solid var(--emerald-400)',
              boxShadow: '0 12px 50px rgba(0,0,0,0.85), 0 0 30px rgba(16,185,129,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                  {selectedSitePopup.biome}
                </span>
                <h4 style={{ fontSize: '1.15rem', color: '#ffffff' }}>{selectedSitePopup.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Project: {selectedSitePopup.projectName}
                </div>
              </div>
              <button
                onClick={() => setSelectedSitePopup(null)}
                className="btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                margin: '14px 0',
                background: 'rgba(255,255,255,0.03)',
                padding: '10px',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SURFACE AREA</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                  {selectedSitePopup.areaHectares} ha
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HEALTH STATUS</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  {selectedSitePopup.healthStatus}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectSite(selectedSitePopup.id);
                setSelectedSitePopup(null);
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <BarChart2 size={16} />
              <span>View Deep Site Analytics</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateSiteModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        drawnGeometry={drawnGeometry}
        projects={projects}
        onSiteCreated={handleSiteCreated}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          fetchData();
        }}
      />
    </div>
  );
};

export default MapDashboard;
