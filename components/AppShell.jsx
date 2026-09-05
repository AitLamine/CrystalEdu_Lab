"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STRUCTS, CUBIC_STRUCT_KEYS } from '@/lib/structs';
import { TRANSLATIONS, STRUCT_NAME_KEY, PARAM_TRANSLATIONS_FR, EXAMPLES_TRANSLATIONS_FR, RRATIO_TRANSLATIONS_FR } from '@/lib/translations';
import { SYMMETRY_OPERATIONS, getEffectiveOperation } from '@/lib/symmetryOperations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeedbackModal from '@/components/FeedbackModal';
import StructControls from '@/components/StructControls';
import MillerControls from '@/components/MillerControls';
import GalleryControls from '@/components/GalleryControls';
import MobileNav from '@/components/MobileNav';
import MobileDrawer from '@/components/MobileDrawer';
import SymmetryControls, { StereographicProjection } from '@/components/SymmetryControls';

// ─── Constants ────────────────────────────────────────────────────────────────
const CS = 4.0;
const SF = CS / 4.0;
const SF_METAL = CS * 0.5;

// Default symmetry starting point: -60° from the y-axis, radius 0.25,
// z = 0 — i.e. [x, y, z] = [r·sin(-60°), r·cos(-60°), 0], derived rather
// than hardcoded so the angle/radius it represents stays self-documenting.
const DEFAULT_SYMMETRY_POINT = [0.25 * Math.sin(-Math.PI / 3), 0.25 * Math.cos(-Math.PI / 3), 0];

// Treats -0 as the negative side, not the positive one. JavaScript's
// `-0 >= 0` evaluates true, which matters here because inversion negates
// coordinates directly (e.g. z=0 becomes z=-0) — without this, an inverted
// point starting exactly on a cap/mirror boundary would be placed back on
// the SAME side as its original instead of the opposite side, breaking the
// symmetry of the inversion line and the inverted marker's position.
function isNonNegativeSide(value) {
  return !Object.is(value, -0) && value >= 0;
}

// For these two operations specifically, the 3D Cylinder View's
// cross-section-normal axis is deliberately displayed as z instead of the
// operation's own rotation axis (y) — a presentation choice for a clearer
// schematic, independent of the underlying math: the actual
// rotation/mirror still correctly happens around y via `selectedAxis`,
// only where atoms/markers land on the schematic cylinder's rim changes.
const CYLINDER_AXIS_DISPLAY_OVERRIDE = { '2//Oy': 'c', '2̄//Oy': 'c' };
function getDisplayCylinderAxis(operationKey, axis) {
  return CYLINDER_AXIS_DISPLAY_OVERRIDE[operationKey] || axis || 'c';
}

const SF_RADII = {
  sc:      [2.00,2.00,2.00,2.00,2.00,2.00,2.00,2.00],
  bcc:     [1.73,1.73,1.73,1.73,1.73,1.73,1.73,1.73,1.73],
  fcc:     [1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41,1.41],
  hcp:     [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  // The four ionic compounds and diamond keep the *real* relative ion-size
  // ratio (from their Shannon ionic / covalent radii) but rescaled so the two
  // species touch exactly at the true nearest-neighbor distance implied by
  // this app's own drawing scale (CS=4), i.e. the same distance already
  // shown in each structure's `param` row (a/2, a√3/2, a√3/4). Previously
  // these tables used the raw real-world Å radii unscaled, which — since the
  // app's cell size isn't real Ångströms — made CsCl look far too small/gapped
  // and NaCl/ZnS/CaF₂ look overlapped; CsCl's values didn't even match the
  // structure's own Cs/Cl radii used in Ball & Stick mode.
  cscl:    [1.6624,1.6624,1.6624,1.6624,1.6624,1.6624,1.6624,1.6624,1.8017],
  nacl:    [1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,1.2792,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208,0.7208],
  zns:     [1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,1.2353,0.4968,0.4968,0.4968,0.4968],
  caf2:    [0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.7434,0.9887,0.9887,0.9887,0.9887,0.9887,0.9887,0.9887,0.9887],
  diamond: [0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660,0.8660],
  tet_p:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  tet_i:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  ort_p:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  ort_i:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  ort_f:   [1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205],
  ort_c:   [1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205,1.7205],
  hex_p:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  rho_r:   [1.9988,1.9988,1.9988,1.9988,1.9988,1.9988,1.9988,1.9988],
  mon_p:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
  mon_c:   [1.6401,1.6401,1.6401,1.6401,1.6401,1.6401,1.6401,1.6401,1.6401,1.6401],
  tri_p:   [2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],
};

const DIR_PRESETS = [
  { uvw:[1,0,0], note:'Along a-axis. Simplest direction.' },
  { uvw:[0,1,0], note:'Along b-axis.' },
  { uvw:[0,0,1], note:'Along c-axis.' },
  { uvw:[1,1,0], note:'Face diagonal.' },
  { uvw:[1,0,1], note:'Face diagonal.' },
  { uvw:[0,1,1], note:'Face diagonal.' },
  { uvw:[1,1,1], note:'Body diagonal. Close-packed direction in BCC and FCC.' },
  { uvw:[1,1,2], note:'General direction.' },
  { uvw:[2,1,0], note:'General direction.' },
  { uvw:[-1,1,0], note:'Example with negative index (overbar notation: [1̄10]).' }
];

const PLANE_PRESETS = [
  { hkl:[1,0,0], note:'Perpendicular to a-axis. Most dense plane in SC.' },
  { hkl:[0,1,0], note:'Perpendicular to b-axis.' },
  { hkl:[0,0,1], note:'Perpendicular to c-axis.' },
  { hkl:[1,1,0], note:'Diagonal plane containing c-axis. Parallel to z.' },
  { hkl:[1,0,1], note:'Diagonal plane containing b-axis.' },
  { hkl:[0,1,1], note:'Diagonal plane containing a-axis.' },
  { hkl:[1,1,1], note:'Most dense plane in FCC. Intersects all axes equally.' },
  { hkl:[1,1,2], note:'General plane — all indices nonzero.' },
  { hkl:[2,1,0], note:'General plane.' },
  { hkl:[-1,1,0], note:'Example with negative index (overbar).' }
];

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdjdnyb';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function worldPos(f, ox, oy, oz, s) {
  if (s.lv) {
    const [a1, a2, a3] = s.lv;
    return new THREE.Vector3(
      f[0]*a1[0] + f[1]*a2[0] + f[2]*a3[0] - 0.5*(a1[0]+a2[0]+a3[0]) + ox,
      f[0]*a1[1] + f[1]*a2[1] + f[2]*a3[1] - 0.5*(a1[1]+a2[1]+a3[1]) + oy,
      f[0]*a1[2] + f[1]*a2[2] + f[2]*a3[2] - 0.5*(a1[2]+a2[2]+a3[2]) + oz
    );
  }
  const ax = s.ax||1, ay = s.ay||1, az = s.az||1;
  return new THREE.Vector3(
    f[0]*CS*ax - 0.5*CS*ax + ox,
    f[1]*CS*ay - 0.5*CS*ay + oy,
    f[2]*CS*az - 0.5*CS*az + oz
  );
}

function fmt(n) {
  return n < 0 ? `${Math.abs(n)}̄` : String(n);
}

function getAxisVector(s, axis) {
  if (!s) {
    console.warn('getAxisVector: missing structure data, fallback to z-axis');
    return new THREE.Vector3(0,0,1);
  }
  if (s.lv) {
    const v = axis === 'a' ? s.lv[0] : axis === 'b' ? s.lv[1] : s.lv[2];
    return new THREE.Vector3(...v).normalize();
  }
  const ax = (axis === 'a' ? (s.ax||1) : 0) * CS;
  const ay = (axis === 'b' ? (s.ay||1) : 0) * CS;
  const az = (axis === 'c' ? (s.az||1) : 0) * CS;
  return new THREE.Vector3(ax, ay, az).normalize();
}

