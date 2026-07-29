import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BookMeshGroup } from './BookMesh';
import { ShelfMeshGroup } from './ShelfMesh';
import { MINT_BOOK_MANIFEST, ShelfBookManifestItem } from './mintManifest';
import { Book } from '../../../types';

const SHELF_CAMERA_FOV = 38;
const SHELF_CAMERA_MIN_DISTANCE = 8.5;
const SHELF_CONTENT_HEIGHT = 4.2;

export function calculateShelfCameraDistance(
  viewportWidth: number,
  viewportHeight: number,
  shelfWidth: number,
): number {
  const safeWidth = Math.max(viewportWidth, 1);
  const safeHeight = Math.max(viewportHeight, 1);
  const aspect = safeWidth / safeHeight;
  const halfFovRadians = THREE.MathUtils.degToRad(SHELF_CAMERA_FOV / 2);
  const horizontalDistance = (shelfWidth * 1.12) / (2 * Math.tan(halfFovRadians) * Math.max(aspect, 0.1));
  const verticalDistance = (SHELF_CONTENT_HEIGHT * 1.12) / (2 * Math.tan(halfFovRadians));

  return Math.max(SHELF_CAMERA_MIN_DISTANCE, horizontalDistance, verticalDistance);
}

interface CompleteShelfSceneProps {
  userBooks: Book[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenInspection: (index: number) => void;
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
  userBooks,
  selectedIndex,
  onSelectIndex,
  onOpenInspection,
  isInspecting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLError, setWebGLError] = useState<boolean>(false);

  // References for Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bookMeshesRef = useRef<BookMeshGroup[]>([]);
  const shelfMeshRef = useRef<ShelfMeshGroup | null>(null);
  const selectedIndexRef = useRef<number>(selectedIndex);
  const isInspectingRef = useRef<boolean>(isInspecting);
  const baseCameraDistanceRef = useRef<number>(SHELF_CAMERA_MIN_DISTANCE);

  selectedIndexRef.current = selectedIndex;
  isInspectingRef.current = isInspecting;

