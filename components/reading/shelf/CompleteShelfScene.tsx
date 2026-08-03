import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ReadingShelfLevel } from '../../../types';
import { ShelfLayoutEntry, SHELF_LEVEL_SPACING } from '../../../utils/readingShelfLayout';
import { BookMeshGroup, configureTextureAnisotropy } from './BookMesh';
import { ShelfMeshGroup } from './ShelfMesh';
import { ShelfBookManifestItem } from './mintManifest';

const SHELF_CAMERA_FOV = 38;
const SHELF_CAMERA_MIN_DISTANCE = 8.5;
const SHELF_CONTENT_HEIGHT = 4.2;
// The front cover is +X; with the inspection camera at +Z, -PI/2 faces it toward the camera.
export const INSPECTION_INITIAL_ROTATION_Y = -Math.PI / 2;

/** Shelf width derived from the book set (shared by setup and reconciliation). */
function shelfWidthFor(items: ShelfBookManifestItem[]): number {
  return Math.max(12, items.reduce((total, item) => total + item.thickness + 0.08, 0) + 1.2);
}

export function calculateShelfCameraDistance(
  viewportWidth: number,
  viewportHeight: number,
  shelfWidth: number,
  contentHeight = SHELF_CONTENT_HEIGHT,
): number {
  const safeWidth = Math.max(viewportWidth, 1);
  const safeHeight = Math.max(viewportHeight, 1);
  const aspect = safeWidth / safeHeight;
  const safeAspect = Math.max(aspect, 0.1);
  const halfFovRadians = THREE.MathUtils.degToRad(SHELF_CAMERA_FOV / 2);
  const horizontalDistance = (shelfWidth * 1.12) / (2 * Math.tan(halfFovRadians) * safeAspect);
  const verticalDistance = (contentHeight * 1.12) / (2 * Math.tan(halfFovRadians));

  return Math.max(SHELF_CAMERA_MIN_DISTANCE, horizontalDistance, verticalDistance);
}


export function getShelfLevelFromPointer(
  clientY: number,
  rect: Pick<DOMRect, 'top' | 'height'>,
  levels: ReadingShelfLevel[],
): ReadingShelfLevel | null {
  if (levels.length === 0 || rect.height <= 0) return null;
  const normalizedY = THREE.MathUtils.clamp((clientY - rect.top) / rect.height, 0, 0.999999);
  const visualIndex = Math.min(levels.length - 1, Math.floor((1 - normalizedY) * levels.length));
  return levels[visualIndex] ?? null;
}

export function getShelfCameraVerticalTarget(
  levels: ReadingShelfLevel[],
  activeLevelId: string | null,
  contentHeight = SHELF_CONTENT_HEIGHT,
): { cameraY: number; lookAtY: number } {
  const activeLevel = levels.find((level) => level.id === activeLevelId);
  if (!activeLevel) {
    return {
      cameraY: contentHeight / 2,
      lookAtY: contentHeight / 2 - 0.5,
    };
  }

  const levelY = activeLevel.position * SHELF_LEVEL_SPACING;
  return {
    cameraY: levelY + 2.1,
    lookAtY: levelY + 1.6,
  };
}

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.0;
const DRAG_LEVEL_THRESHOLD = 60;
const DRAG_PAN_HORIZONTAL_THRESHOLD = 40;

interface CompleteShelfSceneProps {
  shelfItems: ShelfBookManifestItem[];
  shelfLevels: ReadingShelfLevel[];
  shelfLayout: ShelfLayoutEntry[];
  activeLevelId: string | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenInspection: (index: number) => void;
  onCloseInspection?: () => void;
  onMoveBookToShelfLevel: (bookId: string, shelfLevelId: string, position?: number) => void;
  onDragStateChange?: (bookId: string | null, shelfLevelId: string | null) => void;
  onNavigateLevel?: (levelId: string) => void;
  isInspecting: boolean;
  onSwitchTo2D?: () => void;
}

/**
 * Wheel gesture policy during inspection: scrolling down (deltaY > 0) closes
 * the focused book. Scrolling up is intentionally ignored — a "zoom in" would
 * fight the closing gesture and add nothing the orbit camera does not already
 * provide.
 */
export function shouldCloseInspectionOnWheel(deltaY: number, isInspecting: boolean): boolean {
  return isInspecting && deltaY > 0;
}

/**
 * Touch gesture policy during inspection: a two-finger pinch closes the
 * focused book instead of zooming the shelf. Detecting the pinch at
 * touch-start (two fingers down) is the most reliable exit on mobile — the
 * user does not need to complete a movement for it to register.
 */
export function shouldCloseInspectionOnPinch(touchCount: number, isInspecting: boolean): boolean {
  return isInspecting && touchCount >= 2;
}

export interface ShelfBookActivation {
  selectedIndex: number;
  shouldOpenInspection: boolean;
}

export function resolveBookActivation(
  bookIndex: number,
  selectedIndex: number,
  isInspecting: boolean,
): ShelfBookActivation {
  return {
    selectedIndex: bookIndex,
    shouldOpenInspection: !isInspecting || bookIndex !== selectedIndex,
  };
}

