import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BookMeshGroup } from './BookMesh';
import { ShelfMeshGroup } from './ShelfMesh';
import { MINT_BOOK_MANIFEST, ShelfBookManifestItem } from './mintManifest';
import { Book } from '../../../types';

interface CompleteShelfSceneProps {
  userBooks: Book[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isInspecting: boolean;
  onToggleInspection: () => void;
}

export const CompleteShelfScene: React.FC<CompleteShelfSceneProps> = ({
  userBooks,
  selectedIndex,
  onSelectIndex,
  isInspecting,
  onToggleInspection,
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
      scene.background = new THREE.Color('#1A1817');

      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || 500;

      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      cameraRef.current = camera;
      camera.position.set(0, 2.2, 8.5);
      camera.lookAt(0, 1.2, 0);

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      rendererRef.current = renderer;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      const totalWidth = shelfItems.reduce((acc, item) => acc + item.thickness + 0.08, 0) + 1.2;
      const shelfGroup = new ShelfMeshGroup({
        width: Math.max(12, totalWidth),
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
        scene.add(bookMesh.group);
        bookGroups.push(bookMesh);
        currentX += item.thickness + 0.08;
      });

      bookMeshesRef.current = bookGroups;

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
            if (idx === selectedIndexRef.current && !isInspectingRef.current) {
              onToggleInspection();
            } else {
              onSelectIndex(idx);
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
          const basePos = selectedBook.getBasePosition();
          let targetCamX = basePos.x;
          let targetCamY = isInspectingRef.current ? 1.8 : 2.2;
          let targetCamZ = isInspectingRef.current ? 4.5 : 8.5;

          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 4);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 4);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 4);

          camera.lookAt(targetCamX, 1.2, 0);
        }

        renderer.render(scene, camera);
      };

      animate(performance.now());

      // Resize Handler
      const handleResize = () => {
        if (!containerRef.current || !renderer || !camera) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight || 500;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
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
    <div ref={containerRef} className="relative w-full h-[65vh] min-h-[420px] bg-[#1A1817] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
    </div>
  );
};

export default CompleteShelfScene;