  // Combine store books with 19 clothbound manifest items
  const shelfItems: ShelfBookManifestItem[] = React.useMemo(() => {
    if (userBooks && userBooks.length > 0) {
      return userBooks.map((uBook, idx) => {
        const manifestTemplate = MINT_BOOK_MANIFEST[idx % MINT_BOOK_MANIFEST.length];
        return {
          ...manifestTemplate,
          id: uBook.id,
          title: uBook.title || manifestTemplate.title,
          author: uBook.author || manifestTemplate.author,
          coverUrl: uBook.coverUrl || undefined,
          pages: uBook.total || manifestTemplate.pages,
          genre: uBook.genre || manifestTemplate.genre,
        };
      });
    }
    return MINT_BOOK_MANIFEST;
  }, [userBooks]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    let animationFrameId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;

    try {
      scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color('#080B10');

      const width = Math.max(containerRef.current.clientWidth, 1);
      const height = Math.max(containerRef.current.clientHeight, 1);
      const totalWidth = shelfItems.reduce((acc, item) => acc + item.thickness + 0.08, 0) + 1.2;
      const shelfWidth = Math.max(12, totalWidth);
      baseCameraDistanceRef.current = calculateShelfCameraDistance(width, height, shelfWidth);

      camera = new THREE.PerspectiveCamera(SHELF_CAMERA_FOV, width / height, 0.1, 100);
      cameraRef.current = camera;
      camera.position.set(0, 2.2, baseCameraDistanceRef.current);
      camera.lookAt(0, 1.2, 0);

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      rendererRef.current = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Lights
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

      // Shelf Group
      const shelfGroup = new ShelfMeshGroup({
        width: shelfWidth,
        depth: 3.2,
        thickness: 0.35,
      });
      shelfMeshRef.current = shelfGroup;
      scene.add(shelfGroup.group);

      // Books Placement
      const bookGroups: BookMeshGroup[] = [];
      let currentX = -totalWidth / 2 + 0.6;

      shelfItems.forEach((item) => {
        const posX = currentX + item.thickness / 2;
        const pos = new THREE.Vector3(posX, 0.17, 0);
        const bookMesh = new BookMeshGroup(item, pos);
        bookMesh.setFocusPose(
          new THREE.Vector3(posX, 0.17, 1.8),
          new THREE.Euler(0, -Math.PI / 2, 0),
          1.14,
        );
        scene.add(bookMesh.group);
        bookGroups.push(bookMesh);
        currentX += item.thickness + 0.08;
      });

      bookMeshesRef.current = bookGroups;

      const updateViewport = () => {
        if (!containerRef.current || !renderer || !camera) return;

        const viewportWidth = containerRef.current.clientWidth;
        const viewportHeight = containerRef.current.clientHeight;
        if (viewportWidth <= 0 || viewportHeight <= 0) return;

        camera.aspect = viewportWidth / viewportHeight;
        camera.updateProjectionMatrix();
        baseCameraDistanceRef.current = calculateShelfCameraDistance(viewportWidth, viewportHeight, shelfWidth);
        renderer.setSize(viewportWidth, viewportHeight, false);
      };

      let resizeFrameId: number | null = null;
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

      // Interaction Raycasting
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let hoveredMesh: BookMeshGroup | null = null;

      const getIntersectedBook = (event: MouseEvent): BookMeshGroup | null => {
        const rect = canvasRef.current!.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
          let obj: THREE.Object3D | null = intersect.object;
          while (obj) {
            if (obj.userData && obj.userData.instance instanceof BookMeshGroup) {
              return obj.userData.instance;
            }
            obj = obj.parent;
          }
        }
        return null;
      };

      const handlePointerMove = (event: MouseEvent) => {
        const book = getIntersectedBook(event);
        if (book !== hoveredMesh) {
          if (hoveredMesh) hoveredMesh.setHovered(false);
          hoveredMesh = book;
          if (hoveredMesh) hoveredMesh.setHovered(true);
        }
        canvasRef.current!.style.cursor = book ? 'pointer' : 'default';
      };

      const handlePointerDown = (event: MouseEvent) => {
        const book = getIntersectedBook(event);
        if (book) {
          const idx = bookGroups.findIndex((b) => b === book);
          if (idx !== -1) {
            const activation = resolveBookActivation(
              idx,
              selectedIndexRef.current,
              isInspectingRef.current,
            );
            onSelectIndex(activation.selectedIndex);
            if (activation.shouldOpenInspection) {
              onOpenInspection(activation.selectedIndex);
            }
          }
        }
      };

      const domElement = canvasRef.current;
      domElement.addEventListener('mousemove', handlePointerMove);
      domElement.addEventListener('click', handlePointerDown);

      // Animation Loop
      let lastTime = performance.now();
      const animate = (now: number) => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Update book lerps
        bookGroups.forEach((bGroup, idx) => {
          const isSelected = idx === selectedIndexRef.current;
          bGroup.setSelected(isSelected && isInspectingRef.current);
          bGroup.update(delta);
        });

        // Camera Smooth Focus target
        const selectedBook = bookGroups[selectedIndexRef.current];
        if (selectedBook) {
          const isFocused = isInspectingRef.current;
          const targetPosition = isFocused ? selectedBook.getFocusPosition() : null;
          const targetCamX = targetPosition?.x ?? 0;
          const targetCamY = targetPosition
            ? targetPosition.y + selectedBook.item.height / 2 + 0.2
            : 2.2;
          const targetCamZ = targetPosition
            ? targetPosition.z + 4.8
            : baseCameraDistanceRef.current;
          const lookAtY = targetPosition
            ? targetPosition.y + selectedBook.item.height / 2
            : 1.2;
          const lookAtZ = targetPosition?.z ?? 0;

          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 4);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 4);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 4);

          camera.lookAt(targetCamX, lookAtY, lookAtZ);
        }

        renderer.render(scene, camera);
      };

      animate(performance.now());

      window.addEventListener('resize', scheduleViewportUpdate);

      return () => {
        window.removeEventListener('resize', scheduleViewportUpdate);
        resizeObserver?.disconnect();
        if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
        if (domElement) {
          domElement.removeEventListener('mousemove', handlePointerMove);
          domElement.removeEventListener('click', handlePointerDown);
        }
        cancelAnimationFrame(animationFrameId);
        bookGroups.forEach((b) => b.dispose());
        shelfGroup.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.error('WebGL initialization error in CompleteShelfScene:', err);
      setWebGLError(true);
    }
  }, [shelfItems]);

  if (webGLError) {
    return (
      <div className="w-full h-96 bg-[#1A1817] flex flex-col items-center justify-center p-6 text-center text-[#F3D274]">
        <h3 className="text-lg font-serif font-bold mb-2">Visualização 3D Indisponível</h3>
        <p className="text-xs text-[#A39281]">Navegando em modo 2D da estante editorial.</p>
      </div>
    );
  }

  return (
      <div ref={containerRef} className="relative h-full min-h-0 w-full flex-1 overflow-hidden bg-[#080B10] select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
    </div>
  );
};

export default CompleteShelfScene;