export const CompleteShelfScene: React.FC<CompleteShelfSceneProps> = ({
  shelfItems,
  shelfLevels,
  shelfLayout,
  activeLevelId,
  selectedIndex,
  onSelectIndex,
  onOpenInspection,
  onCloseInspection,
  onMoveBookToShelfLevel,
  onDragStateChange,
  onNavigateLevel,
  isInspecting,
  onSwitchTo2D,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLError, setWebGLError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const panXRef = useRef(0);
  const zoomScaleRef = useRef(1.0);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragDyAccRef = useRef(0);
  const scrollAccRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inspectRotXRef = useRef(0);
  const inspectRotYRef = useRef(INSPECTION_INITIAL_ROTATION_Y);
  const orbitPointerRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const lastInspectingRef = useRef(false);
  const lastSelectedIndexRef = useRef(selectedIndex);
  const inspectionPanelRectRef = useRef<DOMRect | null>(null);
  const lastPanelQueryTimeRef = useRef(0);

  const selectedIndexRef = useRef(selectedIndex);
  const isInspectingRef = useRef(isInspecting);
  const activeLevelIdRef = useRef(activeLevelId);
  const shelfLevelsRef = useRef(shelfLevels);
  const layoutRef = useRef(shelfLayout);
  const bookMeshesByIdRef = useRef(new Map<string, BookMeshGroup>());
  // Latest shelf items (reconciliation reads this without re-running setup).
  const shelfItemsRef = useRef(shelfItems);
  shelfItemsRef.current = shelfItems;
  // Shared handle into the WebGL effect (scene, book list, raycast targets,
  // wake-the-loop) so the reconciliation effect can mutate them incrementally.
  const shelfRuntimeRef = useRef<{
    scene: THREE.Scene | null;
    bookGroups: BookMeshGroup[];
    raycastTargets: THREE.Object3D[];
    requestRender: () => void;
  } | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});

  // Callback refs — keep latest without triggering effect re-runs
  const onSelectIndexRef = useRef(onSelectIndex);
  onSelectIndexRef.current = onSelectIndex;
  const onOpenInspectionRef = useRef(onOpenInspection);
  onOpenInspectionRef.current = onOpenInspection;
  const onCloseInspectionRef = useRef(onCloseInspection);
  onCloseInspectionRef.current = onCloseInspection;
  const onMoveBookToShelfLevelRef = useRef(onMoveBookToShelfLevel);
  onMoveBookToShelfLevelRef.current = onMoveBookToShelfLevel;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;
  const onNavigateLevelRef = useRef(onNavigateLevel);
  onNavigateLevelRef.current = onNavigateLevel;
  const onSwitchTo2DRef = useRef(onSwitchTo2D);
  onSwitchTo2DRef.current = onSwitchTo2D;

  // Multi-touch tracking refs
  const touchStateRef = useRef<{
    lastDist: number | null;
    lastCenter: { x: number; y: number } | null;
    lastSingleTouch: { x: number; y: number } | null;
    touchStartPos: { x: number; y: number } | null;
    touchDragDyAcc: number;
    touchDragBook: {
      book: BookMeshGroup;
      startX: number;
      startY: number;
      moved: boolean;
      targetLevelId: string | null;
    } | null;
  }>({
    lastDist: null,
    lastCenter: null,
    lastSingleTouch: null,
    touchStartPos: null,
    touchDragDyAcc: 0,
    touchDragBook: null,
  });

  selectedIndexRef.current = selectedIndex;
  isInspectingRef.current = isInspecting;
  activeLevelIdRef.current = activeLevelId;
  shelfLevelsRef.current = shelfLevels;
  layoutRef.current = shelfLayout;

  const levelCount = Math.max(1, shelfLevels.length);
  const levelLayoutSignature = shelfLevels.map((level) => `${level.id}:${level.position}`).join('|');
  const contentHeight = Math.max(SHELF_CONTENT_HEIGHT, (levelCount - 1) * SHELF_LEVEL_SPACING + SHELF_CONTENT_HEIGHT);

  useEffect(() => {
    const layoutById = new Map(shelfLayout.map((entry) => [entry.bookId, entry]));
    layoutRef.current = shelfLayout;

    bookMeshesByIdRef.current.forEach((bookMesh) => {
      const entry = layoutById.get(bookMesh.item.id);
      if (!entry) return;
      const position = new THREE.Vector3(entry.x, entry.y, 0);
      bookMesh.setBasePosition(position);
      bookMesh.setFocusPose(
        new THREE.Vector3(entry.x, entry.y, 1.8),
        new THREE.Euler(0, INSPECTION_INITIAL_ROTATION_Y, 0),
        1.14,
      );
    });
  }, [shelfLayout]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || shelfItems.length === 0) return;

    let animationFrameId = 0;
    let resizeFrameId: number | null = null;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    const domElement = canvasRef.current;
    const shelfWidth = shelfWidthFor(shelfItemsRef.current);

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#080B10');

      const width = Math.max(containerRef.current.clientWidth, 1);
      const height = Math.max(containerRef.current.clientHeight, 1);
      const baseCameraDistance = calculateShelfCameraDistance(width, height, shelfWidth, contentHeight);
      let shelfCameraDistance = baseCameraDistance;
      const cameraFar = Math.max(100, baseCameraDistance * 4 + shelfWidth);

      camera = new THREE.PerspectiveCamera(SHELF_CAMERA_FOV, width / height, 0.1, cameraFar);
      camera.position.set(0, contentHeight / 2, baseCameraDistance);
      camera.lookAt(0, contentHeight / 2 - 0.5, 0);

      renderer = new THREE.WebGLRenderer({
        canvas: domElement,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        // No screenshot path depends on the drawing buffer (grep for
        // toDataURL/toBlob confirms only 2D canvases use it), so we can skip
        // the costly buffer preservation.
        preserveDrawingBuffer: false,
      });

      const applyDpr = () => {
        const isMobile = window.innerWidth < 768;
        const maxDpr = isMobile ? 1.5 : 1.5;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
      };

      applyDpr();
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Filmic tone mapping tames the bright foil highlights and adds a
      // natural shoulder to the cloth, so covers read like printed stock.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      // Anisotropic filtering across the whole book texture set (covers,
      // spine, pages and cached cloth) keeps the weave crisp at grazing angles.
      configureTextureAnisotropy(renderer.capabilities.getMaxAnisotropy());

      // Image-based lighting: a warm studio room environment gives the foil a
      // believable metallic response (banded reflections) without relying on
      // flat directional highlights. Intensity is tuned so the foil glints
      // while the high-roughness cloth stays matte. Kept slightly below 0.5
      // for a cozy, dim library mood — the foil still catches the light.
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnvironment = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;
      scene.environmentIntensity = 0.42;
      pmremGenerator.dispose();

      const ambientLight = new THREE.AmbientLight('#FFF8EF', 0.6);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight('#FFF3E0', 1.35);
      mainLight.position.set(5, 8, 7);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      mainLight.shadow.bias = -0.0001;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight('#D4AF37', 0.4);
      fillLight.position.set(-6, 3, 4);
      scene.add(fillLight);

      const shelfGroup = new ShelfMeshGroup({
        width: shelfWidth,
        depth: 3.2,
        thickness: 0.35,
        levelCount,
        levelSpacing: SHELF_LEVEL_SPACING,
        levels: shelfLevels,
        nameplateAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      });
      scene.add(shelfGroup.group);

      const bookGroups: BookMeshGroup[] = [];
      // Flat list of book meshes for cheap non-recursive raycasting (one
      // entry per book surface, excluding the wireframe glow). Rebuilt during
      // reconciliation so hidden/filtered books are never hit-tested.
      const raycastTargets: THREE.Object3D[] = [];

      const createBookMesh = (item: ShelfBookManifestItem, index: number): BookMeshGroup => {
        const layoutById = new Map(layoutRef.current.map((entry) => [entry.bookId, entry]));
        const entry = layoutById.get(item.id);
        const fallbackX = index * (item.thickness + 0.08) - shelfWidth / 2 + item.thickness / 2 + 0.6;
        const position = new THREE.Vector3(entry?.x ?? fallbackX, entry?.y ?? 0.18, 0);
        const bookMesh = new BookMeshGroup(item, position);
        bookMesh.setFocusPose(
          new THREE.Vector3(position.x, position.y, 1.8),
          new THREE.Euler(0, INSPECTION_INITIAL_ROTATION_Y, 0),
          1.14,
        );
        // Wake the render loop when a remote cover texture lands. The arrow
        // defers the `requestRender` read until the callback fires (after the
        // loop is declared below), avoiding a TDZ ReferenceError during the
        // initial book creation pass.
        bookMesh.onSurfaceUpdate = () => requestRender();
        scene.add(bookMesh.group);
        return bookMesh;
      };

      const rebuildRaycastTargets = () => {
        raycastTargets.length = 0;
        bookGroups.forEach((bookMesh) => {
          if (!bookMesh.group.visible) return;
          bookMesh.group.children.forEach((child) => {
            if (child.name !== 'selection-glow') raycastTargets.push(child);
          });
        });
      };

      shelfItemsRef.current.forEach((item, index) => {
        const bookMesh = createBookMesh(item, index);
        bookGroups.push(bookMesh);
        bookMeshesByIdRef.current.set(item.id, bookMesh);
      });
      rebuildRaycastTargets();

      // Frame clock + render loop. Declared before `requestRender` so the
      // initial viewport update can wake the loop without TDZ issues.
      let lastTime = performance.now();
      let lastHoveredMesh: BookMeshGroup | null = null;
      // Declared before `animate` (and therefore before the synchronous
      // `updateViewport()` → `requestRender()` → `animate()` init chain) so
      // the first frame can read it without a TDZ ReferenceError.
      let hoveredMesh: BookMeshGroup | null = null;
      let lastCameraFar = 0;

      // Pause the render loop entirely while the tab is hidden; resume via
      // requestRender() when it becomes visible again.
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
          }
          renderLoopRunning = false;
        } else {
          requestRender();
        }
      };

      const animate = (now: number) => {
        animationFrameId = 0;
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        let booksAnimating = false;
        bookGroups.forEach((bookGroup, index) => {
          bookGroup.setSelected(index === selectedIndexRef.current && isInspectingRef.current);
          bookGroup.update(delta);
          booksAnimating = booksAnimating || bookGroup.isAnimating();
        });

        const selectedBook = bookGroups[selectedIndexRef.current];
        const indexChanged = lastSelectedIndexRef.current !== selectedIndexRef.current;
        const inspectionStarted = !lastInspectingRef.current && isInspectingRef.current;
        lastSelectedIndexRef.current = selectedIndexRef.current;
        lastInspectingRef.current = isInspectingRef.current;

        if (inspectionStarted || indexChanged) {
          inspectRotXRef.current = 0;
          inspectRotYRef.current = INSPECTION_INITIAL_ROTATION_Y;
        }

        if (isInspectingRef.current && selectedBook) {
          selectedBook.setOrbitRotation(inspectRotXRef.current, inspectRotYRef.current);
        } else {
          inspectRotXRef.current = 0;
          inspectRotYRef.current = INSPECTION_INITIAL_ROTATION_Y;
        }

        const targetPosition = isInspectingRef.current && selectedBook ? selectedBook.getFocusPosition() : null;
        const panX = panXRef.current;
        const zoom = zoomScaleRef.current;
        const effectiveCamZ = shelfCameraDistance * zoom;
        const shelfCameraTarget = getShelfCameraVerticalTarget(
          shelfLevelsRef.current,
          activeLevelIdRef.current,
          contentHeight,
        );

        // Keep the book centered in the area NOT covered by the inspection
        // panel (bottom sheet on mobile, right panel on desktop). Without this
        // the book is centered in the full canvas and its top/bottom hide
        // behind the interface.
        let frameOffsetX = 0;
        let frameOffsetY = 0;
        let visibleHeightFraction = 1;
        let visibleWidthFraction = 1;
        if (isInspectingRef.current && targetPosition) {
          const now = performance.now();
          if (now - lastPanelQueryTimeRef.current > 250 || !inspectionPanelRectRef.current) {
            lastPanelQueryTimeRef.current = now;
            const panel = document.querySelector('[data-testid="book-inspection-panel"]');
            inspectionPanelRectRef.current = panel ? panel.getBoundingClientRect() : null;
          }
          const containerRect = containerRef.current?.getBoundingClientRect();
          const panelRect = inspectionPanelRectRef.current;
          if (containerRect && panelRect && containerRect.width > 0 && containerRect.height > 0) {
            if (window.innerWidth < 768) {
              // Mobile: panel covers the bottom, visible area is the top strip.
              const visibleBottom = Math.min(panelRect.top - containerRect.top, containerRect.height);
              visibleHeightFraction = Math.max(visibleBottom / containerRect.height, 0.2);
              frameOffsetY = (visibleBottom / 2 - containerRect.height / 2) / containerRect.height;
            } else {
              // Desktop: panel covers the right, visible area is the left strip.
              const visibleRight = Math.min(panelRect.left - containerRect.left, containerRect.width);
              visibleWidthFraction = Math.max(visibleRight / containerRect.width, 0.2);
              frameOffsetX = (visibleRight / 2 - containerRect.width / 2) / containerRect.width;
            }
          }
        }

        // Frame the whole book during inspection: the book is scaled by its
        // focus scale, so the camera distance must fit the scaled height (and
        // width on narrow screens) inside the visible area instead of using a
        // fixed offset.
        const halfFovTan = Math.tan(THREE.MathUtils.degToRad(SHELF_CAMERA_FOV / 2));
        const inspectionDistance = targetPosition && selectedBook
          ? Math.max(
              SHELF_CAMERA_MIN_DISTANCE,
              (selectedBook.item.height * 1.14 * 1.25) / (2 * halfFovTan * visibleHeightFraction),
              (selectedBook.item.width * 1.14 * 1.25) / (2 * halfFovTan * Math.max(camera.aspect, 0.1) * visibleWidthFraction),
            )
          : 0;

        const worldOffsetX = frameOffsetX * 2 * inspectionDistance * halfFovTan * Math.max(camera.aspect, 0.1);
        const worldOffsetY = frameOffsetY * 2 * inspectionDistance * halfFovTan;

        const targetCamX = (targetPosition ? targetPosition.x + panX : panX) + worldOffsetX;
        const targetCamY = (targetPosition
          ? targetPosition.y + selectedBook!.item.height * 1.14 / 2 + 0.15
          : shelfCameraTarget.cameraY) + worldOffsetY;
        const targetCamZ = targetPosition ? targetPosition.z + inspectionDistance : effectiveCamZ;
        const lookAtX = (targetPosition ? targetPosition.x : panX) + worldOffsetX;
        const lookAtY = (targetPosition
          ? targetPosition.y + selectedBook!.item.height * 1.14 / 2
          : shelfCameraTarget.lookAtY) + worldOffsetY;
        const lookAtZ = targetPosition?.z ?? 0;

        // Camera is considered settled once it is within a hair of its target.
        // The epsilon is intentionally loose (0.01): it stops continuous
        // rendering ~1.5s sooner after every interaction while the remaining
        // sub-pixel error is invisible.
        const cameraSettled =
          Math.abs(camera.position.x - targetCamX) < 0.01
          && Math.abs(camera.position.y - targetCamY) < 0.01
          && Math.abs(camera.position.z - targetCamZ) < 0.01;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 4);
        camera.lookAt(lookAtX, lookAtY, lookAtZ);

        const nextCameraFar = Math.max(effectiveCamZ * 8, 80);
        if (Math.abs(nextCameraFar - lastCameraFar) > 0.01) {
          lastCameraFar = nextCameraFar;
          camera.far = nextCameraFar;
          camera.updateProjectionMatrix();
        }

        if (hoveredMesh !== lastHoveredMesh) {
          lastHoveredMesh = hoveredMesh;
          needsRender = true;
        }

        // Skip rendering while everything is stationary (idle scene).
        const shouldRender = needsRender || !cameraSettled || booksAnimating;
        if (shouldRender) {
          needsRender = false;
          renderer.render(scene, camera);
        }

        // Render-on-demand: when the scene is fully settled and nothing is
        // animating, cancel the loop and sleep until requestRender() wakes it.
        if (needsRender || !cameraSettled || booksAnimating) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          renderLoopRunning = false;
          animationFrameId = 0;
        }
      };

      let needsRender = true;
      // True while a rAF frame is scheduled (or running). The loop sleeps
      // when the scene is idle and `requestRender()` wakes it.
      let renderLoopRunning = false;

      const requestRender = () => {
        needsRender = true;
        if (!renderLoopRunning && !document.hidden) {
          renderLoopRunning = true;
          lastTime = performance.now();
          animate(performance.now());
        }
      };
      requestRenderRef.current = requestRender;

      shelfRuntimeRef.current = {
        scene,
        bookGroups,
        raycastTargets,
        requestRender,
      };

      const updateViewport = () => {
        if (!containerRef.current) return;
        const viewportWidth = containerRef.current.clientWidth;
        const viewportHeight = containerRef.current.clientHeight;
        if (viewportWidth <= 0 || viewportHeight <= 0) return;

        applyDpr();
        camera.aspect = viewportWidth / viewportHeight;
        shelfCameraDistance = calculateShelfCameraDistance(viewportWidth, viewportHeight, shelfWidth, contentHeight);
        camera.far = Math.max(camera.far, shelfCameraDistance * 4 + shelfWidth);
        camera.updateProjectionMatrix();
        renderer.setSize(viewportWidth, viewportHeight, false);
        requestRender();
      };

      const scheduleViewportUpdate = () => {
        if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
        resizeFrameId = requestAnimationFrame(() => {
          resizeFrameId = null;
          updateViewport();
        });
      };

      const resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleViewportUpdate)
        : null;
      resizeObserver?.observe(containerRef.current);
      window.addEventListener('resize', scheduleViewportUpdate);
      window.addEventListener('orientationchange', scheduleViewportUpdate);
      updateViewport();

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let lastRaycastTime = 0;
      let dragState: {
        book: BookMeshGroup;
        pointerId: number;
        startX: number;
        startY: number;
        moved: boolean;
        targetLevelId: string | null;
      } | null = null;

      // Set while inspecting when the pointer lands on a DIFFERENT book: a tap
      // switches inspection to it, while a drag cancels the tap and orbits.
      let inspectionClickRef: {
        book: BookMeshGroup;
        pointerId: number;
        startX: number;
        startY: number;
      } | null = null;

      const getIntersectedBookFromCoords = (clientX: number, clientY: number): BookMeshGroup | null => {
        const rect = domElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        // Keep world matrices fresh (books lerp between frames) so the ray
        // test is not stale; then hit-test ONLY the pre-collected book meshes
        // (no planks, brackets, wall or glow — 4 meshes per visible book).
        scene.updateMatrixWorld();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastTargets, false);

        for (const intersect of intersects) {
          let object: THREE.Object3D | null = intersect.object;
          while (object) {
            if (object.userData?.instance instanceof BookMeshGroup) return object.userData.instance;
            object = object.parent;
          }
        }
        return null;
      };

      const getIntersectedBook = (event: PointerEvent): BookMeshGroup | null =>
        getIntersectedBookFromCoords(event.clientX, event.clientY);

      const getTargetLevelFromCoords = (clientY: number) =>
        getShelfLevelFromPointer(clientY, domElement.getBoundingClientRect(), shelfLevelsRef.current);

      const getTargetLevel = (event: PointerEvent) => getTargetLevelFromCoords(event.clientY);

      const clearDragState = () => {
        if (!dragState) return;
        dragState.book.clearDragPreview();
        dragState = null;
        onDragStateChangeRef.current?.(null, null);
        domElement.style.cursor = 'default';
      };

      // Pointer event handlers (for mouse / desktop)
      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;

        // A click candidate that moves becomes an orbit drag instead.
        if (
          inspectionClickRef
          && inspectionClickRef.pointerId === event.pointerId
          && Math.hypot(event.clientX - inspectionClickRef.startX, event.clientY - inspectionClickRef.startY) > 6
        ) {
          inspectionClickRef = null;
          orbitPointerRef.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
          domElement.style.cursor = 'grabbing';
          return;
        }

        if (orbitPointerRef.current && orbitPointerRef.current.pointerId === event.pointerId) {
          const dx = event.clientX - orbitPointerRef.current.lastX;
          const dy = event.clientY - orbitPointerRef.current.lastY;
          const orbitSensitivity = 0.01;
          inspectRotYRef.current += dx * orbitSensitivity;
          inspectRotXRef.current = THREE.MathUtils.clamp(
            inspectRotXRef.current + dy * orbitSensitivity,
            -Math.PI / 3,
            Math.PI / 3,
          );
          orbitPointerRef.current.lastX = event.clientX;
          orbitPointerRef.current.lastY = event.clientY;
          domElement.style.cursor = 'grabbing';
          requestRender();
          return;
        }

        if (dragState) {
          const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
          if (!dragState.moved && distance < 6) return;

          dragState.moved = true;
          const targetLevel = getTargetLevel(event);
          dragState.targetLevelId = targetLevel?.id ?? null;
          if (targetLevel) {
            const targetIndex = shelfLevelsRef.current.findIndex((level) => level.id === targetLevel.id);
            dragState.book.setDragPreview(new THREE.Vector3(
              dragState.book.getBasePosition().x,
              targetIndex * SHELF_LEVEL_SPACING + 0.18,
              0.55,
            ));
          }
          onDragStateChangeRef.current?.(dragState.book.item.id, dragState.targetLevelId);
          domElement.style.cursor = 'grabbing';
          requestRender();
          return;
        }

        // While inspecting, hover raycasting is skipped (pointerdown already
        // does its own hit-test to switch books); only the visual lift is
        // dropped — clicking another book still switches inspection.
        if (isInspectingRef.current) {
          if (hoveredMesh) {
            hoveredMesh.setHovered(false);
            hoveredMesh = null;
            requestRender();
          }
          domElement.style.cursor = 'default';
          return;
        }

        const now = performance.now();
        if (now - lastRaycastTime >= 50) {
          lastRaycastTime = now;
          const book = getIntersectedBook(event);
          if (book !== hoveredMesh) {
            hoveredMesh?.setHovered(false);
            hoveredMesh = book;
            hoveredMesh?.setHovered(true);
            requestRender();
          }
        }

        if (hoveredMesh) {
          domElement.style.cursor = 'grab';
          return;
        }

        if (panStartRef.current) {
          const dx = event.clientX - panStartRef.current.x;
          const dy = event.clientY - panStartRef.current.y;
          panXRef.current = THREE.MathUtils.clamp(
            panXRef.current - dx * 0.006,
            -shelfWidth,
            shelfWidth,
          );
          dragDyAccRef.current += dy;
          // Update origin each frame so dx/dy are per-frame deltas, not cumulative
          panStartRef.current = { x: event.clientX, y: event.clientY };
          domElement.style.cursor = 'grabbing';
          requestRender();
        } else {
          domElement.style.cursor = 'default';
        }

      };

      const handlePointerDown = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || event.button !== 0) return;

        if (isInspectingRef.current) {
          // Allow clicking another book to switch inspection to it. A tap on a
          // different book records a click candidate; a drag cancels it and orbits.
          const book = getIntersectedBook(event);
          const selectedBook = bookGroups[selectedIndexRef.current];
          if (book && book !== selectedBook) {
            inspectionClickRef = {
              book,
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
            };
            domElement.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
          }
          orbitPointerRef.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
          domElement.setPointerCapture(event.pointerId);
          event.preventDefault();
          requestRender();
          return;
        }

        const book = getIntersectedBook(event);
        if (!book) {
          panStartRef.current = { x: event.clientX, y: event.clientY };
          dragDyAccRef.current = 0;
          domElement.setPointerCapture(event.pointerId);
          event.preventDefault();
          return;
        }

        dragState = {
          book,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          targetLevelId: null,
        };
        domElement.setPointerCapture(event.pointerId);
        event.preventDefault();
        requestRender();
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;

        // A clean tap on a different book while inspecting switches to it.
        if (inspectionClickRef && inspectionClickRef.pointerId === event.pointerId) {
          const clickedBook = inspectionClickRef.book;
          inspectionClickRef = null;
          if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
          const bookIndex = bookGroups.findIndex((candidate) => candidate === clickedBook);
          if (bookIndex !== -1) {
            onSelectIndexRef.current(bookIndex);
            onOpenInspectionRef.current(bookIndex);
          }
          requestRender();
          return;
        }

        if (orbitPointerRef.current && orbitPointerRef.current.pointerId === event.pointerId) {
          orbitPointerRef.current = null;
          if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
          domElement.style.cursor = 'default';
          requestRender();
          return;
        }

        if (panStartRef.current && !dragState && onNavigateLevelRef.current && shelfLevelsRef.current.length > 0) {
          const absDy = Math.abs(dragDyAccRef.current);
          const absDx = Math.abs(event.clientX - panStartRef.current.x);
          if (absDy > DRAG_LEVEL_THRESHOLD && absDx < DRAG_PAN_HORIZONTAL_THRESHOLD + absDy * 0.5) {
            const direction = dragDyAccRef.current < 0 ? 1 : -1;
            const activeIndex = shelfLevelsRef.current.findIndex((level) => level.id === activeLevelIdRef.current);
            const targetIndex = THREE.MathUtils.clamp(activeIndex + direction, 0, shelfLevelsRef.current.length - 1);
            if (targetIndex !== activeIndex) {
              onNavigateLevelRef.current(shelfLevelsRef.current[targetIndex].id);
            }
          }
          panStartRef.current = null;
          dragDyAccRef.current = 0;
          if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
          domElement.style.cursor = 'default';
          requestRender();
          return;
        }

        panStartRef.current = null;
        dragDyAccRef.current = 0;

        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const completedDrag = dragState.moved && dragState.targetLevelId;
        const book = dragState.book;
        const bookIndex = bookGroups.findIndex((candidate) => candidate === book);

        if (completedDrag) {
          onMoveBookToShelfLevelRef.current(book.item.id, dragState.targetLevelId!);
        } else if (bookIndex !== -1) {
          const activation = resolveBookActivation(bookIndex, selectedIndexRef.current, isInspectingRef.current);
          onSelectIndexRef.current(activation.selectedIndex);
          if (activation.shouldOpenInspection) onOpenInspectionRef.current(activation.selectedIndex);
        }

        clearDragState();
        if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
        requestRender();
      };

      const handlePointerCancel = (event?: PointerEvent) => {
        if (event && event.pointerType === 'touch') return;
        inspectionClickRef = null;
        orbitPointerRef.current = null;
        clearDragState();
        requestRender();
      };

      // Dedicated Touch Gesture Handlers (1 finger orbit/pan/nav, 2 fingers pinch-to-zoom & pan, 3+ fingers graceful filtering)
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 1) {
          const t0 = touches[0];
          const x = t0.clientX;
          const y = t0.clientY;

          touchStateRef.current.lastSingleTouch = { x, y };
          touchStateRef.current.lastDist = null;
          touchStateRef.current.lastCenter = null;
          touchStateRef.current.touchStartPos = { x, y };
          touchStateRef.current.touchDragDyAcc = 0;

          const book = getIntersectedBookFromCoords(x, y);

          if (isInspectingRef.current) {
            // Allow tapping another book to switch inspection to it. A tap
            // candidate is stored; movement beyond the threshold cancels it.
            const selectedBook = bookGroups[selectedIndexRef.current];
            touchStateRef.current.touchDragBook = book && book !== selectedBook
              ? {
                  book,
                  startX: x,
                  startY: y,
                  moved: false,
                  targetLevelId: null,
                }
              : null;
          } else if (book) {
            touchStateRef.current.touchDragBook = {
              book,
              startX: x,
              startY: y,
              moved: false,
              targetLevelId: null,
            };
          } else {
            touchStateRef.current.touchDragBook = null;
          }
        } else if (touches.length === 2) {
          // During inspection a two-finger pinch closes the focused book
          // instead of zooming the shelf — the reliable mobile exit gesture.
          if (shouldCloseInspectionOnPinch(touches.length, isInspectingRef.current)) {
            if (touchStateRef.current.touchDragBook) {
              touchStateRef.current.touchDragBook.book.clearDragPreview();
              touchStateRef.current.touchDragBook = null;
              onDragStateChangeRef.current?.(null, null);
            }
            touchStateRef.current.touchStartPos = null;
            touchStateRef.current.touchDragDyAcc = 0;
            touchStateRef.current.lastSingleTouch = null;
            touchStateRef.current.lastDist = null;
            touchStateRef.current.lastCenter = null;
            onCloseInspectionRef.current?.();
            requestRender();
            return;
          }
          if (touchStateRef.current.touchDragBook) {
            touchStateRef.current.touchDragBook.book.clearDragPreview();
            touchStateRef.current.touchDragBook = null;
            onDragStateChangeRef.current?.(null, null);
          }
          touchStateRef.current.touchStartPos = null;
          touchStateRef.current.touchDragDyAcc = 0;
          touchStateRef.current.lastSingleTouch = null;

          const t0 = touches[0];
          const t1 = touches[1];
          const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          const center = {
            x: (t0.clientX + t1.clientX) / 2,
            y: (t0.clientY + t1.clientY) / 2,
          };
          touchStateRef.current.lastDist = dist;
          touchStateRef.current.lastCenter = center;
          requestRender();
        } else {
          // 3+ fingers: handle gracefully without camera jitter or state corruption
          if (touchStateRef.current.touchDragBook) {
            touchStateRef.current.touchDragBook.book.clearDragPreview();
            touchStateRef.current.touchDragBook = null;
            onDragStateChangeRef.current?.(null, null);
          }
          touchStateRef.current.lastDist = null;
          touchStateRef.current.lastCenter = null;
          touchStateRef.current.lastSingleTouch = null;
          touchStateRef.current.touchStartPos = null;
          touchStateRef.current.touchDragDyAcc = 0;
          requestRender();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 1) {
          const t0 = touches[0];
          const x = t0.clientX;
          const y = t0.clientY;

          const last = touchStateRef.current.lastSingleTouch;
          const dx = last ? x - last.x : 0;
          const dy = last ? y - last.y : 0;
          touchStateRef.current.lastSingleTouch = { x, y };

          if (isInspectingRef.current) {
            // Movement beyond the tap threshold cancels the tap candidate so
            // the gesture becomes an orbit instead of switching books.
            if (touchStateRef.current.touchDragBook) {
              const totalDist = Math.hypot(x - touchStateRef.current.touchDragBook.startX, y - touchStateRef.current.touchDragBook.startY);
              if (totalDist >= 6) {
                touchStateRef.current.touchDragBook.moved = true;
              }
            }
            const orbitSensitivity = 0.01;
            inspectRotYRef.current += dx * orbitSensitivity;
            inspectRotXRef.current = THREE.MathUtils.clamp(
              inspectRotXRef.current + dy * orbitSensitivity,
              -Math.PI / 3,
              Math.PI / 3,
            );
            requestRender();
          } else if (touchStateRef.current.touchDragBook) {
            const dragBook = touchStateRef.current.touchDragBook;
            const totalDist = Math.hypot(x - dragBook.startX, y - dragBook.startY);
            if (!dragBook.moved && totalDist >= 6) {
              dragBook.moved = true;
            }
            if (dragBook.moved) {
              const targetLevel = getTargetLevelFromCoords(y);
              dragBook.targetLevelId = targetLevel?.id ?? null;
              if (targetLevel) {
                const targetIndex = shelfLevelsRef.current.findIndex((l) => l.id === targetLevel.id);
                dragBook.book.setDragPreview(
                  new THREE.Vector3(
                    dragBook.book.getBasePosition().x,
                    targetIndex * SHELF_LEVEL_SPACING + 0.18,
                    0.55,
                  )
                );
              }
              onDragStateChangeRef.current?.(dragBook.book.item.id, dragBook.targetLevelId);
              requestRender();
            }
          } else {
            panXRef.current = THREE.MathUtils.clamp(
              panXRef.current - dx * 0.006,
              -shelfWidth,
              shelfWidth,
            );
            touchStateRef.current.touchDragDyAcc += dy;
            requestRender();
          }
        } else if (touches.length === 2) {
          const t0 = touches[0];
          const t1 = touches[1];
          const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          const center = {
            x: (t0.clientX + t1.clientX) / 2,
            y: (t0.clientY + t1.clientY) / 2,
          };

          if (touchStateRef.current.lastDist !== null && touchStateRef.current.lastCenter !== null) {
            const distDelta = dist - touchStateRef.current.lastDist;
            zoomScaleRef.current = THREE.MathUtils.clamp(
              zoomScaleRef.current - distDelta * 0.005,
              ZOOM_MIN,
              ZOOM_MAX,
            );

            const centerDx = center.x - touchStateRef.current.lastCenter.x;
            panXRef.current = THREE.MathUtils.clamp(
              panXRef.current - centerDx * 0.006,
              -shelfWidth,
              shelfWidth,
            );
            requestRender();
          }

          touchStateRef.current.lastDist = dist;
          touchStateRef.current.lastCenter = center;
        } else {
          // 3+ fingers: ignore movements to avoid jitter
          touchStateRef.current.lastDist = null;
          touchStateRef.current.lastCenter = null;
          touchStateRef.current.lastSingleTouch = null;
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 0) {
          const dragBook = touchStateRef.current.touchDragBook;
          const startPos = touchStateRef.current.touchStartPos;
          const dragDyAcc = touchStateRef.current.touchDragDyAcc;

          if (dragBook) {
            const completedDrag = dragBook.moved && dragBook.targetLevelId;
            const bookIndex = bookGroups.findIndex((candidate) => candidate === dragBook.book);

            if (completedDrag) {
              onMoveBookToShelfLevelRef.current(dragBook.book.item.id, dragBook.targetLevelId!);
            } else if (bookIndex !== -1 && (!isInspectingRef.current || !dragBook.moved)) {
              const activation = resolveBookActivation(bookIndex, selectedIndexRef.current, isInspectingRef.current);
              onSelectIndexRef.current(activation.selectedIndex);
              if (activation.shouldOpenInspection) onOpenInspectionRef.current(activation.selectedIndex);
            }
            dragBook.book.clearDragPreview();
            touchStateRef.current.touchDragBook = null;
            onDragStateChangeRef.current?.(null, null);
          } else if (startPos && !isInspectingRef.current && onNavigateLevelRef.current && shelfLevelsRef.current.length > 0) {
            const absDy = Math.abs(dragDyAcc);
            if (absDy > DRAG_LEVEL_THRESHOLD) {
              const direction = dragDyAcc < 0 ? 1 : -1;
              const activeIndex = shelfLevelsRef.current.findIndex((level) => level.id === activeLevelIdRef.current);
              const targetIndex = THREE.MathUtils.clamp(activeIndex + direction, 0, shelfLevelsRef.current.length - 1);
              if (targetIndex !== activeIndex) {
                onNavigateLevelRef.current(shelfLevelsRef.current[targetIndex].id);
              }
            }
          }

          touchStateRef.current.lastDist = null;
          touchStateRef.current.lastCenter = null;
          touchStateRef.current.lastSingleTouch = null;
          touchStateRef.current.touchStartPos = null;
          touchStateRef.current.touchDragDyAcc = 0;
          requestRender();
        } else if (touches.length === 1) {
          const t0 = touches[0];
          touchStateRef.current.lastSingleTouch = { x: t0.clientX, y: t0.clientY };
          touchStateRef.current.lastDist = null;
          touchStateRef.current.lastCenter = null;
          touchStateRef.current.touchStartPos = null;
          touchStateRef.current.touchDragDyAcc = 0;
        } else if (touches.length === 2) {
          const t0 = touches[0];
          const t1 = touches[1];
          touchStateRef.current.lastDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          touchStateRef.current.lastCenter = {
            x: (t0.clientX + t1.clientX) / 2,
            y: (t0.clientY + t1.clientY) / 2,
          };
          touchStateRef.current.lastSingleTouch = null;
        }
      };

      const handleTouchCancel = (e: TouchEvent) => {
        e.preventDefault();
        if (touchStateRef.current.touchDragBook) {
          touchStateRef.current.touchDragBook.book.clearDragPreview();
          touchStateRef.current.touchDragBook = null;
          onDragStateChangeRef.current?.(null, null);
        }
        touchStateRef.current.lastDist = null;
        touchStateRef.current.lastCenter = null;
        touchStateRef.current.lastSingleTouch = null;
        touchStateRef.current.touchStartPos = null;
        touchStateRef.current.touchDragDyAcc = 0;
        requestRender();
      };

      const SCROLL_LEVEL_THRESHOLD = 80;

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        // During inspection: scroll down closes the focused book (the exit
        // gesture); scroll up is deliberately ignored so it never fights the
        // closing gesture or moves the shelf behind the book.
        if (shouldCloseInspectionOnWheel(event.deltaY, isInspectingRef.current)) {
          onCloseInspectionRef.current?.();
          requestRender();
          return;
        }
        if (isInspectingRef.current) return;
        if (event.ctrlKey || event.metaKey) {
          zoomScaleRef.current = THREE.MathUtils.clamp(
            zoomScaleRef.current + event.deltaY * 0.002,
            ZOOM_MIN,
            ZOOM_MAX,
          );
          requestRender();
          return;
        }
        if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          const panDelta = (event.deltaY || event.deltaX) * 0.004;
          panXRef.current = THREE.MathUtils.clamp(
            panXRef.current - panDelta,
            -shelfWidth,
            shelfWidth,
          );
          requestRender();
          return;
        }
        if (!onNavigateLevelRef.current || shelfLevelsRef.current.length < 2) return;
        scrollAccRef.current += event.deltaY;
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => { scrollAccRef.current = 0; }, 400);
        if (Math.abs(scrollAccRef.current) < SCROLL_LEVEL_THRESHOLD) return;
        const direction = scrollAccRef.current < 0 ? 1 : -1;
        scrollAccRef.current %= SCROLL_LEVEL_THRESHOLD;
        const activeIndex = shelfLevelsRef.current.findIndex((level) => level.id === activeLevelIdRef.current);
        const targetIndex = THREE.MathUtils.clamp(activeIndex + direction, 0, shelfLevelsRef.current.length - 1);
        if (targetIndex !== activeIndex) {
          onNavigateLevelRef.current(shelfLevelsRef.current[targetIndex].id);
        }
      };

      // WebGL Resilience Handlers (no PII / sensitive data)
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
        setWebGLError(true);
        console.warn('[CompleteShelfScene] WebGL context lost', {
          timestamp: new Date().toISOString(),
          event: 'webglcontextlost',
          component: 'CompleteShelfScene',
        });
      };

      const handleContextRestored = () => {
        console.info('[CompleteShelfScene] WebGL context restored', {
          timestamp: new Date().toISOString(),
          event: 'webglcontextrestored',
          component: 'CompleteShelfScene',
        });
        setWebGLError(false);
        setRetryCount((c) => c + 1);
      };

      domElement.addEventListener('webglcontextlost', handleContextLost, false);
      domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

      domElement.addEventListener('pointermove', handlePointerMove);
      domElement.addEventListener('pointerdown', handlePointerDown);
      domElement.addEventListener('pointerup', handlePointerUp);
      domElement.addEventListener('pointercancel', handlePointerCancel);

      domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
      domElement.addEventListener('touchcancel', handleTouchCancel, { passive: false });

      domElement.addEventListener('wheel', handleWheel, { passive: false });
      // Same closure instance for add/remove — a fresh arrow here would leak
      // the whole scene (~300MB of canvas textures) on every navigation.
      const handleBlur = () => handlePointerCancel();
      window.addEventListener('blur', handleBlur);


      requestRender();
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('resize', scheduleViewportUpdate);
        window.removeEventListener('orientationchange', scheduleViewportUpdate);

        domElement.removeEventListener('webglcontextlost', handleContextLost);
        domElement.removeEventListener('webglcontextrestored', handleContextRestored);

        domElement.removeEventListener('pointermove', handlePointerMove);
        domElement.removeEventListener('pointerdown', handlePointerDown);
        domElement.removeEventListener('pointerup', handlePointerUp);
        domElement.removeEventListener('pointercancel', handlePointerCancel);

        domElement.removeEventListener('touchstart', handleTouchStart);
        domElement.removeEventListener('touchmove', handleTouchMove);
        domElement.removeEventListener('touchend', handleTouchEnd);
        domElement.removeEventListener('touchcancel', handleTouchCancel);

        domElement.removeEventListener('wheel', handleWheel);
        resizeObserver?.disconnect();
        if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
        cancelAnimationFrame(animationFrameId);
        bookGroups.forEach((book) => book.dispose());
        bookMeshesByIdRef.current.clear();
        shelfGroup.dispose();
        // The PMREM environment texture is owned by this effect — release it
        // so the GPU memory is reclaimed with the scene.
        scene.environment?.dispose();
        scene.environment = null;
        renderer.dispose();
        shelfRuntimeRef.current = null;
      };
    } catch (error) {
      console.warn('[CompleteShelfScene] WebGL initialization failed', {
        timestamp: new Date().toISOString(),
        event: 'webgl_init_error',
        component: 'CompleteShelfScene',
        error: error instanceof Error ? error.message : String(error),
      });
      setWebGLError(true);
    }
  }, [
    contentHeight,
    levelCount,
    levelLayoutSignature,
    retryCount,
  ]);

  // Wake the render loop when interaction state changes from outside the
  // scene (selection, inspection open/close, level navigation). The loop
  // sleeps when idle, so props alone would otherwise leave it frozen.
  useEffect(() => {
    requestRenderRef.current();
  }, [selectedIndex, isInspecting, activeLevelId]);

  // Incremental reconciliation: filtering/editing shelf items must NOT rebuild
  // the whole scene (dispose + ~240 procedural canvases ≈ 1.5–3s of jank).
  // Existing books are reused and only hidden when filtered out; new ids get
  // created; content edits regenerate only that book's surfaces.
  useEffect(() => {
    const runtime = shelfRuntimeRef.current;
    if (!runtime || runtime.scene === null) return;
    const { scene, bookGroups, raycastTargets, requestRender } = runtime;
    const items = shelfItemsRef.current;

    const seen = new Set<string>();
    items.forEach((item, index) => {
      seen.add(item.id);
      let bookMesh = bookMeshesByIdRef.current.get(item.id);
      if (!bookMesh) {
        bookMesh = createBookMeshFromRuntime(item, index);
        bookGroups.push(bookMesh);
        bookMeshesByIdRef.current.set(item.id, bookMesh);
      } else {
        bookMesh.group.visible = true;
        bookMesh.updateItem(item);
      }
    });

    // Filtered-out books are hidden (not disposed — re-selecting the filter
    // brings them back instantly). Real removals are reclaimed in the main
    // effect's cleanup on unmount/rebuild.
    bookGroups.forEach((bookMesh) => {
      if (!seen.has(bookMesh.item.id)) bookMesh.group.visible = false;
    });

    // Keep the selection/drag/inspection index mapping in sync with the
    // visible order of `shelfItems`.
    bookGroups.sort((a, b) => {
      const ia = items.findIndex((item) => item.id === a.item.id);
      const ib = items.findIndex((item) => item.id === b.item.id);
      return ia - ib;
    });

    // Rebuild the raycast list so hidden books are never hit-tested.
    raycastTargets.length = 0;
    bookGroups.forEach((bookMesh) => {
      if (!bookMesh.group.visible) return;
      bookMesh.group.children.forEach((child) => {
        if (child.name !== 'selection-glow') raycastTargets.push(child);
      });
    });

    requestRender();

    // Helper to create a book for reconciliation (shares the runtime closure
    // captured above — created lazily inside this effect only).
    function createBookMeshFromRuntime(item: ShelfBookManifestItem, index: number): BookMeshGroup {
      const layoutById = new Map(layoutRef.current.map((entry) => [entry.bookId, entry]));
      const entry = layoutById.get(item.id);
      const fallbackX = index * (item.thickness + 0.08) - shelfWidthFor(items) / 2 + item.thickness / 2 + 0.6;
      const position = new THREE.Vector3(entry?.x ?? fallbackX, entry?.y ?? 0.18, 0);
      const bookMesh = new BookMeshGroup(item, position);
      bookMesh.setFocusPose(
        new THREE.Vector3(position.x, position.y, 1.8),
        new THREE.Euler(0, INSPECTION_INITIAL_ROTATION_Y, 0),
        1.14,
      );
      bookMesh.onSurfaceUpdate = requestRender;
      scene.add(bookMesh.group);
      return bookMesh;
    }
  }, [shelfItems]);

  const handleRetry = () => {
    setWebGLError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full flex-1 select-none overflow-hidden bg-[#080B10]">
      <canvas ref={canvasRef} className={`block h-full w-full touch-none ${webGLError ? 'hidden' : ''}`} />
      {webGLError && (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-[#1A1817]/95 p-6 text-center text-[#F3D274] z-50">
          <h3 className="mb-2 font-serif text-lg font-bold">Visualização 3D Indisponível</h3>
          <p className="mb-6 max-w-md text-xs text-[#A39281]">
            O contexto WebGL foi perdido ou o navegador encontrou um problema ao renderizar a estante 3D.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded border border-[#F3D274]/40 bg-[#F3D274]/10 px-4 py-2 text-xs font-medium text-[#F3D274] transition hover:bg-[#F3D274]/20 active:scale-95"
            >
              Tentar Novamente
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSwitchTo2D) {
                  onSwitchTo2D();
                } else {
                  onOpenInspection(selectedIndex);
                }
              }}
              className="rounded border border-[#A39281]/40 bg-[#2A2421] px-4 py-2 text-xs font-medium text-[#E6D5B8] transition hover:bg-[#3A322C] active:scale-95"
            >
              Alternar para Modo 2D
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export function calculateTouchDistance(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number }
): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

export function calculateTouchCenter(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number }
): { x: number; y: number } {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

export function clampZoomScale(
  currentZoom: number,
  ratio: number,
  minZoom: number = 0.4,
  maxZoom: number = 3.0
): number {
  if (Number.isNaN(ratio) || !Number.isFinite(ratio)) return currentZoom;
  const target = currentZoom * ratio;
  if (Number.isNaN(target) || !Number.isFinite(target)) return currentZoom;
  return THREE.MathUtils.clamp(target, minZoom, maxZoom);
}

export default CompleteShelfScene;
