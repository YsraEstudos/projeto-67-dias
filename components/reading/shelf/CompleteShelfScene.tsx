import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Book, ReadingShelfLevel } from '../../../types';
import { ShelfLayoutEntry, SHELF_LEVEL_SPACING } from '../../../utils/readingShelfLayout';
import { BookMeshGroup } from './BookMesh';
import { ShelfMeshGroup } from './ShelfMesh';
import { ShelfBookManifestItem } from './mintManifest';

const SHELF_CAMERA_FOV = 38;
const SHELF_CAMERA_MIN_DISTANCE = 8.5;
const SHELF_CONTENT_HEIGHT = 4.2;

export function calculateShelfCameraDistance(
  viewportWidth: number,
  viewportHeight: number,
  shelfWidth: number,
  contentHeight = SHELF_CONTENT_HEIGHT,
): number {
  const safeWidth = Math.max(viewportWidth, 1);
  const safeHeight = Math.max(viewportHeight, 1);
  const aspect = safeWidth / safeHeight;
  const halfFovRadians = THREE.MathUtils.degToRad(SHELF_CAMERA_FOV / 2);
  const horizontalDistance = (shelfWidth * 1.12) / (2 * Math.tan(halfFovRadians) * Math.max(aspect, 0.1));
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
  onMoveBookToShelfLevel: (bookId: string, shelfLevelId: string, position?: number) => void;
  onDragStateChange?: (bookId: string | null, shelfLevelId: string | null) => void;
  onNavigateLevel?: (levelId: string) => void;
  isInspecting: boolean;
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
  onMoveBookToShelfLevel,
  onDragStateChange,
  onNavigateLevel,
  isInspecting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLError, setWebGLError] = useState(false);

  const panXRef = useRef(0);
  const zoomScaleRef = useRef(1.0);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragDyAccRef = useRef(0);
  const scrollAccRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inspectRotXRef = useRef(0);
  const inspectRotYRef = useRef(Math.PI / 2);
  const orbitPointerRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const lastInspectingRef = useRef(false);
  const lastSelectedIndexRef = useRef(selectedIndex);

  const selectedIndexRef = useRef(selectedIndex);
  const isInspectingRef = useRef(isInspecting);
  const activeLevelIdRef = useRef(activeLevelId);
  const shelfLevelsRef = useRef(shelfLevels);
  const layoutRef = useRef(shelfLayout);
  const bookMeshesByIdRef = useRef(new Map<string, BookMeshGroup>());

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
        new THREE.Euler(0, -Math.PI / 2, 0),
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
    const shelfWidth = Math.max(
      12,
      shelfItems.reduce((total, item) => total + item.thickness + 0.08, 0) + 1.2,
    );

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
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const ambientLight = new THREE.AmbientLight('#FFF8EF', 0.85);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight('#FFF3E0', 1.8);
      mainLight.position.set(5, 8, 7);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.bias = -0.0001;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight('#D4AF37', 0.5);
      fillLight.position.set(-6, 3, 4);
      scene.add(fillLight);

      const shelfGroup = new ShelfMeshGroup({
        width: shelfWidth,
        depth: 3.2,
        thickness: 0.35,
        levelCount,
        levelSpacing: SHELF_LEVEL_SPACING,
      });
      scene.add(shelfGroup.group);

      const layoutById = new Map(layoutRef.current.map((entry) => [entry.bookId, entry]));
      const bookGroups: BookMeshGroup[] = [];
      shelfItems.forEach((item, index) => {
        const entry = layoutById.get(item.id);
        const fallbackX = index * (item.thickness + 0.08) - shelfWidth / 2 + item.thickness / 2 + 0.6;
        const position = new THREE.Vector3(entry?.x ?? fallbackX, entry?.y ?? 0.18, 0);
        const bookMesh = new BookMeshGroup(item, position);
        bookMesh.setFocusPose(
          new THREE.Vector3(position.x, position.y, 1.8),
          new THREE.Euler(0, -Math.PI / 2, 0),
          1.14,
        );
        scene.add(bookMesh.group);
        bookGroups.push(bookMesh);
        bookMeshesByIdRef.current.set(item.id, bookMesh);
      });

      const updateViewport = () => {
        if (!containerRef.current) return;
        const viewportWidth = containerRef.current.clientWidth;
        const viewportHeight = containerRef.current.clientHeight;
        if (viewportWidth <= 0 || viewportHeight <= 0) return;
        camera.aspect = viewportWidth / viewportHeight;
        shelfCameraDistance = calculateShelfCameraDistance(viewportWidth, viewportHeight, shelfWidth, contentHeight);
        camera.far = Math.max(camera.far, shelfCameraDistance * 4 + shelfWidth);
        camera.updateProjectionMatrix();
        renderer.setSize(viewportWidth, viewportHeight, false);
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
      updateViewport();

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let hoveredMesh: BookMeshGroup | null = null;
      let dragState: {
        book: BookMeshGroup;
        pointerId: number;
        startX: number;
        startY: number;
        moved: boolean;
        targetLevelId: string | null;
      } | null = null;

      const getIntersectedBook = (event: PointerEvent): BookMeshGroup | null => {
        const rect = domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
          let object: THREE.Object3D | null = intersect.object;
          while (object) {
            if (object.userData?.instance instanceof BookMeshGroup) return object.userData.instance;
            object = object.parent;
          }
        }
        return null;
      };

      const getTargetLevel = (event: PointerEvent) => getShelfLevelFromPointer(
        event.clientY,
        domElement.getBoundingClientRect(),
        shelfLevels,
      );

      const clearDragState = () => {
        if (!dragState) return;
        dragState.book.clearDragPreview();
        dragState = null;
        onDragStateChange?.(null, null);
        domElement.style.cursor = 'default';
      };

      const handlePointerMove = (event: PointerEvent) => {
        // Orbit in inspection mode (book is selected, pointer dragging on it)
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
          return;
        }

        if (dragState) {
          const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
          if (!dragState.moved && distance < 6) return;

          dragState.moved = true;
          const targetLevel = getTargetLevel(event);
          dragState.targetLevelId = targetLevel?.id ?? null;
          if (targetLevel) {
            const targetIndex = shelfLevels.findIndex((level) => level.id === targetLevel.id);
            dragState.book.setDragPreview(new THREE.Vector3(
              dragState.book.getBasePosition().x,
              targetIndex * SHELF_LEVEL_SPACING + 0.18,
              0.55,
            ));
          }
          onDragStateChange?.(dragState.book.item.id, dragState.targetLevelId);
          domElement.style.cursor = 'grabbing';
          return;
        }

        const book = getIntersectedBook(event);
        if (book !== hoveredMesh) {
          hoveredMesh?.setHovered(false);
          hoveredMesh = book;
          hoveredMesh?.setHovered(true);
        }

        if (book) {
          domElement.style.cursor = 'grab';
          return;
        }

        // No book under pointer: pan horizontally + accumulate vertical drag for level change
        if (panStartRef.current) {
          const dx = event.clientX - panStartRef.current.x;
          const dy = event.clientY - panStartRef.current.y;
          panXRef.current = THREE.MathUtils.clamp(
            panXRef.current - dx * 0.006,
            -shelfWidth,
            shelfWidth,
          );
          dragDyAccRef.current += dy;
          domElement.style.cursor = 'grabbing';
        } else {
          domElement.style.cursor = 'default';
        }
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const book = getIntersectedBook(event);

        // Inspection mode + book under pointer = orbit, not drag-to-move
        if (isInspectingRef.current && book) {
          orbitPointerRef.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
          domElement.setPointerCapture(event.pointerId);
          event.preventDefault();
          return;
        }

        if (!book) {
          // Free space: start pan / vertical-drag for level navigation
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
      };

      const handlePointerUp = (event: PointerEvent) => {
        // Orbit release in inspection mode
        if (orbitPointerRef.current && orbitPointerRef.current.pointerId === event.pointerId) {
          orbitPointerRef.current = null;
          if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
          domElement.style.cursor = 'default';
          return;
        }

        // Vertical-drag level navigation (no book was being dragged)
        if (panStartRef.current && !dragState && onNavigateLevel && shelfLevelsRef.current.length > 0) {
          const absDy = Math.abs(dragDyAccRef.current);
          const absDx = Math.abs(event.clientX - panStartRef.current.x);
          if (absDy > DRAG_LEVEL_THRESHOLD && absDx < DRAG_PAN_HORIZONTAL_THRESHOLD + absDy * 0.5) {
            const direction = dragDyAccRef.current > 0 ? 1 : -1;
            const activeIndex = shelfLevelsRef.current.findIndex((level) => level.id === activeLevelIdRef.current);
            const targetIndex = THREE.MathUtils.clamp(activeIndex + direction, 0, shelfLevelsRef.current.length - 1);
            if (targetIndex !== activeIndex) {
              onNavigateLevel(shelfLevelsRef.current[targetIndex].id);
            }
          }
          panStartRef.current = null;
          dragDyAccRef.current = 0;
          if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
          domElement.style.cursor = 'default';
          return;
        }

        panStartRef.current = null;
        dragDyAccRef.current = 0;

        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const completedDrag = dragState.moved && dragState.targetLevelId;
        const book = dragState.book;
        const bookIndex = bookGroups.findIndex((candidate) => candidate === book);

        if (completedDrag) {
          onMoveBookToShelfLevel(book.item.id, dragState.targetLevelId!);
        } else if (bookIndex !== -1) {
          const activation = resolveBookActivation(bookIndex, selectedIndexRef.current, isInspectingRef.current);
          onSelectIndex(activation.selectedIndex);
          if (activation.shouldOpenInspection) onOpenInspection(activation.selectedIndex);
        }

        clearDragState();
        if (domElement.hasPointerCapture(event.pointerId)) domElement.releasePointerCapture(event.pointerId);
      };

      const handlePointerCancel = () => {
        orbitPointerRef.current = null;
        clearDragState();
      };

      const SCROLL_LEVEL_THRESHOLD = 80;

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          // Ctrl+scroll or pinch = zoom. Scroll UP (negative deltaY) = zoom IN.
          zoomScaleRef.current = THREE.MathUtils.clamp(
            zoomScaleRef.current + event.deltaY * 0.002,
            ZOOM_MIN,
            ZOOM_MAX,
          );
          return;
        }
        if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          // Shift+scroll or natural horizontal scroll = horizontal pan
          const panDelta = (event.deltaY || event.deltaX) * 0.004;
          panXRef.current = THREE.MathUtils.clamp(
            panXRef.current - panDelta,
            -shelfWidth,
            shelfWidth,
          );
          return;
        }
        // Natural vertical scroll = navigate between levels
        if (!onNavigateLevel || shelfLevelsRef.current.length < 2) return;
        scrollAccRef.current += event.deltaY;
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => { scrollAccRef.current = 0; }, 400);
        if (Math.abs(scrollAccRef.current) < SCROLL_LEVEL_THRESHOLD) return;
        const direction = scrollAccRef.current > 0 ? 1 : -1;
        scrollAccRef.current %= SCROLL_LEVEL_THRESHOLD;
        const activeIndex = shelfLevelsRef.current.findIndex((level) => level.id === activeLevelIdRef.current);
        const targetIndex = THREE.MathUtils.clamp(activeIndex + direction, 0, shelfLevelsRef.current.length - 1);
        if (targetIndex !== activeIndex) {
          onNavigateLevel(shelfLevelsRef.current[targetIndex].id);
        }
      };

      domElement.addEventListener('pointermove', handlePointerMove);
      domElement.addEventListener('pointerdown', handlePointerDown);
      domElement.addEventListener('pointerup', handlePointerUp);
      domElement.addEventListener('pointercancel', handlePointerCancel);
      domElement.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('blur', handlePointerCancel);

      let lastTime = performance.now();
      const animate = (now: number) => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        bookGroups.forEach((bookGroup, index) => {
          bookGroup.setSelected(index === selectedIndexRef.current && isInspectingRef.current);
          bookGroup.update(delta);
        });

        const selectedBook = bookGroups[selectedIndexRef.current];
        const indexChanged = lastSelectedIndexRef.current !== selectedIndexRef.current;
        const inspectionStarted = !lastInspectingRef.current && isInspectingRef.current;
        lastSelectedIndexRef.current = selectedIndexRef.current;
        lastInspectingRef.current = isInspectingRef.current;

        if (inspectionStarted || indexChanged) {
          inspectRotXRef.current = 0;
          inspectRotYRef.current = Math.PI / 2;
        }

        if (isInspectingRef.current && selectedBook) {
          selectedBook.setOrbitRotation(inspectRotXRef.current, inspectRotYRef.current);
        } else {
          // Reset orbit state when leaving inspection mode
          inspectRotXRef.current = 0;
          inspectRotYRef.current = Math.PI / 2;
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
        const targetCamX = targetPosition ? targetPosition.x + panX : panX;
        const targetCamY = targetPosition
          ? targetPosition.y + selectedBook!.item.height / 2 + 0.2
          : shelfCameraTarget.cameraY;
        const targetCamZ = targetPosition ? targetPosition.z + 4.8 : effectiveCamZ;
        const lookAtX = targetPosition ? targetPosition.x : panX;
        const lookAtY = targetPosition
          ? targetPosition.y + selectedBook!.item.height / 2
          : shelfCameraTarget.lookAtY;
        const lookAtZ = targetPosition?.z ?? 0;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 4);
        camera.lookAt(lookAtX, lookAtY, lookAtZ);
        camera.far = Math.max(effectiveCamZ * 8, 80);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };

      animate(performance.now());

      return () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        window.removeEventListener('blur', handlePointerCancel);
        domElement.removeEventListener('pointermove', handlePointerMove);
        domElement.removeEventListener('pointerdown', handlePointerDown);
        domElement.removeEventListener('pointerup', handlePointerUp);
        domElement.removeEventListener('pointercancel', handlePointerCancel);
        domElement.removeEventListener('wheel', handleWheel);
        resizeObserver?.disconnect();
        if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
        cancelAnimationFrame(animationFrameId);
        bookGroups.forEach((book) => book.dispose());
        bookMeshesByIdRef.current.clear();
        shelfGroup.dispose();
        renderer.dispose();
      };
    } catch (error) {
      console.error('WebGL initialization error in CompleteShelfScene:', error);
      setWebGLError(true);
    }
  }, [contentHeight, levelCount, levelLayoutSignature, onDragStateChange, onMoveBookToShelfLevel, onOpenInspection, onSelectIndex, shelfItems]);

  if (webGLError) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center bg-[#1A1817] p-6 text-center text-[#F3D274]">
        <h3 className="mb-2 font-serif text-lg font-bold">Visualização 3D Indisponível</h3>
        <p className="text-xs text-[#A39281]">Navegando em modo 2D da estante editorial.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full flex-1 select-none overflow-hidden bg-[#080B10]">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
};

export default CompleteShelfScene;