function getSymmetryOrbit(s, pointFrac, axis, order, type) {
  const root = worldPos(pointFrac, 0, 0, 0, s);
  const axisVec = getAxisVector(s, axis);
  if (axisVec.length() < 1e-6) return [root];
  const angle = (2 * Math.PI) / order;
  const rot = new THREE.Matrix4().makeRotationAxis(axisVec, angle);
  const oper = new THREE.Matrix4();
  if (type === 'improper') {
    oper.makeScale(-1, -1, -1).multiply(rot);
  } else {
    oper.copy(rot);
  }
  const pts = [root.clone()];
  let current = root.clone();
  for (let i = 1; i < order; i++) {
    current = current.clone().applyMatrix4(oper);
    pts.push(current.clone());
  }
  // Remove tiny duplicates based on position
  return pts.filter((p, idx) => {
    for (let j = 0; j < idx; j++) {
      if (p.distanceTo(pts[j]) < 1e-3) return false;
    }
    return true;
  });
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export default function AppShell() {
  // ── UI State ──
  const [currentTab, setCurrentTab]       = useState('struct'); // Initialize current tab state
  const [tabSwitchKey, setTabSwitchKey]   = useState(0); // Force re-renders on tab switch
  const [lang, setLang]                   = useState('en');
  const [theme, setTheme]                 = useState('dark');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen]   = useState(false);
  const [showStereographic, setShowStereographic] = useState(true);
  const [showSymmetryPanel, setShowSymmetryPanel] = useState(true);
  const [projectionZoom, setProjectionZoom] = useState(1);
  const [autoRot, setAutoRot]             = useState(true);

  // ── Structure controls ──
    const [structKey, setStructKey]         = useState('sc'); // Initialize structure key state
  const [cellSize, setCellSizeState]      = useState(1);
  const [showBonds, setShowBonds]         = useState(true);
  const [renderMode, setRenderMode]       = useState('bs');

  // ── Miller controls ──
  const [millerSub, setMillerSub]         = useState('dir');
  const [millerCells, setMillerCells]     = useState(1);
  const [millerOrigin, setMillerOrigin]   = useState([0,0,0]);
  const [millerU, setMillerU]             = useState(1);
  const [millerV, setMillerV]             = useState(0);
  const [millerW, setMillerW]             = useState(0);
  const [millerH, setMillerH]             = useState(1);
  const [millerK, setMillerK]             = useState(0);
  const [millerL, setMillerL]             = useState(0);

  // ── Gallery controls ──
  const [galleryCellSize, setGalleryCellSize] = useState(1);

  // ── Symmetry controls ──
  const [symmetryPoint, setSymmetryPoint] = useState(DEFAULT_SYMMETRY_POINT);
  const [selectedOperation, setSelectedOperation] = useState('1');
  const [selectedAxis, setSelectedAxis] = useState('c'); // single source of truth for which physical axis (a/b/c) the current operation rotates about
  const [operationsLog, setOperationsLog] = useState([]);
  const [stepMode, setStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  // True right after entering Step-by-Step, before the user has explicitly
  // picked an operation — suppresses the "1" button's active highlight so it
  // doesn't look clicked when only the default point is being shown.
  const [stepFreshEntry, setStepFreshEntry] = useState(false);
  // True whenever selectedAxis was set as a side effect of picking an
  // operation (not by explicitly clicking the Rotation Axis picker) — the
  // two subsections stay visually independent: picking an operation never
  // lights up an x/y/z button, and using the axis picker never lights up a
  // Select Operation button.
  const [axisAutoSynced, setAxisAutoSynced] = useState(true);
  
  // ── New symmetry feature: manual step-by-step construction ──
  const [currentBasePoint, setCurrentBasePoint] = useState(DEFAULT_SYMMETRY_POINT);
  const [savedAtoms, setSavedAtoms] = useState([]);
  const [previewAtom, setPreviewAtom] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(120);
  const [angleMode, setAngleMode] = useState('preset');
  const [showConfirmBar, setShowConfirmBar] = useState(false);
  const [motionIndicators, setMotionIndicators] = useState([]);
  const [pendingAction, setPendingAction] = useState(null); // { type:'rotation'|'inversion', angle:number }
  const [animationSpeed, setAnimationSpeed] = useState('normal'); // 'slow', 'normal', 'fast'

  // ── Info display ──
  const [structInfo, setStructInfo]       = useState(null);
  const [millerInfo, setMillerInfo]       = useState(null);

  // ── Three.js refs ──
  const vpRef         = useRef(null);   // viewport div
  const vpGalleryRef  = useRef(null);   // gallery div
  const rendererRef   = useRef(null);
  const sceneRef      = useRef(null);
  const cameraRef     = useRef(null);
  const sceneGroupRef = useRef(null);
  const symmetryGuideGroupRef = useRef(null);
  const camQuatRef    = useRef(new THREE.Quaternion());
  const camDistRef    = useRef(14);
  const dragRef       = useRef(false);
  const pinchStartDistRef = useRef(null);
  const pinchStartCamDistRef = useRef(null);
  const lxRef         = useRef(0);
  const lyRef         = useRef(0);
  const autoRotRef    = useRef(true);
  const currentTabRef = useRef('struct');
  const orbitTargetRef= useRef(new THREE.Vector3());
  const rafRef        = useRef(null);
  const resizeObserverRef = useRef(null);
  const axLblXRef     = useRef(null);
  const axLblYRef     = useRef(null);
  const axLblZRef     = useRef(null);
  const axisLabelPts  = useRef({ X:null, Y:null, Z:null });
  
  // ── Symmetry-specific refs ──
  const symmetryAtomMeshesRef = useRef([]);  // Track all added atoms for removal
  const motionIndicatorRef = useRef(null);  // Track current motion indicator line/arrow
  const symmetryAnimTokenRef = useRef(0);  // Invalidates in-flight rotation/inversion animations

  // Gallery refs
  const gRendererRef  = useRef(null);
  const galleryItems  = useRef([]);
  const galleryActive = useRef(false);
  const galleryRAF    = useRef(null);

  // Sync autoRot ref with state
  useEffect(() => { autoRotRef.current = autoRot; }, [autoRot]);
  // updateAxisLabels() is also called from the render loop, whose closure is
  // created once at mount ([] deps) and therefore permanently sees whatever
  // `currentTab` was at that moment — reading it through a ref instead keeps
  // every caller (loop included) looking at the live value.
  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);

  // Theme persistence and document attribute
  useEffect(() => {
    const saved = window.localStorage.getItem('crystaledu-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('crystaledu-theme', theme);
    if (rendererRef.current) {
      rendererRef.current.setClearColor(theme === 'light' ? 0xf3f6ff : 0x07071a);
    }
    if (gRendererRef.current) {
      gRendererRef.current.setClearColor(theme === 'light' ? 0xe5e8f8 : 0x13133a, 1);
    }
  }, [theme]);

  useEffect(() => {
    const handleCompactResize = () => {
      const smallScreen = window.innerWidth < 1024 || window.innerHeight < 720;
      setIsCompactMode(smallScreen);
      if (smallScreen && !isSidebarPinned) {
        setSidebarOpen(false);
      } else if (!smallScreen && !isSidebarPinned) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleCompactResize);
    handleCompactResize();
    return () => window.removeEventListener('resize', handleCompactResize);
  }, [isSidebarPinned]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ── Translation helper ── (optional `vars` fills {placeholder} tokens, e.g. t('stepShowResult', { n: 2 }))
  const t = useCallback((key, vars) => {
    let str = (TRANSLATIONS[lang] || TRANSLATIONS.en)[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    }
    return str;
  }, [lang]);

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(vp.clientWidth, vp.clientHeight);
    renderer.setClearColor(theme === 'light' ? 0xf3f6ff : 0x07071a);
    vp.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, vp.clientWidth/vp.clientHeight, 0.1, 3000);
    cameraRef.current = camera;

    // Lighting
    scene.add(new THREE.AmbientLight(0x3040a0, 0.8));
    const dl1 = new THREE.DirectionalLight(0xffffff, 1.0); dl1.position.set(6,8,6); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0x1133ff, 0.3); dl2.position.set(-5,-4,-5); scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(0x00d4ff, 0.2); dl3.position.set(0,0,10); scene.add(dl3);

    // Structure scene group
    const structureGroup = new THREE.Group();
    scene.add(structureGroup);
    sceneGroupRef.current = structureGroup;

    // Symmetry guide group (cylinder + orbit markers)
    const symmetryGroup = new THREE.Group();
    scene.add(symmetryGroup);
    symmetryGuideGroupRef.current = symmetryGroup;

    // Default orbit (keep enough distance for symmetry cylinder visibility)
    setDefaultOrbit(1.05, 0.55, 24); // adjusted to improve viewport fill in symmetry mode
    applyOrbit();

    // Gallery renderer
    const gRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    gRenderer.setPixelRatio(1);
    gRenderer.setClearColor(theme === 'light' ? 0xe5e8f8 : 0x13133a, 1);
    gRenderer.setSize(220, 160);
    gRendererRef.current = gRenderer;

    // Resize handler
    // Resize handler with ResizeObserver for better responsive support.
    // Reads vpRef.current fresh on every call rather than closing over the
    // mount-time `vp` — the Symmetry tab uses a different viewport <div> than
    // the other tabs, and once that swap happens the mount-time node is
    // detached from the DOM (clientWidth/Height read 0), so a stale reference
    // here would silently no-op on every resize while symmetry-related layout
    // changes (hiding the side panel, resizing the window) are in effect.
    const onResize = () => {
      const currentVp = vpRef.current;
      if (!currentVp) return;
      const width = currentVp.clientWidth;
      const height = currentVp.clientHeight;
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyOrbit();
      // Force immediate render after resize
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);
    
    // Add ResizeObserver for responsive updates. The Symmetry tab swaps in a
    // different viewport <div> (vpRef points to a new DOM node), so this observer
    // must be re-targeted on every tab switch — see the effect below.
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(vp);
    resizeObserverRef.current = resizeObserver;
    
    // Handle orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(onResize, 300);
    });

    // Start render loop
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (autoRotRef.current && !dragRef.current) {
        const qRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), 0.003);
        camQuatRef.current.premultiply(qRot);
        applyOrbit();
      }
      renderer.render(scene, camera);
      updateAxisLabels();
    }
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      gRenderer.dispose();
      if (vp.contains(renderer.domElement)) vp.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle canvas container changes for different tabs ────────────────────
  useEffect(() => {
    const vp = vpRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (vp && renderer && camera && !vp.contains(renderer.domElement)) {
      // Move the canvas to the current container
      const canvas = renderer.domElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      vp.appendChild(canvas);
    }
    // Re-target the ResizeObserver at whatever container is current and refresh
    // the size immediately: vpRef can point to a different DOM node depending on
    // the tab (the Symmetry tab uses its own viewport <div>), and an observer
    // bound to the previous node never fires again once that node is swapped out,
    // so without this the canvas silently keeps its last known size on tab switch.
    if (vp && renderer && camera) {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current.observe(vp);
      }
      if (vp.clientWidth > 0 && vp.clientHeight > 0) {
        renderer.setSize(vp.clientWidth, vp.clientHeight);
        camera.aspect = vp.clientWidth / vp.clientHeight;
        camera.updateProjectionMatrix();
      }
    }

    if (currentTab === 'symmetry') {
      // Force symmetry view camera distance for full cylinder display
      setDefaultOrbit(1.05, 0.55, 24);
      applyOrbit();
    }
  }, [currentTab]);

  // ── Orbit helpers ──────────────────────────────────────────────────────────
  function setDefaultOrbit(phi, theta, r) {
    camDistRef.current = r;
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), theta);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), phi - Math.PI/2);
    camQuatRef.current.copy(qY).multiply(qX);
  }

  function applyOrbit() {
    const cam = cameraRef.current;
    if (!cam) return;
    const offset = new THREE.Vector3(0, 0, camDistRef.current).applyQuaternion(camQuatRef.current);
    cam.position.copy(orbitTargetRef.current).add(offset);
    cam.up.copy(new THREE.Vector3(0,1,0).applyQuaternion(camQuatRef.current));
    cam.lookAt(orbitTargetRef.current);
    cam.updateProjectionMatrix();
  }

  function centerOrbitOnScene(targetGroup) {
    const sg = targetGroup || sceneGroupRef.current;
    const cam = cameraRef.current;
    if (!sg || !cam) return;

    const bbox = new THREE.Box3().setFromObject(sg);
    if (bbox.isEmpty()) {
      orbitTargetRef.current.set(0, 0, 0);
      camDistRef.current = Math.max(20, camDistRef.current || 24);
      applyOrbit();
      return;
    }

    const centroid = bbox.getCenter(new THREE.Vector3());
    orbitTargetRef.current.copy(centroid);
    const sphere = bbox.getBoundingSphere(new THREE.Sphere());
    const idealDistance = Math.max(10, sphere.radius * 2.6);
    camDistRef.current = idealDistance;
    applyOrbit();
  }

  function alignGroupToY(fromVec, targetGroup) {
    const sg = targetGroup || sceneGroupRef.current;
    if (!sg) return;
    const up = new THREE.Vector3(0,1,0);
    const src = fromVec.clone().normalize();
    if (src.distanceTo(up) < 0.001) {
      sg.quaternion.identity();
    } else if (src.distanceTo(up.clone().negate()) < 0.001) {
      sg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI);
    } else {
      sg.quaternion.setFromUnitVectors(src, up);
    }
  }

  // ── Mouse / Touch controls ─────────────────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const el = renderer.domElement;

    const onMouseDown = (e) => { dragRef.current = true; lxRef.current = e.clientX; lyRef.current = e.clientY; };
    const onMouseUp   = () => { dragRef.current = false; };
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - lxRef.current) * 0.007;
      const dy = (e.clientY - lyRef.current) * 0.007;
      lxRef.current = e.clientX; lyRef.current = e.clientY;
      const right = new THREE.Vector3(1,0,0).applyQuaternion(camQuatRef.current);
      const up    = new THREE.Vector3(0,1,0).applyQuaternion(camQuatRef.current);
      const qH = new THREE.Quaternion().setFromAxisAngle(up, -dx);
      const qV = new THREE.Quaternion().setFromAxisAngle(right, -dy);
      camQuatRef.current.premultiply(qH).premultiply(qV);
      applyOrbit();
    };
    const onWheel = (e) => {
      if (currentTab === 'symmetry') {
        camDistRef.current = Math.max(0.5, Math.min(600, camDistRef.current + e.deltaY * 0.03));
      } else {
        camDistRef.current = Math.max(0.5, Math.min(400, camDistRef.current + e.deltaY * 0.03));
      }
      applyOrbit(); e.preventDefault();
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchStartDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartCamDistRef.current = camDistRef.current;
        dragRef.current = false;
        return;
      }
      dragRef.current = true;
      lxRef.current = e.touches[0].clientX;
      lyRef.current = e.touches[0].clientY;
    };
    const onTouchEnd   = () => {
      dragRef.current = false;
      pinchStartDistRef.current = null;
      pinchStartCamDistRef.current = null;
    };
    const onTouchMove  = (e) => {
      if (e.touches.length === 2 && pinchStartDistRef.current && pinchStartCamDistRef.current) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDist / pinchStartDistRef.current;
        const minD = 0.5;
        const maxD = currentTab === 'symmetry' ? 600 : 400;
        camDistRef.current = Math.max(minD, Math.min(maxD, pinchStartCamDistRef.current / scale));
        applyOrbit();
        e.preventDefault();
        return;
      }
      if (!dragRef.current) return;
      const dx = (e.touches[0].clientX - lxRef.current) * 0.007;
      const dy = (e.touches[0].clientY - lyRef.current) * 0.007;
      lxRef.current = e.touches[0].clientX;
      lyRef.current = e.touches[0].clientY;
      const right = new THREE.Vector3(1,0,0).applyQuaternion(camQuatRef.current);
      const up    = new THREE.Vector3(0,1,0).applyQuaternion(camQuatRef.current);
      const qH = new THREE.Quaternion().setFromAxisAngle(up, -dx);
      const qV = new THREE.Quaternion().setFromAxisAngle(right, -dy);
      camQuatRef.current.premultiply(qH).premultiply(qV);
      applyOrbit();
      e.preventDefault();
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [currentTab]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const STRUCT_KEYS = Object.keys(STRUCTS);
    const onKeyDown = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'r' || e.key === 'R') { setAutoRot(v => !v); }
      if (e.key === 'b' || e.key === 'B') { setShowBonds(v => !v); }
      if (e.key === 'c' || e.key === 'C') { setRenderMode(v => v === 'bs' ? 'cpk' : 'bs'); }
      if (e.key === 'ArrowRight') {
        setStructKey(k => { const i = STRUCT_KEYS.indexOf(k); return STRUCT_KEYS[(i+1) % STRUCT_KEYS.length]; });
      }
      if (e.key === 'ArrowLeft') {
        setStructKey(k => { const i = STRUCT_KEYS.indexOf(k); return STRUCT_KEYS[(i-1+STRUCT_KEYS.length) % STRUCT_KEYS.length]; });
      }
      if (e.key === 'Escape') setFeedbackOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTab, setAutoRot, setShowBonds, setRenderMode]);

  // ── Update symmetry scene when motion indicators change ───────────────────
  useEffect(() => {
    if (currentTab === 'symmetry') {
      updateSymmetryScene(selectedOperation, symmetryPoint);
    }
    // updateSymmetryScene is a plain function recreated every render; depending on it
    // would re-run this effect on every render regardless of the values below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionIndicators, selectedOperation, symmetryPoint, currentTab, savedAtoms, currentBasePoint]);

  // ── Axis Labels ────────────────────────────────────────────────────────────
  function updateAxisLabels() {
    const pts = axisLabelPts.current;
    const vp = vpRef.current;
    const camera = cameraRef.current;
    const tab = currentTabRef.current;
    const sg = tab === 'symmetry' ? symmetryGuideGroupRef.current || sceneGroupRef.current : sceneGroupRef.current;
    if (!pts.X || !vp || !camera || !sg || (tab !== 'struct' && tab !== 'miller' && tab !== 'symmetry')) {
      [axLblXRef, axLblYRef, axLblZRef].forEach(r => { if (r.current) r.current.style.display = 'none'; });
      return;
    }
    const w = vp.clientWidth, h = vp.clientHeight;
    const labels = [
      { ref: axLblXRef, pt: pts.X },
      { ref: axLblYRef, pt: pts.Y },
      { ref: axLblZRef, pt: pts.Z },
    ];
    sg.updateMatrixWorld(true);
    labels.forEach(({ ref, pt }) => {
      if (!ref.current) return;
      const worldPt = pt.clone().applyMatrix4(sg.matrixWorld);
      const pos = worldPt.project(camera);
      if (pos.z >= 1.0) { ref.current.style.display = 'none'; return; }
      ref.current.style.display = 'block';
      ref.current.style.left = ((pos.x * 0.5 + 0.5) * w) + 'px';
      ref.current.style.top  = ((-pos.y * 0.5 + 0.5) * h) + 'px';
    });
  }

  // ── Scene cleanup ──────────────────────────────────────────────────────────
  function clearScene() {
    clearGroup(sceneGroupRef.current);
    clearGroup(symmetryGuideGroupRef.current);
    axisLabelPts.current = { X: null, Y: null, Z: null };
  }

  function clearGroup(sg) {
    if (!sg) return;
    while (sg.children.length > 0) {
      const child = sg.children[0];
      disposeObj(child);
      sg.remove(child);
    }
    sg.quaternion.identity();
  }

  function disposeObj(obj) {
    obj.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
  }

  function tag(obj) { obj.userData.clab = true; return obj; }

  function buildSymmetryGuide(sg, operationKey, startPoint, structKey, axisOverride) {
    if (!sg) return;

    // Ensure the symmetry group is visible and ready for debug
    sg.visible = true;

    const operation = getEffectiveOperation(operationKey, axisOverride);
    if (!operation) return;

    console.log('🔷 buildSymmetryGuide:', { operationKey, startPoint, structKey, childrenBefore: sg.children.length });

    // Determine cylinder orientation: whichever axis is currently selected
    // (display-overridden for 2//Oy / 2̄//Oy — see getDisplayCylinderAxis)
    const cylinderAxis = getDisplayCylinderAxis(operationKey, axisOverride);

    // Remove connecting guide lines; keep only sphere + planes/orientations for clean view
    // const axisMat = new THREE.LineBasicMaterial({ color: 0x6495ed, opacity: 0.3, transparent: true });
    // const axisLines = [
    //   [new THREE.Vector3(-CS * 1.8, 0, 0), new THREE.Vector3(CS * 1.8, 0, 0)],
    //   [new THREE.Vector3(0, -CS * 1.8, 0), new THREE.Vector3(0, CS * 1.8, 0)],
    //   [new THREE.Vector3(0, 0, -CS * 1.8), new THREE.Vector3(0, 0, CS * 1.8)],
    // ];
    // axisLines.forEach(([p1, p2]) => {
    //   const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    //   sg.add(tag(new THREE.Line(geom, axisMat)));
    // });

    // Add a/b/c axis arrows only
    const axLen = CS * 2.0;
    const arrowHeadLen = CS * 0.25;
    const arrowHeadWidth = CS * 0.08;
    sg.add(tag(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axLen, 0xff3333, arrowHeadLen, arrowHeadWidth)));
    sg.add(tag(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axLen, 0x33dd33, arrowHeadLen, arrowHeadWidth)));
    sg.add(tag(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axLen, 0x3399ff, arrowHeadLen, arrowHeadWidth)));

    // Axis label screen positions at arrow ends
    const axisLabelOffset = 0.12 * CS;
    axisLabelPts.current = {
      X: new THREE.Vector3(axLen + axisLabelOffset, 0, 0),
      Y: new THREE.Vector3(0, axLen + axisLabelOffset, 0),
      Z: new THREE.Vector3(0, 0, axLen + axisLabelOffset),
    };

    // Cylinder is hidden for all operations (user request). Use indicator planes instead.
    const planeMat = new THREE.MeshPhongMaterial({
      color: 0x1a3f82,
      emissive: 0x183152,
      opacity: 0.25,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const planeGeo = new THREE.CircleGeometry(CS * 1.8, 128);
    const planeA = tag(new THREE.Mesh(planeGeo, planeMat.clone()));
    const planeB = tag(new THREE.Mesh(planeGeo, planeMat.clone()));
    if (cylinderAxis === 'a') {
      planeA.rotation.y = Math.PI / 2;
      planeB.rotation.y = Math.PI / 2;
      planeA.position.x = CS * 1.5;
      planeB.position.x = -CS * 1.5;
    } else if (cylinderAxis === 'b') {
      planeA.rotation.x = Math.PI / 2;
      planeB.rotation.x = Math.PI / 2;
      planeA.position.y = CS * 1.5;
      planeB.position.y = -CS * 1.5;
    } else {
      planeA.position.z = CS * 1.5;
      planeB.position.z = -CS * 1.5;
    }
    sg.add(planeA);
    sg.add(planeB);

    // Add a visible center marker
    const centerMark = tag(new THREE.Mesh(
      new THREE.SphereGeometry(CS * 0.12, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xff3333 })
    ));
    centerMark.position.set(0,0,0);
    sg.add(centerMark);

    // End caps are omitted because the cylinder itself is hidden; planes now represent orientation.

    // Add atoms on cylinder rims based on operation — Direct mode only.
    // Step-by-Step has its own dedicated renderer (updateSymmetryScene) that
    // tracks the live point and saved checkpoints individually; drawing the
    // operation's full default-position orbit here too would add an
    // untracked gold sphere at the original point that never gets cleared
    // as the user rotates away from it (this function only reruns when the
    // operation/axis/point changes, not on every Step-by-Step rotation).
    if (!stepMode) {
      const atomRadius = 0.12 * CS;
      const cylinderRadius = CS * 1.3;
      const cylinderHalfHeight = CS * 1.5;

      // Generate points for this operation and use all resulting orbit points (top/bottom based on sign)
      const orbitPoints = generateOrbitPoints(startPoint, operation, operationKey);

      // Use actual orbit point coordinates for 3D placement (correct 2//Oy/Oz etc)
      orbitPoints.forEach((point, idx) => {
        const proj = projectPointForAxis(point, cylinderAxis);
        if (!proj) return;
        const rim = mapProjectedToCylinderRim(proj, cylinderAxis, cylinderRadius, cylinderHalfHeight);
        if (!rim) return;

        const atomMat = new THREE.MeshPhongMaterial({
          color: 0xffa500, // Gold for all orbit atoms
          emissive: 0x442200,
          shininess: 80
        });

        const atom = tag(new THREE.Mesh(
          new THREE.SphereGeometry(atomRadius, 16, 12),
          atomMat
        ));
        atom.position.copy(rim);
        sg.add(atom);
      });
    }

    // Removed starting point marker - atoms on rims are sufficient
  }

  // ── Update symmetry scene with saved and preview atoms ────────────────────
  function updateSymmetryScene(operationKey, basePoint) {
    const sg = symmetryGuideGroupRef.current;
    if (!sg || currentTab !== 'symmetry') return;

    // Remove only connection guides (lines/segments), keep axis arrows in symmetry view
    sg.children.filter(child => child.type === 'Line' || child.type === 'LineSegments').forEach(child => {
      disposeObj(child);
      sg.remove(child);
    });

    const operation = getEffectiveOperation(operationKey, selectedAxis);
    if (!operation) return;

    // Remove old atom meshes (keep cylinder and arrows)
    symmetryAtomMeshesRef.current.forEach(mesh => sg.remove(mesh));
    symmetryAtomMeshesRef.current = [];

    // Determine cylinder axis: whichever axis is currently selected
    // (display-overridden for 2//Oy / 2̄//Oy — see getDisplayCylinderAxis)
    const cylinderAxis = getDisplayCylinderAxis(operationKey, selectedAxis);

    const cylinderRadius = CS * 1.3;
    const cylinderHalfHeight = CS * 1.5;
    const atomRadius = 0.12 * CS;

    // Helper to add atom to scene
    const addAtomToScene = (point, isOriginal = false) => {
      if (!point) {
        console.warn('updateSymmetryScene: null point');
        return;
      }

      const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
      if (isNaN(x) || isNaN(y) || isNaN(z)) return;

      // Determine position on cylinder rim
      let isAbove;
      let phi;
      if (cylinderAxis === 'a') {
        isAbove = isNonNegativeSide(x);
        phi = Math.atan2(z, y);
      } else if (cylinderAxis === 'b') {
        isAbove = isNonNegativeSide(y);
        phi = Math.atan2(z, x);
      } else {
        isAbove = isNonNegativeSide(z);
        phi = Math.atan2(y, x);
      }

      const rimHeight = isAbove ? cylinderHalfHeight : -cylinderHalfHeight;

      let posX, posY, posZ;
      if (cylinderAxis === 'a') {
        posX = rimHeight;
        posY = cylinderRadius * Math.cos(phi);
        posZ = cylinderRadius * Math.sin(phi);
      } else if (cylinderAxis === 'b') {
        posX = cylinderRadius * Math.cos(phi);
        posY = rimHeight;
        posZ = cylinderRadius * Math.sin(phi);
      } else {
        posX = cylinderRadius * Math.cos(phi);
        posY = cylinderRadius * Math.sin(phi);
        posZ = rimHeight;
      }

      const matColor = 0xffa500; // Gold for all symmetry atoms
      const matEmissive = 0x442200;
      const atomMat = new THREE.MeshPhongMaterial({
        color: matColor,
        emissive: matEmissive,
        shininess: 80
      });

      const atom = tag(new THREE.Mesh(
        new THREE.SphereGeometry(atomRadius, 16, 12),
        atomMat
      ));

      atom.position.set(posX, posY, posZ);
      sg.add(atom);
      symmetryAtomMeshesRef.current.push(atom);
    };

    // Helper to convert a 3D point to the corresponding rim position on the cylinder surface
    const mapPointToCylinder = (point) => {
      const proj = projectPointForAxis(point, cylinderAxis);
      if (!proj) return new THREE.Vector3(0, 0, 0);
      return mapProjectedToCylinderRim(proj, cylinderAxis, cylinderRadius, cylinderHalfHeight);
    };

    const pointKey = (point) => {
      if (!point) return null;
      let x, y, z;
      if (Array.isArray(point)) {
        [x, y, z] = point;
      } else if (point.x !== undefined && point.y !== undefined && point.z !== undefined) {
        x = point.x; y = point.y; z = point.z;
      } else {
        return null;
      }
      if ([x,y,z].some(v => isNaN(v))) return null;
      return `${x.toFixed(6)}_${y.toFixed(6)}_${z.toFixed(6)}`;
    };

    // Determine active base and saved points (all points on top/bottom caps for operation structures)
    const activeBasePoint = (currentBasePoint && currentBasePoint.length === 3) ? currentBasePoint : basePoint;
    const validSavedAtoms = savedAtoms.filter(atom => atom && (Array.isArray(atom) ? atom.length === 3 : true));
    const watchPoints = [
      { point: activeBasePoint, isSaved: false },
      ...validSavedAtoms.map(atom => ({ point: atom, isSaved: true })),
    ];
    const axis = cylinderAxis; // already derived from operationKey above
    const visiblePoints = watchPoints
      .map(entry => ({ ...entry, proj: projectPointForAxis(entry.point, axis) }))
      .filter(item => item.proj);

    const pointsEqual = (a, b) => {
      const [ax, ay, az] = Array.isArray(a) ? a : [a.x, a.y, a.z];
      const [bx, by, bz] = Array.isArray(b) ? b : [b.x, b.y, b.z];
      return Math.abs(ax - bx) < 1e-6 && Math.abs(ay - by) < 1e-6 && Math.abs(az - bz) < 1e-6;
    };
    // Once the live point has been saved, it sits exactly on top of that
    // saved marker until the next Rotate/Inversion moves it away — skip the
    // redundant gold sphere so only the green "saved" one is visible,
    // giving a clear confirmation that Save Position was applied.
    const activeMatchesSaved = validSavedAtoms.some(saved => pointsEqual(saved, activeBasePoint));
    // While Rotate/Inversion is animating, currentBasePoint (and therefore
    // activeBasePoint) is deliberately still the OLD position — only
    // previewAtom moves. Once it has visibly diverged from that old
    // position, stop drawing the "resting" gold sphere there too, so only
    // the single animating ball (drawn further below) is shown instead of
    // two — the old one frozen in place plus the one sweeping past it.
    // Inversion suppresses it for the whole animation (progress 0 included)
    // since the animated ball is drawn at that exact same spot at t=0 too.
    const isAnimatingAway = previewAtom && (previewAtom.isInversion || pointKey(previewAtom) !== pointKey(activeBasePoint));

    visiblePoints.forEach((entry) => {
      const { point, isSaved, proj: projection } = entry;
      if (!isSaved && (activeMatchesSaved || isAnimatingAway)) return;
      const pos = mapProjectedToCylinderRim(projection, axis, cylinderRadius, cylinderHalfHeight);
      if (!pos) return;
      // Saved positions turn green (matching the Save Position button) so
      // the user can see the click landed; the live point that
      // Rotate/Inversion will actually move stays gold.
      const matColor = isSaved ? 0x28a745 : 0xffa500;
      const matEmissive = isSaved ? 0x0a3315 : 0x442200;
      const atomMat = new THREE.MeshPhongMaterial({ color: matColor, emissive: matEmissive, shininess: 80 });
      const atom = tag(new THREE.Mesh(new THREE.SphereGeometry(atomRadius, 16, 12), atomMat));
      atom.position.copy(pos);
      sg.add(atom);
      symmetryAtomMeshesRef.current.push(atom);
    });

    // Add current preview atom (green while animating only; final position is drawn as base atom)
    if (previewAtom && previewAtom.isInversion) {
      // Map only the well-defined start point once, then slide in a
      // straight line to its exact reflection through the origin — see the
      // note in applyInversion for why re-projecting intermediate raw
      // coordinates (which pass near the origin, where direction/angle is
      // undefined) isn't used here.
      const startRim = mapPointToCylinder(previewAtom.from);
      const endRim = startRim.clone().negate();
      const pos = startRim.clone().lerp(endRim, previewAtom.progress ?? 1);
      const currentMat = new THREE.MeshPhongMaterial({ color: 0xffa500, emissive: 0x442200, shininess: 80 });
      const currentMesh = tag(new THREE.Mesh(new THREE.SphereGeometry(atomRadius, 16, 12), currentMat));
      currentMesh.position.copy(pos);
      sg.add(currentMesh);
      symmetryAtomMeshesRef.current.push(currentMesh);
    } else {
      const animatedPoint = isAnimatingAway ? previewAtom : null;
      if (animatedPoint) {
        const isAlreadySaved = savedAtoms.some(saved => {
          const [ax, ay, az] = Array.isArray(animatedPoint) ? animatedPoint : [animatedPoint.x, animatedPoint.y, animatedPoint.z];
          return Math.abs(saved.x - ax) < 1e-6 && Math.abs(saved.y - ay) < 1e-6 && Math.abs(saved.z - az) < 1e-6;
        });
        if (!isAlreadySaved) {
          const proj = projectPointForAxis(animatedPoint, axis);
          if (proj) {
            const rim = mapProjectedToCylinderRim(proj, axis, cylinderRadius, cylinderHalfHeight);
            if (rim) {
              const currentMat = new THREE.MeshPhongMaterial({ color: 0xffa500, emissive: 0x442200, shininess: 80 });
              const currentMesh = tag(new THREE.Mesh(new THREE.SphereGeometry(atomRadius, 16, 12), currentMat));
              currentMesh.position.copy(rim);
              sg.add(currentMesh);
              symmetryAtomMeshesRef.current.push(currentMesh);
            }
          }
        }
      }
    }

    // Draw all motion indicators (rotation/inversion path visualization)
    const drawMotionIndicators = true;
    if (drawMotionIndicators) {
      motionIndicators.forEach(indicator => {
      if (indicator.type === 'rotation') {
        try {
          // Determine cylinder axis for this operation
          let opCylinderAxis = 'c';
          if (indicator.axis === 'y') opCylinderAxis = 'b';
          if (indicator.axis === 'x') opCylinderAxis = 'a';

          // Curved arrow for rotation
          const angleRad = (indicator.angle * Math.PI) / 180;
          const radius = cylinderRadius * 0.8;

          // Calculate phi from the 'from' point
          const [fx, fy, fz] = indicator.from;
          let phi;
          if (opCylinderAxis === 'a') {
            phi = Math.atan2(fz, fy);
          } else if (opCylinderAxis === 'b') {
            phi = Math.atan2(fz, fx);
          } else {
            phi = Math.atan2(fy, fx);
          }

          // Determine rim height from the 'from' point
          let rimHeight;
          if (opCylinderAxis === 'a') {
            rimHeight = isNonNegativeSide(fx) ? cylinderHalfHeight : -cylinderHalfHeight;
          } else if (opCylinderAxis === 'b') {
            rimHeight = isNonNegativeSide(fy) ? cylinderHalfHeight : -cylinderHalfHeight;
          } else {
            rimHeight = isNonNegativeSide(fz) ? cylinderHalfHeight : -cylinderHalfHeight;
          }

          // Create curved path points
          const curvePoints = [];
          const numPoints = 20;
          for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const currentAngle = t * angleRad;

            let curveX, curveY, curveZ;
            if (opCylinderAxis === 'a') {
              curveX = rimHeight;
              curveY = radius * Math.cos(currentAngle + phi);
              curveZ = radius * Math.sin(currentAngle + phi);
            } else if (opCylinderAxis === 'b') {
              curveX = radius * Math.cos(currentAngle + phi);
              curveY = rimHeight;
              curveZ = radius * Math.sin(currentAngle + phi);
            } else {
              curveX = radius * Math.cos(currentAngle + phi);
              curveY = radius * Math.sin(currentAngle + phi);
              curveZ = rimHeight;
            }

            curvePoints.push(new THREE.Vector3(curveX, curveY, curveZ));
          }

          const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
          const curveMat = new THREE.LineBasicMaterial({
            color: 0x378ADD,
            opacity: 0.9,
            transparent: true
          });
          const rotationCurve = new THREE.Line(curveGeom, curveMat);
          sg.add(rotationCurve);
          symmetryAtomMeshesRef.current.push(rotationCurve);

        } catch (error) {
          console.error('updateSymmetryScene: error creating rotation motion indicator', error);
        }
      } else if (indicator.type === 'inversion') {
        try {
          // Dashed lines through origin for inversion
          // Map the start point to the cylinder surface, then place the end
          // point at its exact geometric negation (rather than independently
          // re-projecting indicator.to) so the origin is always precisely the
          // midpoint of the two — guaranteed even when a coordinate is
          // exactly 0, where independently re-deriving "above/below" for the
          // inverted point could tie-break to the same side as the original
          // (since -0 >= 0 is true in JS) and produce a bent, off-center line.
          const startPoint = mapPointToCylinder(indicator.from);
          const originPoint = new THREE.Vector3(0, 0, 0);
          const endPoint = startPoint.clone().negate();

          // Draw line from base to origin
          const totalLength1 = startPoint.distanceTo(originPoint);
          const dashSize = Math.min(CS * 0.1, totalLength1 / 2);
          const gapSize = Math.min(CS * 0.05, totalLength1 / 4);
          const numDashes1 = Math.max(1, Math.floor(totalLength1 / (dashSize + gapSize)));

          for (let i = 0; i < numDashes1; i++) {
            const t1 = i / numDashes1;
            const t2 = (i + 0.5) / numDashes1;

            const dashStart = startPoint.clone().lerp(originPoint, t1);
            const dashEnd = startPoint.clone().lerp(originPoint, t2);

            const dashGeom = new THREE.BufferGeometry().setFromPoints([dashStart, dashEnd]);
            const dashMat = new THREE.LineBasicMaterial({
              color: 0x378ADD,
              opacity: 0.8,
              transparent: true
            });
            const dash = new THREE.Line(dashGeom, dashMat);
            sg.add(dash);
            symmetryAtomMeshesRef.current.push(dash);
          }

          // Draw line from origin to inverted point
          const totalLength2 = originPoint.distanceTo(endPoint);
          const dashSize2 = Math.min(CS * 0.1, totalLength2 / 2);
          const gapSize2 = Math.min(CS * 0.05, totalLength2 / 4);
          const numDashes2 = Math.max(1, Math.floor(totalLength2 / (dashSize2 + gapSize2)));

          for (let i = 0; i < numDashes2; i++) {
            const t1 = i / numDashes2;
            const t2 = (i + 0.5) / numDashes2;

            const dashStart = originPoint.clone().lerp(endPoint, t1);
            const dashEnd = originPoint.clone().lerp(endPoint, t2);

            const dashGeom = new THREE.BufferGeometry().setFromPoints([dashStart, dashEnd]);
            const dashMat = new THREE.LineBasicMaterial({
              color: 0x378ADD,
              opacity: 0.8,
              transparent: true
            });
            const dash = new THREE.Line(dashGeom, dashMat);
            sg.add(dash);
            symmetryAtomMeshesRef.current.push(dash);
          }
        } catch (error) {
          console.error('updateSymmetryScene: error creating inversion motion indicator', error);
        }
      }
    });
    }             // line 1161 - closes if (drawMotionIndicators)
    }             // line 1162


  // ── Structure building ─────────────────────────────────────────────────────
  function buildStructure(key, cSize, sMode, bMode) {
    const s = STRUCTS[key];
    const sg = sceneGroupRef.current;
    if (!sg) return;

    setDefaultOrbit(1.05, 0.55, cSize===1 ? 14 : cSize===2 ? 26 : 38);
    applyOrbit();

    const effectiveMode = sMode;
    const atomList = s.atoms;
    const sfRadii = effectiveMode === 'cpk' ? computeSFRadii(atomList, s, key) : null;

    const N = cSize;
    const reps = Array.from({length: N}, (_,i) => i);
    const offset = (N-1) / 2;

    reps.forEach(ix => reps.forEach(iy => reps.forEach(iz => {
      let ox, oy, oz;
      if (s.lv) {
        const [a1,a2,a3] = s.lv;
        ox = (ix-offset)*a1[0]+(iy-offset)*a2[0]+(iz-offset)*a3[0];
        oy = (ix-offset)*a1[1]+(iy-offset)*a2[1]+(iz-offset)*a3[1];
        oz = (ix-offset)*a1[2]+(iy-offset)*a2[2]+(iz-offset)*a3[2];
      } else {
        const ax=s.ax||1, ay=s.ay||1, az=s.az||1;
        ox=(ix-offset)*CS*ax; oy=(iy-offset)*CS*ay; oz=(iz-offset)*CS*az;
      }

      makeLatticeWireframe(s, ox, oy, oz, sg);

      const meshes = atomList.map((a, ai) => {
        const radius = sfRadii ? sfRadii[ai] * SF : 0.13 * CS;
        const col = a.c || s.color || 0x4fc3f7;
        const mat = new THREE.MeshPhongMaterial({
          color: col, shininess:100, specular:0x333355,
          emissive: new THREE.Color(col).multiplyScalar(0.05)
        });
        const mesh = tag(new THREE.Mesh(new THREE.SphereGeometry(radius,32,24), mat));
        mesh.position.copy(worldPos(a.f, ox, oy, oz, s));
        sg.add(mesh);
        return mesh;
      });

      if (bMode && effectiveMode === 'bs' && CUBIC_STRUCT_KEYS.includes(key)) drawBonds(s, meshes, atomList, sg);
    })));

    // Axis arrows
    let lv1, lv2, lv3;
    if (s.lv) {
      lv1 = new THREE.Vector3(...s.lv[0]);
      lv2 = new THREE.Vector3(...s.lv[1]);
      lv3 = new THREE.Vector3(...s.lv[2]);
    } else {
      const ax2=s.ax||1, ay2=s.ay||1, az2=s.az||1;
      lv1=new THREE.Vector3(CS*ax2,0,0);
      lv2=new THREE.Vector3(0,CS*ay2,0);
      lv3=new THREE.Vector3(0,0,CS*az2);
    }

    const originCorner = new THREE.Vector3(0,0,0)
      .sub(lv1.clone().multiplyScalar(0.5))
      .sub(lv2.clone().multiplyScalar(0.5))
      .sub(lv3.clone().multiplyScalar(0.5));
    const scOriginCorner = originCorner.clone()
      .add(lv1.clone().multiplyScalar(-(N-1)/2))
      .add(lv2.clone().multiplyScalar(-(N-1)/2))
      .add(lv3.clone().multiplyScalar(-(N-1)/2));
    const axScale = Math.max(1.0, N * 0.6);

    [
      { vec: lv1, col: 0xff3333 },
      { vec: lv2, col: 0x33dd33 },
      { vec: lv3, col: 0x3399ff },
    ].forEach(({ vec, col }) => {
      const dir = vec.clone().normalize();
      const len = vec.length() * axScale;
      sg.add(tag(new THREE.ArrowHelper(dir, scOriginCorner, len, col,
        Math.min(len*0.18, CS*0.22), Math.min(len*0.08, CS*0.10))));
    });

    const labelPadding = 0.15 * CS;
    axisLabelPts.current = {
      X: scOriginCorner.clone().add(lv1.clone().normalize().multiplyScalar(lv1.length()*axScale + labelPadding)),
      Y: scOriginCorner.clone().add(lv2.clone().normalize().multiplyScalar(lv2.length()*axScale + labelPadding)),
      Z: scOriginCorner.clone().add(lv3.clone().normalize().multiplyScalar(lv3.length()*axScale + labelPadding)),
    };

    alignGroupToY(lv3);
  }

  function drawSymmetryOrbit(orbit) {
    const sg = symmetryGuideGroupRef.current;
    if (!sg || !orbit || orbit.length === 0) return;
    const ORBIT_RADIUS = 0.12 * CS;
    // display-overridden for 2//Oy / 2̄//Oy — see getDisplayCylinderAxis
    const axis = getDisplayCylinderAxis(selectedOperation, selectedAxis);
    const noMidOrbit = filterTopBottomOrbit(orbit, axis);
    orbit = noMidOrbit;
    // Cylinder-aligned orbit coordinates derived from stereographic projection
    const radius = CS * 1.3;
    const halfHeight = CS * 1.5;

    orbit.forEach((pt, idx) => {
      const proj = projectPointForAxis(pt, axis);
      if (!proj) return;
      const worldPoint = mapProjectedToCylinderRim(proj, axis, radius, halfHeight);
      const sphere = tag(new THREE.Mesh(
        new THREE.SphereGeometry(ORBIT_RADIUS, 20, 12),
        new THREE.MeshPhongMaterial({
          color: 0xffa500,
          emissive: 0x442200,
          shininess: 60
        })
      ));
      sphere.position.copy(worldPoint);
      sg.add(sphere);
      if (idx > 0) {
        const prevProj = projectPointForAxis(orbit[idx-1], axis);
        if (prevProj) {
          const prevWorld = mapProjectedToCylinderRim(prevProj, axis, radius, halfHeight);
          const line = tag(new THREE.Line(new THREE.BufferGeometry().setFromPoints([prevWorld, worldPoint]),
            new THREE.LineBasicMaterial({ color: 0xffff66, opacity: 0.8, transparent: true })));
          sg.add(line);
        }
      }
    });
  }

  function makeLatticeWireframe(s, ox, oy, oz, sg) {
    if (s.lv) {
      const [a1,a2,a3] = s.lv;
      const pivX=0.5*(a1[0]+a2[0]+a3[0]);
      const pivY=0.5*(a1[1]+a2[1]+a3[1]);
      const pivZ=0.5*(a1[2]+a2[2]+a3[2]);
      function corner(f1,f2,f3) {
        return new THREE.Vector3(
          f1*a1[0]+f2*a2[0]+f3*a3[0]-pivX+ox,
          f1*a1[1]+f2*a2[1]+f3*a3[1]-pivY+oy,
          f1*a1[2]+f2*a2[2]+f3*a3[2]-pivZ+oz
        );
      }
      const c000=corner(0,0,0),c100=corner(1,0,0),c010=corner(0,1,0),c001=corner(0,0,1);
      const c110=corner(1,1,0),c101=corner(1,0,1),c011=corner(0,1,1),c111=corner(1,1,1);
      const edges=[[c000,c100],[c000,c010],[c000,c001],[c110,c100],[c110,c010],[c110,c111],
                   [c101,c100],[c101,c001],[c101,c111],[c011,c010],[c011,c001],[c011,c111]];
      const mat=new THREE.LineBasicMaterial({color:0x2a3580,opacity:0.85,transparent:true});
      edges.forEach(([p1,p2])=>sg.add(tag(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1,p2]),mat))));
    } else {
      const ax=s.ax||1, ay=s.ay||1, az=s.az||1;
      const wf=tag(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(CS*ax,CS*ay,CS*az)),
        new THREE.LineBasicMaterial({color:0x2a3580,opacity:0.85,transparent:true})
      ));
      wf.position.set(ox,oy,oz);
      sg.add(wf);
    }
  }

  function computeSFRadii(atomList, s, structKey) {
    if (structKey && SF_RADII[structKey] && SF_RADII[structKey].length === atomList.length) {
      return SF_RADII[structKey];
    }
    const positions = atomList.map(a => worldPos(a.f, 0, 0, 0, s));
    const lvs = s.lv || [[CS*(s.ax||1),0,0],[0,CS*(s.ay||1),0],[0,0,CS*(s.az||1)]];
    return positions.map((pi, i) => {
      let minD = Infinity;
      for (let j=0; j<positions.length; j++)
        for (let nx=-1; nx<=1; nx++) for (let ny=-1; ny<=1; ny++) for (let nz=-1; nz<=1; nz++) {
          if (nx===0&&ny===0&&nz===0&&i===j) continue;
          const tx=nx*lvs[0][0]+ny*lvs[1][0]+nz*lvs[2][0];
          const ty=nx*lvs[0][1]+ny*lvs[1][1]+nz*lvs[2][1];
          const tz=nx*lvs[0][2]+ny*lvs[1][2]+nz*lvs[2][2];
          const d=Math.sqrt((pi.x-positions[j].x-tx)**2+(pi.y-positions[j].y-ty)**2+(pi.z-positions[j].z-tz)**2);
          if (d>0.01&&d<minD) minD=d;
        }
      return isFinite(minD) ? minD/2 : SF_METAL;
    });
  }

  // ── Bonds ──────────────────────────────────────────────────────────────────
  function makeBondCyl(pA, pB, targetSg) {
    const sg = targetSg || sceneGroupRef.current;
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const len = dir.length();
    if (len < 0.01) return;
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, len, 8, 1),
      new THREE.MeshPhongMaterial({color:0x7788cc, transparent:true, opacity:0.6, shininess:40})
    );
    if (!targetSg) tag(cyl);
    cyl.position.copy(mid);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
    sg.add(cyl);
  }

  // Each rule below bonds only the real nearest-neighbor pairs for that
  // structure (verified against standard crystallography references — see
  // each structure's own `param`/cn fields for the same distance formulas):
  //  - ionic structures bond cation↔anion only, never same-charge pairs
  //  - sc/bcc/fcc/hcp use the exact known nearest-neighbor distance so the
  //    longer same-species diagonal (e.g. bcc/fcc corner-to-corner) is
  //    correctly excluded
  //  - diamond bonds each interior tetrahedral atom to its nearest 4
  function drawBonds(s, meshes, atoms, sg) {
    const rule = s.bondRule;
    if (rule === 'ionic') {
      // Bond only cation↔anion pairs (never same-charge), at the true
      // shortest cation-anion distance found in the cell — computed
      // dynamically rather than guessed as a fraction of the cell edge,
      // since that fraction varies by structure (a/2 for NaCl, a√3/4 for
      // ZnS/CaF₂, a√3/2 for CsCl) and a single fixed multiplier can't fit all of them.
      let minDist = Infinity;
      const candidates = [];
      for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
        const lbI=atoms[i].lb||'', lbJ=atoms[j].lb||'';
        const isCat=lbI.includes('⁺'), isAn=lbI.includes('⁻')||lbI.includes('²⁻');
        const jCat=lbJ.includes('⁺'), jAn=lbJ.includes('⁻')||lbJ.includes('²⁻');
        if (!((isCat&&jAn)||(isAn&&jCat))) continue;
        const d = meshes[i].position.distanceTo(meshes[j].position);
        if (d>0.01) { candidates.push({i,j,d}); if (d<minDist) minDist=d; }
      }
      if (!isFinite(minDist)) return;
      const tol = minDist*0.06;
      candidates.forEach(({i,j,d}) => {
        if (Math.abs(d-minDist)<tol) makeBondCyl(meshes[i].position, meshes[j].position, sg);
      });
      return;
    }
    if (rule === 'diamond') {
      const tetIdx = atoms.reduce((acc,a,i) => { if(a.f[0]===0.25||a.f[0]===0.75) acc.push(i); return acc; }, []);
      tetIdx.forEach(ti => {
        const dists = meshes.map((m,i) => ({i,d:meshes[ti].position.distanceTo(m.position)}))
          .filter(x=>x.i!==ti&&x.d>0.01).sort((a,b)=>a.d-b.d);
        dists.slice(0,4).forEach(x => makeBondCyl(meshes[ti].position, meshes[x.i].position, sg));
      });
      return;
    }
    if (rule === 'sc') {
      // Simple Cubic: bond edge-connected corners only (distance = CS, no diagonals)
      for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
        const d = meshes[i].position.distanceTo(meshes[j].position);
        if (Math.abs(d - CS) < 0.1) makeBondCyl(meshes[i].position, meshes[j].position, sg);
      }
      return;
    }
    if (rule === 'bcc') {
      const bodyDiag = CS*Math.sqrt(3)/2, tol = bodyDiag*0.06;
      for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
        if (Math.abs(meshes[i].position.distanceTo(meshes[j].position)-bodyDiag)<tol)
          makeBondCyl(meshes[i].position, meshes[j].position, sg);
      }
      return;
    }
    if (rule === 'fcc') {
      const faceDiag = CS/Math.sqrt(2), tol = faceDiag*0.06;
      for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
        if (Math.abs(meshes[i].position.distanceTo(meshes[j].position)-faceDiag)<tol)
          makeBondCyl(meshes[i].position, meshes[j].position, sg);
      }
      return;
    }
    if (rule === 'hcp') {
      // Ideal hcp: all 12 nearest neighbors of any atom sit at exactly the
      // in-plane lattice constant |a1| (unlike bcc/fcc there's no separate
      // shorter diagonal to disambiguate).
      const aLen = Math.sqrt(s.lv[0][0]**2 + s.lv[0][1]**2 + s.lv[0][2]**2);
      const tol = aLen * 0.06;
      for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
        if (Math.abs(meshes[i].position.distanceTo(meshes[j].position)-aLen)<tol)
          makeBondCyl(meshes[i].position, meshes[j].position, sg);
      }
      return;
    }
    // Generic single-species metal placeholder (Bravais lattices without a
    // specific named structure): bond every pair within a small tolerance of
    // the shortest pairwise distance actually present in this cell.
    let minDist = Infinity;
    for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
      const d=meshes[i].position.distanceTo(meshes[j].position);
      if (d>0.01&&d<minDist) minDist=d;
    }
    if (!isFinite(minDist)) return;
    const tol2 = minDist*1.16;
    const bondCount = new Array(meshes.length).fill(0);
    let nearest = meshes.map(() => ({ j: -1, d: Infinity }));
    for (let i=0; i<meshes.length; i++) for (let j=i+1; j<meshes.length; j++) {
      const d=meshes[i].position.distanceTo(meshes[j].position);
      if (d<=0.01) continue;
      if (d<=tol2) { makeBondCyl(meshes[i].position, meshes[j].position, sg); bondCount[i]++; bondCount[j]++; }
      if (d<nearest[i].d) nearest[i] = { j, d };
      if (d<nearest[j].d) nearest[j] = { j: i, d };
    }
    // A handful of these placeholder lattices (e.g. a body-centered cell whose
    // axes are stretched enough that the centering atom's true nearest
    // neighbor is a periodic image outside this single drawn cell) can leave
    // an atom with no bond at all within the tolerance above. Rather than
    // show a visually "orphaned" atom, connect it to its single closest
    // neighbor in the cell regardless of tolerance.
    for (let i=0; i<meshes.length; i++) {
      if (bondCount[i] === 0 && nearest[i].j !== -1) {
        makeBondCyl(meshes[i].position, meshes[nearest[i].j].position, sg);
      }
    }
  }

  // ── Struct info card ───────────────────────────────────────────────────────
  function buildStructInfo(key) {
    const s = STRUCTS[key];
    const isFr = lang === 'fr';
    const paramText = isFr && PARAM_TRANSLATIONS_FR[s.param] ? PARAM_TRANSLATIONS_FR[s.param] : s.param;
    const rRatioText = isFr && RRATIO_TRANSLATIONS_FR[key] ? RRATIO_TRANSLATIONS_FR[key] : s.rRatio;
    const examplesText = isFr && EXAMPLES_TRANSLATIONS_FR[key] ? EXAMPLES_TRANSLATIONS_FR[key] : s.examples;
    const rows = [
      [t('rowZ'),       String(s.z)],
      [t('rowCN'),      s.cn],
      [t('rowAPF'),     s.apf],
      [t('rowParam'),   paramText],
      s.rRatio ? [t('rowRatio'), rRatioText] : null,
      [t('rowSystem'),  t(s.system) !== s.system ? t(s.system) : s.system],
      [t('rowExamples'),examplesText],
    ].filter(Boolean);

    const seen = new Map();
    s.atoms.forEach(a => {
      const lb = a.lb || s.label;
      if (!seen.has(lb)) seen.set(lb, a.c || s.color || 0x4fc3f7);
    });

    return { s, rows, legend: [...seen.entries()] };
  }

  // ── updateStruct (reactive) ────────────────────────────────────────────────
  useEffect(() => {
    if (currentTab !== 'struct') return;
    if (sceneGroupRef.current) sceneGroupRef.current.visible = true;
    if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = false;
    clearGroup(sceneGroupRef.current);
    orbitTargetRef.current.set(0,0,0);
    buildStructure(structKey, cellSize, renderMode, showBonds);
    setStructInfo(buildStructInfo(structKey));
    applyOrbit();
    // Force camera projection update
    const cam = cameraRef.current;
    if (cam) {
      cam.updateProjectionMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, tabSwitchKey, structKey, cellSize, showBonds, renderMode, lang]);

  // ── Miller scene ───────────────────────────────────────────────────────────
  function buildMillerScene(N, origin) {
    const sg = sceneGroupRef.current;
    const unit = CS;

    function nodePos(x,y,z) {
      return new THREE.Vector3((x-origin[0])*unit,(y-origin[1])*unit,(z-origin[2])*unit);
    }
    for (let x=0; x<=N; x++) for (let y=0; y<=N; y++) for (let z=0; z<=N; z++) {
      const isOrigin = (x===origin[0]&&y===origin[1]&&z===origin[2]);
      const m = tag(new THREE.Mesh(
        new THREE.SphereGeometry(isOrigin?0.26:0.14,16,12),
        new THREE.MeshPhongMaterial({
          color:isOrigin?0x00d4ff:0x4fc3f7,
          emissive:new THREE.Color(isOrigin?0x00d4ff:0x4fc3f7).multiplyScalar(isOrigin?0.5:0.08),
          shininess:100
        })
      ));
      m.position.copy(nodePos(x,y,z));
      sg.add(m);
    }

    const wireMat=new THREE.LineBasicMaterial({color:0x223366,opacity:0.6,transparent:true});
    for (let ix=0;ix<N;ix++) for (let iy=0;iy<N;iy++) for (let iz=0;iz<N;iz++) {
      const wire=tag(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(unit,unit,unit)),wireMat
      ));
      wire.position.set((ix-origin[0]+0.5)*unit,(iy-origin[1]+0.5)*unit,(iz-origin[2]+0.5)*unit);
      sg.add(wire);
    }

    const axLen=N*unit*1.3;
    [
      {dir:new THREE.Vector3(1,0,0),col:0xff3333,lbl:'a'},
      {dir:new THREE.Vector3(0,1,0),col:0x33dd33,lbl:'b'},
      {dir:new THREE.Vector3(0,0,1),col:0x3399ff,lbl:'c'},
    ].forEach(({dir,col})=>{
      sg.add(tag(new THREE.ArrowHelper(dir,nodePos(0,0,0),axLen,col,0.3,0.12)));
    });

    // Axis label screen positions for Miller index case
    const originPt = nodePos(0,0,0);
    const axisExtra = 0.18 * CS;
    axisLabelPts.current = {
      X: originPt.clone().add(new THREE.Vector3(axLen + axisExtra, 0, 0)),
      Y: originPt.clone().add(new THREE.Vector3(0, axLen + axisExtra, 0)),
      Z: originPt.clone().add(new THREE.Vector3(0, 0, axLen + axisExtra)),
    };
  }

  function drawDirection(u, v, w, N, origin) {
    const sg = sceneGroupRef.current;
    if (u===0&&v===0&&w===0) return;
    const unit=CS;
    // The selected origin corner is always rendered at world (0,0,0) — see
    // nodePos() in buildMillerScene, which shifts the whole grid so that node
    // `origin` lands at the world origin. The direction arrow must start there
    // too, not at nodePos(0,0,0) (which is the *absolute* (0,0,0) lattice
    // corner and drifts away from the highlighted origin marker whenever a
    // non-default origin corner is selected).
    const start=new THREE.Vector3(0,0,0);
    const end=new THREE.Vector3(u*unit,v*unit,w*unit);
    const dir=end.clone().sub(start).normalize();
    const len=end.clone().sub(start).length();
    sg.add(tag(new THREE.ArrowHelper(dir,start,len,0xffdd00,0.35,0.14)));

    const dStar=(1/Math.sqrt(u*u+v*v+w*w)).toFixed(3);
    const match=DIR_PRESETS.find(p=>p.uvw[0]===u&&p.uvw[1]===v&&p.uvw[2]===w);
    setMillerInfo({ type:'dir', title:`[${fmt(u)} ${fmt(v)} ${fmt(w)}]`,
      family:`<${Math.abs(u)} ${Math.abs(v)} ${Math.abs(w)}>`,
      dStar, note: match ? match.note : '' });
  }

  function drawPlane(h, k, l, N, origin) {
    const sg = sceneGroupRef.current;
    if (h===0&&k===0&&l===0) return;
    const unit=CS;
    const norm=new THREE.Vector3(h,k,l).normalize();
    const mag=Math.sqrt(h*h+k*k+l*l);
    const d_world=unit/mag;
    const d_frac=(1/mag).toFixed(4);
    const ox=origin[0],oy=origin[1],oz=origin[2];

    const corners=[];
    for (let cx=0;cx<=N;cx+=N) for (let cy=0;cy<=N;cy+=N) for (let cz=0;cz<=N;cz+=N)
      corners.push(new THREE.Vector3((cx-ox)*unit,(cy-oy)*unit,(cz-oz)*unit));
    const projections=corners.map(c=>c.dot(norm));
    const pMin=Math.min(...projections), pMax=Math.max(...projections);
    const nMin=Math.floor(pMin/d_world)-1, nMax=Math.ceil(pMax/d_world)+1;
    const colors=[0x3355ff,0x33aa33,0xff4433,0xcc44ff,0x00cccc,0xff9900];
    const planeSize=N*unit*2.0;
    const planeGeo=new THREE.PlaneGeometry(planeSize,planeSize);

    let planeCount=0;
    for (let n=nMin;n<=nMax;n++) {
      const dist=n*d_world;
      if (dist<pMin-d_world*0.5||dist>pMax+d_world*0.5) continue;
      const col=colors[((n%colors.length)+colors.length)%colors.length];
      const opacity=Math.max(0.12,0.45-planeCount*0.06);
      const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity,side:THREE.DoubleSide});
      const plane=tag(new THREE.Mesh(planeGeo,mat));
      plane.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),norm);
      plane.position.copy(norm).multiplyScalar(dist);
      sg.add(plane);
      const outline=tag(new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo),
        new THREE.LineBasicMaterial({color:col,opacity:0.8,transparent:true})));
      outline.quaternion.copy(plane.quaternion);
      outline.position.copy(plane.position);
      sg.add(outline);
      planeCount++;
    }

    sg.add(tag(new THREE.ArrowHelper(norm,new THREE.Vector3(0,0,0),N*unit*0.65,0xffdd00,0.35,0.14)));

    const iMat=new THREE.MeshPhongMaterial({color:0xffffff,emissive:0x888800,shininess:120});
    function makeIntercept(x,y,z) {
      const oct=tag(new THREE.Mesh(new THREE.OctahedronGeometry(0.22,0),iMat.clone()));
      oct.position.set(x,y,z); sg.add(oct);
    }
    if (h!==0) makeIntercept(unit/h,0,0);
    if (k!==0) makeIntercept(0,unit/k,0);
    if (l!==0) makeIntercept(0,0,unit/l);

    const interceptStr=[
      h!==0?`a/${h}`:'∞',k!==0?`b/${k}`:'∞',l!==0?`c/${l}`:'∞'
    ].join(', ');
    const match=PLANE_PRESETS.find(p=>p.hkl[0]===h&&p.hkl[1]===k&&p.hkl[2]===l);
    setMillerInfo({ type:'plane', title:`(${fmt(h)} ${fmt(k)} ${fmt(l)})`,
      family:`{${Math.abs(h)} ${Math.abs(k)} ${Math.abs(l)}}`,
      dFrac:d_frac, intercepts:interceptStr, planeCount, note: match ? match.note : '' });
  }

  // ── updateMiller (reactive) ────────────────────────────────────────────────
  useEffect(() => {
    if (currentTab !== 'miller') return;
    if (sceneGroupRef.current) sceneGroupRef.current.visible = true;
    if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = false;
    clearGroup(sceneGroupRef.current);
    buildMillerScene(cellSize, millerOrigin);
    const unit=CS, N=cellSize;
    orbitTargetRef.current.set(
      (N/2-millerOrigin[0])*unit,
      (N/2-millerOrigin[1])*unit,
      (N/2-millerOrigin[2])*unit
    );
    applyOrbit();
    if (millerSub==='dir') drawDirection(millerU, millerV, millerW, cellSize, millerOrigin);
    else drawPlane(millerH, millerK, millerL, cellSize, millerOrigin);
    // Force camera projection update
    const cam = cameraRef.current;
    if (cam) {
      cam.updateProjectionMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, tabSwitchKey, millerSub, cellSize, millerOrigin, millerU, millerV, millerW, millerH, millerK, millerL]);

  useEffect(() => {
    if (currentTab !== 'symmetry') return;
    console.log('🔁 symmetry tab effect', { selectedOperation, symmetryPoint, structKey });
    clearGroup(symmetryGuideGroupRef.current);
    orbitTargetRef.current.set(0,0,0);
    if (sceneGroupRef.current) sceneGroupRef.current.visible = false;
    if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = true;
    // Symmetry guide group (cylinder + markers)
    buildSymmetryGuide(symmetryGuideGroupRef.current, selectedOperation, symmetryPoint, structKey, selectedAxis);
    // Show atoms for the currently selected operation. Only in Direct mode:
    // Step-by-Step has its own dedicated renderer (updateSymmetryScene,
    // below) that tracks the live point and saved positions individually,
    // and drawing this too would add a redundant same-position gold sphere
    // that z-fights with the saved (green) marker.
    if (!stepMode) {
      const operation = getEffectiveOperation(selectedOperation, selectedAxis);
      const base = currentBasePoint || symmetryPoint;
      if (operation) {
        const orbitPoints = generateOrbitPoints(base, operation, selectedOperation);
        drawSymmetryOrbit(orbitPoints);
      }
    }
    // Always show a fixed orthogonal frame — x down, y right, z up on
    // screen — the same x/y/z convention already used in the 2D
    // Stereographic Projection legend, independent of the selected
    // operation's axis or the real structure's true lattice shape.
    alignGroupToY(new THREE.Vector3(0, 0, 1), symmetryGuideGroupRef.current);
    symmetryGuideGroupRef.current.rotateZ(-52 * Math.PI / 180);
    applyOrbit();
    // Place the orbit/atom markers BEFORE centering: centering on the guide
    // (axes + caps only, before atoms are added) leaves the camera aimed at a
    // point that doesn't match the final scene once atoms are placed, which is
    // most visible after editing the Starting Point (that state change doesn't
    // trigger any other effect that re-centers afterward).
    updateSymmetryScene(selectedOperation, currentBasePoint);
    centerOrbitOnScene(symmetryGuideGroupRef.current);
    // Force camera projection update
    const cam = cameraRef.current;
    if (cam) {
      cam.updateProjectionMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, tabSwitchKey, structKey, selectedOperation, selectedAxis, symmetryPoint, stepMode]);

  // ── Update 3D scene with saved/preview atoms for Application Mode ─────────
  useEffect(() => {
    if (currentTab !== 'symmetry') return;
    updateSymmetryScene(selectedOperation, symmetryPoint);
    // Prefer the current selected base point for the active atom display if set
    // to keep the previous atom visible when applying rotation/inversion.
    // The helper uses currentBasePoint inside updateSymmetryScene.
    centerOrbitOnScene(symmetryGuideGroupRef.current);
    updateAxisLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, tabSwitchKey, savedAtoms, previewAtom, selectedOperation, currentBasePoint]);

  // ── Tab switching ──────────────────────────────────────────────────────────
  function handleSwitchTab(tab) {
    // Ensure the gallery rendering loop is stopped when leaving gallery
    if (currentTab === 'gallery' && tab !== 'gallery') disposeGallery();
    if (tab === 'gallery') disposeGallery();
    // Keep group clearing scoped to the target tab effect for graceful transition
    if (tab === 'struct' || tab === 'miller') {
      clearGroup(sceneGroupRef.current);
    } else if (tab === 'symmetry') {
      clearGroup(symmetryGuideGroupRef.current);
    } else {
      clearScene();
    }
    setMobileDrawerOpen(false);
    
    // Clear symmetry state when leaving symmetry tab
    if (currentTab === 'symmetry' && tab !== 'symmetry') {
      symmetryAnimTokenRef.current++; // cancel any in-flight rotation/inversion animation
      setSavedAtoms([]);
      setPreviewAtom(null);
      setOperationsLog([]);
      setSelectedOperation('1');
      setSymmetryPoint([...DEFAULT_SYMMETRY_POINT]);
      setCurrentBasePoint([...DEFAULT_SYMMETRY_POINT]);
    }
    
    // Reset controls to defaults when switching tabs - BEFORE changing tab
    if (tab === 'struct') {
      setCellSizeState(1);
      setShowBonds(true);
      setRenderMode('bs');
      orbitTargetRef.current.set(0,0,0);
      setDefaultOrbit(1.05, 0.55, 14);
      applyOrbit();
      if (sceneGroupRef.current) sceneGroupRef.current.visible = true;
      if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = false;
    } else if (tab === 'miller') {
      setMillerSub('dir');
      setMillerCells(1);
      setMillerOrigin([0,0,0]);
      setMillerU(1);
      setMillerV(0);
      setMillerW(0);
      setMillerH(1);
      setMillerK(0);
      setMillerL(0);
      setDefaultOrbit(1.0, 0.7, 16);
      applyOrbit();
      if (sceneGroupRef.current) sceneGroupRef.current.visible = true;
      if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = false;
    } else if (tab === 'gallery') {
      setGalleryCellSize(1);
      if (sceneGroupRef.current) sceneGroupRef.current.visible = false;
      if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = false;
    } else if (tab === 'symmetry') {
      setSymmetryPoint([...DEFAULT_SYMMETRY_POINT]);
      setCurrentBasePoint([...DEFAULT_SYMMETRY_POINT]);
      setSavedAtoms([]);
      setPreviewAtom(null);
      setSelectedOperation('1');
      setOperationsLog([]);
      setStepMode(false);
      setCurrentStep(1);
      setShowConfirmBar(false);
      setMotionIndicators([]);
      if (sceneGroupRef.current) sceneGroupRef.current.visible = false;
      if (symmetryGuideGroupRef.current) symmetryGuideGroupRef.current.visible = true;
    }
    
    // Change tab and increment switch key to force effect re-run
    setCurrentTab(tab);
    setTabSwitchKey(k => k + 1);
  }

  function handleSymmetryReset() {
    symmetryAnimTokenRef.current++; // cancel any in-flight rotation/inversion animation
    setSymmetryPoint([...DEFAULT_SYMMETRY_POINT]);
    setCurrentBasePoint([...DEFAULT_SYMMETRY_POINT]);
    setSavedAtoms([]);
    setPreviewAtom(null);
    setSelectedOperation('1');
    setOperationsLog([]);
    setStepMode(false);
    setCurrentStep(1);
    setShowConfirmBar(false);
    setMotionIndicators([]);
  }

  function handleSymmetryUndo() {
    if (operationsLog.length > 0) {
      setOperationsLog(prev => prev.slice(0, -1));
    }
  }

  function handleSymmetryBack() {
    if (savedAtoms.length > 0) {
      const newSavedAtoms = savedAtoms.slice(0, -1);
      setSavedAtoms(newSavedAtoms);
      const newBasePoint = newSavedAtoms.length > 0
        ? newSavedAtoms[newSavedAtoms.length - 1]
        : symmetryPoint;
      setCurrentBasePoint(newBasePoint);
      setPreviewAtom(null);
      setShowConfirmBar(false);
      // Once every saved checkpoint has been undone, also clear the arc
      // trail so returning to the true starting point shows a clean single
      // ball rather than leftover motion arcs from steps that no longer
      // have a saved position to anchor to.
      if (newSavedAtoms.length === 0) setMotionIndicators([]);
    }
  }

  function handleOperationSelect(operation) {
    // The `stepFreshEntry`/`stepMode` exceptions let an explicit click on
    // the already-selected operation still count as a real pick — either to
    // clear the suppressed "1" highlight, or (while in Step-by-Step) to
    // drop back to the default view even though the operation itself
    // didn't change.
    if (operation === selectedOperation && !stepFreshEntry && !stepMode) return;

    // Reset all application mode state when operation changes
    symmetryAnimTokenRef.current++; // cancel any in-flight rotation/inversion animation
    setSelectedOperation(operation);
    setSelectedAxis(SYMMETRY_OPERATIONS[operation]?.axis || 'c');
    setAxisAutoSynced(true); // axis changed as a side effect — don't highlight it in the axis picker
    setCurrentBasePoint(symmetryPoint);
    setSavedAtoms([]);
    setPreviewAtom(null);
    setOperationsLog([]);
    setCurrentStep(1);
    setShowConfirmBar(false);
    setMotionIndicators([]); // clear any leftover rotation/inversion arc from a previous operation
    setStepFreshEntry(false);
    setStepMode(false); // picking a Select Operation button always drops back to the default (non step-by-step) view

    // Update the 3D scene with the new operation
    updateSymmetryScene(operation, symmetryPoint);
  }

  // Dedicated handler for the Step-by-Step toggle button. This deliberately
  // does NOT go through handleOperationSelect: that function's "no-op if
  // operation unchanged" guard reads `stepMode`/`stepFreshEntry` from this
  // render's closure, which is still the pre-toggle value at the moment
  // it'd be called from here (setStepMode's effect isn't visible yet in the
  // same synchronous handler) — so routing through it silently skipped the
  // scene reset whenever selectedOperation was already '1'. A standalone,
  // unconditional reset avoids that class of bug entirely.
  function handleStepModeToggle() {
    const next = !stepMode;
    symmetryAnimTokenRef.current++; // cancel any in-flight rotation/inversion animation
    setStepMode(next);
    setSelectedOperation('1');
    setSelectedAxis('c');
    setAxisAutoSynced(true);
    setCurrentBasePoint(symmetryPoint);
    setSavedAtoms([]);
    setPreviewAtom(null);
    setOperationsLog([]);
    setCurrentStep(1);
    setShowConfirmBar(false);
    setMotionIndicators([]);
    setStepFreshEntry(next); // suppress the "1" highlight only when entering, not when leaving
    updateSymmetryScene('1', symmetryPoint);
  }

  function handleAxisSelect(axis) {
    // Deliberately does NOT touch stepFreshEntry: the Rotation Axis picker
    // lives in the Step-by-Step subsection, not Select Operation, so using
    // it must never make a Select Operation button look clicked.
    // The `axisAutoSynced` exception mirrors stepFreshEntry: an explicit
    // click on the already-synced axis still counts as a real pick.
    if (axis === selectedAxis && !axisAutoSynced) return;
    symmetryAnimTokenRef.current++; // cancel any in-flight rotation/inversion animation
    setSelectedAxis(axis);
    setAxisAutoSynced(false); // now explicitly chosen by the user — safe to highlight
    setCurrentBasePoint(symmetryPoint);
    setSavedAtoms([]);
    setPreviewAtom(null);
    setOperationsLog([]);
    setCurrentStep(1);
    setShowConfirmBar(false);
    setMotionIndicators([]); // clear any leftover rotation/inversion arc from the previous axis
  }

  function applyRotation(angleDeg) {
    try {
      // Validate angle input
      if (typeof angleDeg !== 'number' || isNaN(angleDeg)) {
        console.error('applyRotation: invalid angle', angleDeg);
        alert('Error: Invalid rotation angle. Please select a valid angle.');
        return;
      }

      // Validate input
      if (!currentBasePoint || currentBasePoint.length < 3) {
        console.error('applyRotation: invalid currentBasePoint', currentBasePoint);
        alert('Error: No base point selected. Please select a point first.');
        return;
      }

      const [x, y, z] = currentBasePoint;
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.error('applyRotation: NaN in currentBasePoint', { x, y, z });
        alert('Error: Invalid base point coordinates.');
        return;
      }

      const angle = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Rotation axis comes directly from the axis picker (single source of truth)
      const axis = selectedAxis === 'b' ? 'y' : selectedAxis === 'a' ? 'x' : 'z';

      let newX, newY, newZ;
      if (axis === 'x') {
        // Rotation around x-axis
        newX = x;
        newY = y * cos - z * sin;
        newZ = y * sin + z * cos;
      } else if (axis === 'y') {
        // Rotation around y-axis
        newX = x * cos + z * sin;
        newY = y;
        newZ = -x * sin + z * cos;
      } else {
        // Rotation around z-axis (default)
        newX = x * cos - y * sin;
        newY = x * sin + y * cos;
        newZ = z;
      }

      // Validate computed coordinates
      if (isNaN(newX) || isNaN(newY) || isNaN(newZ)) {
        console.error('applyRotation: computed NaN coordinates', { newX, newY, newZ });
        alert('Error: Rotation calculation resulted in invalid coordinates.');
        return;
      }

      // Store the previous position for motion indicator
      const previousPoint = [...currentBasePoint];
      const newPoint = [newX, newY, newZ];

      // Animation duration based on speed
      const getAnimationDuration = (speed) => {
        switch (speed) {
          case 'slow': return 2000; // 2 seconds
          case 'fast': return 200;  // 0.2 seconds
          default: return 800;      // 0.8 seconds for normal
        }
      };

      const duration = getAnimationDuration(animationSpeed);
      const startTime = Date.now();

      // Invalidate any previously in-flight rotation/inversion animation so
      // rapid-fire clicks can't race each other or leak into a tab switch /
      // reset that already moved state elsewhere.
      const myAnimToken = ++symmetryAnimTokenRef.current;

      // Add motion indicator immediately so the curved arc is visible during animation
      const motionIndicator = {
        type: 'rotation',
        from: previousPoint,
        to: newPoint,
        angle: angleDeg,
        axis: axis,
        operation: `Rotation ${angleDeg}° // O${axis.toUpperCase()}`
      };
      setMotionIndicators(prev => [...prev, motionIndicator]);

      // Keep currentBasePoint fixed during animation; previewAtom moves
      setPreviewAtom(previousPoint);

      // Animation function
      const animate = () => {
        if (symmetryAnimTokenRef.current !== myAnimToken) return; // superseded/cancelled

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Sweep the actual angle rather than lerping x/y/z in a straight
        // line: a straight-line chord between start and end cuts through
        // the rotation axis itself at 180° (collapsing to the center
        // mid-animation) and is subtly off-arc at every other angle too.
        const t = angle * progress;
        const tc = Math.cos(t), ts = Math.sin(t);
        let currentX, currentY, currentZ;
        if (axis === 'x') {
          currentX = x;
          currentY = y * tc - z * ts;
          currentZ = y * ts + z * tc;
        } else if (axis === 'y') {
          currentX = x * tc + z * ts;
          currentY = y;
          currentZ = -x * ts + z * tc;
        } else {
          currentX = x * tc - y * ts;
          currentY = x * ts + y * tc;
          currentZ = z;
        }
        setPreviewAtom({ x: currentX, y: currentY, z: currentZ, isPreview: true });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Deliberately does NOT touch symmetryPoint: that must stay the
          // fixed starting point for this operation (savedAtoms tracks the
          // checkpoint history) so "Back" can correctly fall back to it
          // once every saved position has been popped, instead of landing
          // back on wherever the last rotation happened to end.
          setCurrentBasePoint(newPoint);
          setPreviewAtom(null);
          // Animation complete - add to operations log
          setOperationsLog(prev => [...prev, {
            step: savedAtoms.length + motionIndicators.length + 1,
            from: `(${previousPoint[0].toFixed(2)}, ${previousPoint[1].toFixed(2)}, ${previousPoint[2].toFixed(2)})`,
            to: `(${newPoint[0].toFixed(2)}, ${newPoint[1].toFixed(2)}, ${newPoint[2].toFixed(2)})`,
            isAbovePlane: isNonNegativeSide(axis === 'x' ? newX : axis === 'y' ? newY : newZ)
          }]);
        }
      };

      // Start animation
      animate();

    } catch (error) {
      console.error('applyRotation: unexpected error', error);
      alert(`Error during rotation: ${error.message || 'Unknown error occurred'}`);
    }
  }

  function applyInversion() {
    try {
      // Validate input
      if (!currentBasePoint || currentBasePoint.length < 3) {
        console.error('applyInversion: invalid currentBasePoint', currentBasePoint);
        alert('Error: No base point selected. Please select a point first.');
        return;
      }

      const [x, y, z] = currentBasePoint;
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.error('applyInversion: NaN in currentBasePoint', { x, y, z });
        alert('Error: Invalid base point coordinates.');
        return;
      }

      // Store the previous position for motion indicator
      const previousPoint = [...currentBasePoint];
      const newPoint = [-x, -y, -z];

      // Animation duration based on speed
      const getAnimationDuration = (speed) => {
        switch (speed) {
          case 'slow': return 2000; // 2 seconds
          case 'fast': return 200;  // 0.2 seconds
          default: return 800;      // 0.8 seconds for normal
        }
      };

      const duration = getAnimationDuration(animationSpeed);
      const startTime = Date.now();

      // Invalidate any previously in-flight rotation/inversion animation so
      // rapid-fire clicks can't race each other or leak into a tab switch /
      // reset that already moved state elsewhere.
      const myAnimToken = ++symmetryAnimTokenRef.current;

      // Add motion indicator immediately so the dashed line is visible during animation
      const motionIndicator = {
        type: 'inversion',
        from: previousPoint,
        to: newPoint,
        operation: 'Inversion'
      };
      setMotionIndicators(prev => [...prev, motionIndicator]);

      // Keep currentBasePoint fixed during animation; previewAtom animates.
      // Unlike rotation, inversion is NOT rendered by re-projecting the
      // interpolated raw (x,y,z) each frame: near the origin that vector's
      // angle/side becomes numerically unstable (a near-zero vector has no
      // well-defined direction), which made the animated ball wander off
      // the straight inversion line instead of sliding smoothly through the
      // center. Instead the renderers map only the well-defined start point
      // once and interpolate the RENDER-SPACE position between it and its
      // exact reflection — see `isInversion`/`progress`/`from` below.
      setPreviewAtom({ x: previousPoint[0], y: previousPoint[1], z: previousPoint[2], isPreview: true, isInversion: true, progress: 0, from: previousPoint });

      // Animation function
      const animate = () => {
        if (symmetryAnimTokenRef.current !== myAnimToken) return; // superseded/cancelled

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setPreviewAtom({ x: previousPoint[0], y: previousPoint[1], z: previousPoint[2], isPreview: true, isInversion: true, progress, from: previousPoint });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure end position is exact in case of floating point rounding.
          // Deliberately does NOT touch symmetryPoint — see the matching
          // note in applyRotation's completion branch.
          setCurrentBasePoint(newPoint);
          setPreviewAtom(null);

          // Animation complete - add to operations log
          setOperationsLog(prev => [...prev, {
            step: savedAtoms.length + motionIndicators.length + 1,
            operation: 'Inversion',
            from: `(${previousPoint[0].toFixed(2)}, ${previousPoint[1].toFixed(2)}, ${previousPoint[2].toFixed(2)})`,
            to: `(${newPoint[0].toFixed(2)}, ${newPoint[1].toFixed(2)}, ${newPoint[2].toFixed(2)})`,
            isAbovePlane: isNonNegativeSide(selectedAxis === 'b' ? newPoint[1] : selectedAxis === 'a' ? newPoint[0] : newPoint[2])
          }]);
        }
      };

      // Start animation
      animate();

    } catch (error) {
      console.error('applyInversion: unexpected error', error);
      alert(`Error during inversion: ${error.message || 'Unknown error occurred'}`);
    }
  }

  function savePosition(overridePreview = null) {
    // Add current position to saved atoms
    const currentPos = currentBasePoint;
    if (!currentPos || currentPos.length < 3) return;

    // Validate coordinates
    if (isNaN(currentPos[0]) || isNaN(currentPos[1]) || isNaN(currentPos[2])) {
      console.error('savePosition: invalid currentBasePoint coordinates', currentPos);
      return;
    }

    const newAtom = {
      x: currentPos[0],
      y: currentPos[1],
      z: currentPos[2],
      isAbovePlane: isNonNegativeSide(selectedAxis === 'b' ? currentPos[1] : selectedAxis === 'a' ? currentPos[0] : currentPos[2]),
      stepIndex: savedAtoms.length + 1
    };
    setSavedAtoms(prev => [...prev, newAtom]);
    console.log('[SAVE] savedAtoms:', JSON.stringify(savedAtoms));
    console.log('[SAVE] calling drawStereographicProjection...');
    // Note: drawStereographicProjection is in SymmetryControls, but since it's a child, we can't call it directly.
    // Instead, trigger a re-render by updating state, but for debug, we'll add inside the function.
  }

  function discardPreview() {
    setPreviewAtom(null);
    setShowConfirmBar(false);
  }

  function applySymmetryOperation(operationKey, step = null) {
    const operation = getEffectiveOperation(operationKey, selectedAxis);
    if (!operation) return;
    const opPoint = (currentBasePoint && Array.isArray(currentBasePoint) && currentBasePoint.length === 3)
      ? currentBasePoint
      : symmetryPoint;
    let points = [opPoint];
    let description = operation.name;

    // Get all orbit points
    const allOrbitPoints = generateOrbitPoints(opPoint, operation, operationKey);
    const axis = selectedAxis || 'c';
    const topBottomOrbit = filterTopBottomOrbit(allOrbitPoints, axis);

    if (stepMode && step) {
      if (step === 1) {
        // Step 1: Show the starting point only
        points = [symmetryPoint];
        description = `${operation.name} - Step 1/2: Starting point`;
        setCurrentStep(2);
      } else if (step === 2) {
        // Step 2: Apply the full operation
        points = allOrbitPoints;
        description = `${operation.name} - Step 2/2: All ${allOrbitPoints.length} positions`;
        setCurrentStep(1); // Reset for next operation
      }
    } else {
      // Direct application - show only top/bottom positions
      points = topBottomOrbit;
      description = `${operation.name} applied → ${topBottomOrbit.length} top/bottom positions`;
    }

    const newEntry = {
      operation: operationKey,
      description,
      points,
      timestamp: Date.now()
    };

    setOperationsLog(prev => [...prev, newEntry]);
  }

  function generateOrbitPoints(startPoint, operation, operationKey) {
    const points = [startPoint];

    if (operation.order === 1) {
      return points; // Identity or inversion
    }

    let currentPoint = startPoint;
    for (let i = 1; i < operation.order; i++) {
      currentPoint = operation.transform(...currentPoint);
      points.push(currentPoint);
    }

    // 2̄//Oz (mirror ⊥ Oz) is explicitly exempted from dedup: for a
    // starting point with z=0, its mirror image (same x,y, negated z)
    // numerically coincides with the original (±0 differ only in sign),
    // so the generic filter below would otherwise hide it entirely. The
    // user wants both positions always shown for this operation — the
    // second one lands on the opposite cap via the app's own
    // isNonNegativeSide(-0)=false rule, making the mirror visible even in
    // this edge case.
    if (operationKey === '2̄//Oz') return points;

    // Remove duplicates
    return points.filter((point, index, arr) => {
      return !arr.slice(0, index).some(p =>
        Math.abs(p[0] - point[0]) < 1e-6 &&
        Math.abs(p[1] - point[1]) < 1e-6 &&
        Math.abs(p[2] - point[2]) < 1e-6
      );
    });
  }

  function filterTopBottomOrbit(points, axis) {
    if (!Array.isArray(points) || points.length === 0) return [];
    const index = axis === 'a' ? 0 : axis === 'b' ? 1 : 2;
    let top = null;
    let bottom = null;
    for (const point of points) {
      if (!point || point.length < 3) continue;
      if (isNonNegativeSide(point[index]) && top === null) top = point;
      if (!isNonNegativeSide(point[index]) && bottom === null) bottom = point;
      if (top && bottom) break;
    }
    const output = [];
    if (top) output.push(top);
    if (bottom) output.push(bottom);
    return output;
  }

  function projectPointForAxis(point, axis) {
    const [x, y, z] = Array.isArray(point) ? point : [point?.x, point?.y, point?.z];
    if ([x, y, z].some(v => typeof v !== 'number' || isNaN(v))) return null;

    let planeX, planeY, height;
    if (axis === 'a') {
      planeX = y;
      planeY = z;
      height = x;
    } else if (axis === 'b') {
      planeX = x;
      planeY = z;
      height = y;
    } else {
      planeX = x;
      planeY = y;
      height = z;
    }

    const rPlane = Math.sqrt(planeX * planeX + planeY * planeY);
    const phi = rPlane === 0 ? 0 : Math.atan2(planeY, planeX);
    return {
      planeX,
      planeY,
      height,
      isAbove: isNonNegativeSide(height),
      phi,
      rPlane,
    };
  }

  function mapProjectedToCylinderRim(proj, axis, cylinderRadius, cylinderHalfHeight) {
    if (!proj) return null;
    const rimHeight = proj.isAbove ? cylinderHalfHeight : -cylinderHalfHeight;
    const cosPhi = Math.cos(proj.phi);
    const sinPhi = Math.sin(proj.phi);

    if (axis === 'a') {
      return new THREE.Vector3(rimHeight, cylinderRadius * cosPhi, cylinderRadius * sinPhi);
    }
    if (axis === 'b') {
      return new THREE.Vector3(cylinderRadius * cosPhi, rimHeight, cylinderRadius * sinPhi);
    }
    return new THREE.Vector3(cylinderRadius * cosPhi, cylinderRadius * sinPhi, rimHeight);
  }

  // ── Gallery ────────────────────────────────────────────────────────────────
  function disposeGallery() {
    galleryActive.current = false;
    if (galleryRAF.current) { cancelAnimationFrame(galleryRAF.current); galleryRAF.current = null; }
    galleryItems.current.forEach(g => {
      g.scene.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
    });
    galleryItems.current = [];
    if (vpGalleryRef.current) vpGalleryRef.current.innerHTML = '';
  }

  useEffect(() => {
    if (currentTab !== 'gallery') return;
    const container = vpGalleryRef.current;
    const gRenderer = gRendererRef.current;
    if (!container || !gRenderer) return;

    disposeGallery();
    container.innerHTML = '';
    galleryActive.current = true;
    const keys = Object.keys(STRUCTS);
    const visibleSet = new Set();
    const canvasW = 220; const canvasH = 160;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const idx = parseInt(e.target.dataset.galleryIdx);
        if (e.isIntersecting) visibleSet.add(idx); else visibleSet.delete(idx);
      });
    }, { root: container, threshold: 0.1 });

    keys.forEach((key, ki) => {
      const s = STRUCTS[key];
      const displayName = t(STRUCT_NAME_KEY[key]) || s.name;
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.setAttribute('data-key', key);
      card.setAttribute('data-gallery-idx', ki);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', t('ariaViewInDetail', { name: displayName }));
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setStructKey(key);
        handleSwitchTab('struct');
      });
      card.onkeydown = (e) => { if (e.key==='Enter'||e.key===' ') card.click(); };

      const wrap = document.createElement('div');
      wrap.className = 'gallery-canvas-wrap';
      const canvas2d = document.createElement('canvas');
      canvas2d.width = canvasW; canvas2d.height = canvasH;
      canvas2d.style.cssText = 'width:100%;height:100%;display:block;';
      wrap.appendChild(canvas2d);

      const lbl = document.createElement('div');
      lbl.className = 'gallery-label';
      lbl.innerHTML = `<div class="gname">${displayName}</div><div class="gmeta">Z=${s.z} · CN=${s.cn} · APF=${s.apf}</div>`;
      card.appendChild(wrap);
      card.appendChild(lbl);
      container.appendChild(card);
      observer.observe(card);

      const gScene = new THREE.Scene();
      gScene.add(new THREE.AmbientLight(0x3040a0, 0.8));
      const gdl1=new THREE.DirectionalLight(0xffffff,1.0); gdl1.position.set(6,8,6); gScene.add(gdl1);
      const gdl2=new THREE.DirectionalLight(0x00d4ff,0.2); gdl2.position.set(0,0,10); gScene.add(gdl2);
      buildStructureInScene(key, gScene);

      const gCamera = new THREE.PerspectiveCamera(42, canvasW/canvasH, 0.1, 200);
      const camR = galleryCellSize===1?11:galleryCellSize===2?20:30;
      const gOrb = { theta: 0.6+Math.random()*0.5, phi: 1.1, r: camR };
      galleryItems.current.push({ scene:gScene, camera:gCamera, orb:gOrb, canvas2d });
    });

    let frameIdx = 0;
    function galleryLoop() {
      if (!galleryActive.current) return;
      galleryRAF.current = requestAnimationFrame(galleryLoop);
      galleryItems.current.forEach(g => { g.orb.theta += 0.003; });
      const BATCH = 4;
      for (let b=0; b<BATCH; b++) {
        const i = (frameIdx+b) % galleryItems.current.length;
        if (!visibleSet.has(i) && galleryItems.current.length > BATCH*2) continue;
        const g = galleryItems.current[i];
        const r = g.orb.r;
        g.camera.position.set(r*Math.sin(g.orb.phi)*Math.sin(g.orb.theta),r*Math.cos(g.orb.phi),r*Math.sin(g.orb.phi)*Math.cos(g.orb.theta));
        g.camera.lookAt(0,0,0);
        gRenderer.render(g.scene, g.camera);
        const ctx = g.canvas2d.getContext('2d');
        ctx.clearRect(0,0,canvasW,canvasH);
        ctx.drawImage(gRenderer.domElement,0,0,canvasW,canvasH);
      }
      frameIdx = (frameIdx+BATCH) % galleryItems.current.length;
    }
    galleryLoop();

    return () => {
      observer.disconnect();
      disposeGallery();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, tabSwitchKey, galleryCellSize, lang]);

  function buildStructureInScene(key, targetScene) {
    const s = STRUCTS[key];
    const N = galleryCellSize;
    const reps = Array.from({length:N},(_,i)=>i);
    const offset = (N-1)/2;
    reps.forEach(ix=>reps.forEach(iy=>reps.forEach(iz=>{
      let ox,oy,oz;
      if (s.lv) {
        const [a1,a2,a3]=s.lv;
        ox=(ix-offset)*a1[0]+(iy-offset)*a2[0]+(iz-offset)*a3[0];
        oy=(ix-offset)*a1[1]+(iy-offset)*a2[1]+(iz-offset)*a3[1];
        oz=(ix-offset)*a1[2]+(iy-offset)*a2[2]+(iz-offset)*a3[2];
      } else {
        const ax=s.ax||1,ay=s.ay||1,az=s.az||1;
        ox=(ix-offset)*CS*ax; oy=(iy-offset)*CS*ay; oz=(iz-offset)*CS*az;
      }
      if (s.lv) {
        const [a1,a2,a3]=s.lv;
        const pivX=0.5*(a1[0]+a2[0]+a3[0]);
        const pivY=0.5*(a1[1]+a2[1]+a3[1]);
        const pivZ=0.5*(a1[2]+a2[2]+a3[2]);
        function gCorner(f1,f2,f3){return new THREE.Vector3(f1*a1[0]+f2*a2[0]+f3*a3[0]-pivX+ox,f1*a1[1]+f2*a2[1]+f3*a3[1]-pivY+oy,f1*a1[2]+f2*a2[2]+f3*a3[2]-pivZ+oz);}
        const c000=gCorner(0,0,0),c100=gCorner(1,0,0),c010=gCorner(0,1,0),c001=gCorner(0,0,1);
        const c110=gCorner(1,1,0),c101=gCorner(1,0,1),c011=gCorner(0,1,1),c111=gCorner(1,1,1);
        const edges=[[c000,c100],[c000,c010],[c000,c001],[c110,c100],[c110,c010],[c110,c111],[c101,c100],[c101,c001],[c101,c111],[c011,c010],[c011,c001],[c011,c111]];
        const mat=new THREE.LineBasicMaterial({color:0x2a3580,opacity:0.85,transparent:true});
        edges.forEach(([p1,p2])=>targetScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1,p2]),mat)));
      } else {
        const ax=s.ax||1,ay=s.ay||1,az=s.az||1;
        const wf=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CS*ax,CS*ay,CS*az)),new THREE.LineBasicMaterial({color:0x2a3580,opacity:0.85,transparent:true}));
        wf.position.set(ox,oy,oz); targetScene.add(wf);
      }
      const meshes=s.atoms.map(a=>{
        const col=a.c||s.color||0x4fc3f7;
        const mat=new THREE.MeshPhongMaterial({color:col,shininess:100,specular:0x333355,emissive:new THREE.Color(col).multiplyScalar(0.05)});
        const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.13*CS,20,16),mat);
        mesh.position.copy(worldPos(a.f,ox,oy,oz,s));
        targetScene.add(mesh);
        return mesh;
      });
      if (showBonds && CUBIC_STRUCT_KEYS.includes(key)) drawBonds(s, meshes, s.atoms, targetScene);
    })));
  }

  // ── localStorage ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('crystaledu_prefs');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.lang) setLang(p.lang);
      if (p.struct && STRUCTS[p.struct]) setStructKey(p.struct);
      if (p.cellSize) setCellSizeState(p.cellSize);
      if (p.showBonds === false) setShowBonds(false);
      if (p.renderMode) setRenderMode(p.renderMode);
      if (p.autoRot === false) setAutoRot(false);
      if (p.millerSub) setMillerSub(p.millerSub);
      if (p.millerCells) setMillerCells(p.millerCells);
      if (p.millerU !== undefined) setMillerU(Number(p.millerU));
      if (p.millerV !== undefined) setMillerV(Number(p.millerV));
      if (p.millerW !== undefined) setMillerW(Number(p.millerW));
      if (p.millerH !== undefined) setMillerH(Number(p.millerH));
      if (p.millerK !== undefined) setMillerK(Number(p.millerK));
      if (p.millerL !== undefined) setMillerL(Number(p.millerL));
    } catch(e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('crystaledu_prefs', JSON.stringify({
        struct:structKey, cellSize, showBonds, renderMode, autoRot, lang:lang,
        millerSub, millerCells, millerU, millerV, millerW, millerH, millerK, millerL,
      }));
    } catch(e) {}
  }, [structKey, cellSize, showBonds, renderMode, autoRot, lang, millerSub, millerCells, millerU, millerV, millerW, millerH, millerK, millerL]);

  // ── Reset camera ──────────────────────────────────────────────────────────
  function resetCam() {
    if (currentTab==='miller') setDefaultOrbit(1.0, 0.7, cellSize===1?16:cellSize===2?24:32);
    else if (currentTab==='symmetry') setDefaultOrbit(1.05, 0.55, cellSize===1?24:cellSize===2?26:28);
    else setDefaultOrbit(1.1, 0.6, cellSize===1?14:cellSize===2?26:38);
    applyOrbit();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',background:'var(--bg)',color:'var(--text)',fontFamily:"'Exo 2', sans-serif"}}>

      {/* Header */}
      <Header
        lang={lang}
        autoRot={autoRot}
        theme={theme}
        onToggleLang={() => setLang(l => l==='en'?'fr':'en')}
        onToggleAutoRot={() => setAutoRot(v => !v)}
        onToggleTheme={toggleTheme}
        t={t}
      />

      {/* App body */}
      <div style={{display:'flex',flex:1,overflow:'hidden',position:'relative'}}>

        {/* Sidebar toggle tab */}
        <div
          id="sidebar-tab"
            onClick={() => {
              setSidebarOpen(o => !o);
              if (!sidebarOpen) setIsSidebarPinned(true);
            }}
          style={{
            position:'absolute', top:'50%',
            left: sidebarOpen ? '272px' : '0',
            transform:'translateY(-50%)',
            zIndex:20, width:20, height:56,
            background:'var(--panel)', border:'1px solid var(--border)',
            borderLeft:'none', borderRadius:'0 6px 6px 0',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'left 0.25s ease', color:'var(--dim)', fontSize:'0.7rem',
          }}
          role="button"
          aria-label={t('ariaToggleSidebar')}
          aria-expanded={sidebarOpen}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none"
            style={{transition:'transform 0.25s', transform: sidebarOpen?'':'rotate(180deg)'}}>
            <polyline points="7,1 2,7 7,13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? '272px' : '0',
          minWidth: sidebarOpen ? '272px' : '0',
          opacity: sidebarOpen ? 1 : 0,
          overflow:'hidden',
          flexShrink:0,
          background:'var(--panel)',
          borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
          transition:'width 0.25s ease, opacity 0.25s ease, min-width 0.25s ease',
          overflowY:'auto',
          pointerEvents: sidebarOpen ? 'auto' : 'none',
        }}>
          {/* Tab nav */}
          <nav style={{display:'flex',flexDirection:'column',borderBottom:'1px solid var(--border)'}}>
            {[
              { id:'struct', icon:'⬡', labelKey:'tabStruct' },
              { id:'miller', icon:'⊞', labelKey:'tabMiller' },
              { id:'symmetry', icon:'⚛', labelKey:'tabSymmetry' },
              { id:'gallery',icon:'⊟', labelKey:'tabGallery' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn${currentTab===tab.id?' active':''}`}
                role="tab"
                aria-selected={currentTab===tab.id}
                onClick={() => handleSwitchTab(tab.id)}
              >
                {tab.icon} {t(tab.labelKey)}
              </button>
            ))}
          </nav>

          {/* Panels */}
          {currentTab === 'struct' && (
            <StructControls
              t={t}
              structKey={structKey}
              cellSize={cellSize}
              showBonds={showBonds}
              renderMode={renderMode}
              structInfo={structInfo}
              onStructChange={setStructKey}
              onCellSize={setCellSizeState}
              onBonds={setShowBonds}
              onRenderMode={setRenderMode}
            />
          )}
          {currentTab === 'miller' && (
            <MillerControls
              t={t}
              millerSub={millerSub}
              millerCells={cellSize}
              millerOrigin={millerOrigin}
              millerU={millerU} millerV={millerV} millerW={millerW}
              millerH={millerH} millerK={millerK} millerL={millerL}
              onSubTab={setMillerSub}
              onCells={setCellSizeState}
              onOrigin={(str) => setMillerOrigin(str.split(',').map(Number))}
              onUVW={(key, val) => {
                if (key === 'u') setMillerU(Number(val));
                else if (key === 'v') setMillerV(Number(val));
                else if (key === 'w') setMillerW(Number(val));
                else if (key === 'preset') { setMillerU(val[0]); setMillerV(val[1]); setMillerW(val[2]); }
              }}
              onHKL={(key, val) => {
                if (key === 'h') setMillerH(Number(val));
                else if (key === 'k') setMillerK(Number(val));
                else if (key === 'l') setMillerL(Number(val));
                else if (key === 'preset') { setMillerH(val[0]); setMillerK(val[1]); setMillerL(val[2]); }
              }}
              infoDir=""
              noteDir=""
              infoPlane=""
              notePlane=""
            />
          )}
          {currentTab === 'symmetry' && (
            <SymmetryControls
              t={t}
              startPoint={symmetryPoint}
              onStartPoint={setSymmetryPoint}
              selectedOperation={selectedOperation}
              onOperationSelect={handleOperationSelect}
              selectedAxis={selectedAxis}
              onAxisSelect={handleAxisSelect}
              axisAutoSynced={axisAutoSynced}
              onApplyOperation={applySymmetryOperation}
              onReset={handleSymmetryReset}
              onUndo={handleSymmetryUndo}
              onBack={handleSymmetryBack}
              operationsLog={operationsLog}
              stepMode={stepMode}
              onStepModeToggle={handleStepModeToggle}
              stepFreshEntry={stepFreshEntry}
              currentStep={currentStep}
              onCurrentStep={setCurrentStep}
              currentBasePoint={currentBasePoint}
              onBasePointChange={setCurrentBasePoint}
              savedAtoms={savedAtoms}
              onSavedAtomsChange={setSavedAtoms}
              previewAtom={previewAtom}
              onPreviewAtomChange={setPreviewAtom}
              selectedAngle={selectedAngle}
              onAngleChange={setSelectedAngle}
              angleMode={angleMode}
              onAngleModeChange={setAngleMode}
              onApplyRotation={applyRotation}
              onApplyInversion={applyInversion}
              onSavePosition={savePosition}
              onDiscardPreview={discardPreview}
              showConfirmBar={showConfirmBar}
              onShowConfirmBar={setShowConfirmBar}
              animationSpeed={animationSpeed}
              onAnimationSpeedChange={setAnimationSpeed}
              projectionZoom={projectionZoom}
              onProjectionZoomChange={setProjectionZoom}
            />
          )}
          {currentTab === 'gallery' && (
            <GalleryControls
              t={t}
              galleryCellSize={galleryCellSize}
              onCellChange={setGalleryCellSize}
            />
          )}
        </aside>

        {/* Gallery viewport */}
        <main
          ref={vpGalleryRef}
          className="viewport-gallery"
          role="main"
          aria-label={t('ariaStructureGallery')}
          style={{
            display: currentTab==='gallery' ? 'grid' : 'none',
            flex:1, overflowY:'auto', padding:16,
            background:'var(--bg)',
            gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
            gap:14, alignContent:'start',
          }}
        />

        {/* Symmetry Tab - Side by Side or Stacked Layout */}
        {currentTab === 'symmetry' && (
          <main style={{
            flex:1,
            display:'flex',
            gap:16,
            padding:16,
            overflow:'hidden',
            flexDirection: isCompactMode ? 'column' : 'row',
            alignItems: 'stretch',
          }}>
            {/* 2D Stereographic Projection Panel */}
            {showSymmetryPanel ? (
              <div style={{
                flex: isCompactMode ? 1 : 2,
                minWidth:0,
                minHeight:0,
                position:'relative',
                border:'1px solid var(--border)',
                borderRadius:8,
                background:'var(--panel)',
                overflow:'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div
                  style={{
                    position:'absolute', top:'50%', right:-10,
                    transform:'translateY(-50%)', width:20, height:56,
                    border:'1px solid var(--border)', borderLeft:'none',
                    borderRadius:'0 6px 6px 0', background:'var(--panel)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', zIndex:90
                  }}
                  role="button"
                  aria-label={showSymmetryPanel ? t('ariaHideSymmetryPanel') : t('ariaShowSymmetryPanel')}
                  onClick={() => setShowSymmetryPanel(v => !v)}
                >
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none"
                    style={{transition:'transform 0.2s', transform: showSymmetryPanel ? 'rotate(0deg)' : 'rotate(180deg)', color:'var(--dim)'}}>
                    <polyline points="7,1 2,7 7,13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{height:'100%', width:'100%', display:'flex', flexDirection:'column'}}>
                  <div style={{padding:12, background:'var(--panel)', borderBottom:'1px solid var(--border)'}}>
                    <h3 style={{margin:0, fontSize:'14px', color:'var(--text)'}}>{t('labelStereographicProjection')}</h3>
                  </div>
                  <StereographicProjection
                    t={t}
                    selectedOperation={selectedOperation}
                    operationsLog={operationsLog}
                    startPoint={symmetryPoint}
                    savedAtoms={savedAtoms}
                    previewAtom={previewAtom}
                    currentBasePoint={currentBasePoint}
                    stepMode={stepMode}
                    projectionZoom={projectionZoom}
                    onProjectionZoomChange={setProjectionZoom}
                  />
                </div>
              </div>
            ) : (
              <div style={{width:40, minWidth:40, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <button
                  className="ov-btn"
                  style={{fontSize:'0.9rem', padding:'6px 8px', height:32, whiteSpace:'nowrap'}}
                  onClick={() => setShowSymmetryPanel(true)}
                  aria-label={t('ariaShowSymmetryPanel')}
                >
                  {t('btnShowPanel')}
                </button>
              </div>
            )}

            {/* 3D Cylinder View Panel */}
            <div style={{
              flex: showSymmetryPanel ? (isCompactMode ? 1 : 3) : 1,
              position:'relative',
              border:'1px solid var(--border)',
              borderRadius:8,
              overflow:'hidden',
              display: 'flex',
              flexDirection: 'column',
              minWidth:0,
              minHeight:0,
            }}>
              <div style={{padding:12, background:'var(--panel)', borderBottom:'1px solid var(--border)'}}>
                <h3 style={{margin:0, fontSize:'14px', color:'var(--text)'}}>{t('label3DCylinderView')}</h3>
              </div>
              <div
                ref={vpRef}
                style={{
                  width:'100%',
                  height:'calc(100% - 45px)',
                  position:'relative',
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                  minWidth:0,
                  minHeight:0,
                }}
              >
                {/* Overlay buttons */}
                <div style={{position:'absolute',top:10,right:10,zIndex:5,display:'flex',flexDirection:'column',gap:5}}>
                  <button className="ov-btn" onClick={resetCam} aria-label={t('ariaResetCamera')}>
                    ↺ {t('btnResetCam')}
                  </button>
                </div>

                {/* Axis labels — Symmetry section uses x/y/z instead of a/b/c */}
                <div ref={axLblXRef} className="axis-label" id="ax-lbl-x" style={{color:'#ff4444',display:'none'}}>x</div>
                <div ref={axLblYRef} className="axis-label" id="ax-lbl-y" style={{color:'#33dd33',display:'none'}}>y</div>
                <div ref={axLblZRef} className="axis-label" id="ax-lbl-z" style={{color:'#3399ff',display:'none'}}>z</div>
              </div>
            </div>
          </main>
        )}

        {/* Other Tabs - 3D Viewport */}
        {currentTab !== 'symmetry' && (
          <main
            ref={vpRef}
            role="main"
            aria-label={t('ariaCrystalViewer')}
            style={{
                flex:1, position:'relative', overflow:'hidden', minHeight:'0',
                display: currentTab==='gallery' ? 'none' : 'flex',
                alignItems:'stretch', justifyContent:'stretch',
            }}
          >
            {/* Overlay buttons */}
            <div style={{position:'absolute',top:10,right:10,zIndex:5,display:'flex',flexDirection:'column',gap:5}}>
              <button className="ov-btn" onClick={resetCam} aria-label={t('ariaResetCamera')}>
                ↺ {t('btnResetCam')}
              </button>
              {isCompactMode && !sidebarOpen && (
                <button
                  className="ov-btn"
                  onClick={() => { setSidebarOpen(true); setIsSidebarPinned(true); }}
                  aria-label={t('btnShowControls')}
                >
                  {t('btnShowControls')}
                </button>
              )}
            </div>

            {/* Axis labels */}
            <div ref={axLblXRef} className="axis-label" id="ax-lbl-x" style={{color:'#ff4444',display:'none'}}>a</div>
            <div ref={axLblYRef} className="axis-label" id="ax-lbl-y" style={{color:'#33dd33',display:'none'}}>b</div>
            <div ref={axLblZRef} className="axis-label" id="ax-lbl-z" style={{color:'#3399ff',display:'none'}}>c</div>

            {/* Hints — styled via the .hint / .keyboard-hint classes in
                globals.css (which also handle wrapping/shrinking on small
                screens), not inline styles, so those responsive rules
                actually apply. */}
            <div className="hint">
              {t('hint')}
            </div>
            <div className="keyboard-hint">
              {t('keyboardHint')}
            </div>
          </main>
        )}
      </div>

      {/* Footer */}
      <Footer onFeedback={() => setFeedbackOpen(true)} t={t} />

      {/* Mobile bottom nav */}
      <MobileNav
        activeTab={currentTab}
        onTab={handleSwitchTab}
        onOpenDrawer={() => setMobileDrawerOpen(o => !o)}
        t={t}
      />

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentTab={currentTab}
        t={t}
      >
        {currentTab === 'struct' && (
          <StructControls
            t={t} structKey={structKey} cellSize={cellSize}
            showBonds={showBonds} renderMode={renderMode}
            structInfo={structInfo}
            onStructChange={setStructKey} onCellSize={setCellSizeState}
            onBonds={setShowBonds} onRenderMode={setRenderMode}
          />
        )}
        {currentTab === 'miller' && (
          <MillerControls
            t={t} millerSub={millerSub} millerCells={cellSize}
            millerOrigin={millerOrigin}
            millerU={millerU} millerV={millerV} millerW={millerW}
            millerH={millerH} millerK={millerK} millerL={millerL}
            onSubTab={setMillerSub}
            onCells={setCellSizeState}
            onOrigin={(str) => setMillerOrigin(str.split(',').map(Number))}
            onUVW={(key, val) => {
              if (key === 'u') setMillerU(Number(val));
              else if (key === 'v') setMillerV(Number(val));
              else if (key === 'w') setMillerW(Number(val));
              else if (key === 'preset') { setMillerU(val[0]); setMillerV(val[1]); setMillerW(val[2]); }
            }}
            onHKL={(key, val) => {
              if (key === 'h') setMillerH(Number(val));
              else if (key === 'k') setMillerK(Number(val));
              else if (key === 'l') setMillerL(Number(val));
              else if (key === 'preset') { setMillerH(val[0]); setMillerK(val[1]); setMillerL(val[2]); }
            }}
             infoDir=""
             noteDir=""
             infoPlane=""
             notePlane=""
           />
         )}
        {currentTab === 'symmetry' && (
          <SymmetryControls
            t={t}
            startPoint={symmetryPoint}
            onStartPoint={setSymmetryPoint}
            selectedOperation={selectedOperation}
            onOperationSelect={handleOperationSelect}
            selectedAxis={selectedAxis}
            onAxisSelect={handleAxisSelect}
            axisAutoSynced={axisAutoSynced}
            onApplyOperation={applySymmetryOperation}
            onReset={handleSymmetryReset}
            onUndo={handleSymmetryUndo}
            onBack={handleSymmetryBack}
            operationsLog={operationsLog}
            stepMode={stepMode}
            onStepModeToggle={handleStepModeToggle}
            stepFreshEntry={stepFreshEntry}
            currentStep={currentStep}
            onCurrentStep={setCurrentStep}
            currentBasePoint={currentBasePoint}
            onBasePointChange={setCurrentBasePoint}
            savedAtoms={savedAtoms}
            onSavedAtomsChange={setSavedAtoms}
            previewAtom={previewAtom}
            onPreviewAtomChange={setPreviewAtom}
            selectedAngle={selectedAngle}
            onAngleChange={setSelectedAngle}
            angleMode={angleMode}
            onAngleModeChange={setAngleMode}
            onApplyRotation={applyRotation}
            onApplyInversion={applyInversion}
            onSavePosition={savePosition}
            onDiscardPreview={discardPreview}
            showConfirmBar={showConfirmBar}
            onShowConfirmBar={setShowConfirmBar}
            projectionZoom={projectionZoom}
            onProjectionZoomChange={setProjectionZoom}
          />
        )}
        {currentTab === 'gallery' && (
          <GalleryControls t={t} galleryCellSize={galleryCellSize} onCellChange={setGalleryCellSize} />
        )}
      </MobileDrawer>

      {/* Feedback modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        endpoint={FORMSPREE_ENDPOINT}
        t={t}
      />
    </div>
  );
}
