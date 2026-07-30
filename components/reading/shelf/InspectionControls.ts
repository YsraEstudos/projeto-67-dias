import * as THREE from 'three';
import { BookMeshGroup } from './BookMesh';

export type ControlMode = 'shelf' | 'inspecting';

export interface InspectionControlsOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  minX?: number;
  maxX?: number;
  onModeChange?: (mode: ControlMode) => void;
  onBookSelected?: (book: BookMeshGroup | null) => void;
}

export class InspectionControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  public mode: ControlMode = 'shelf';
  public selectedBook: BookMeshGroup | null = null;

  // Shelf Navigation Parameters
  private shelfX: number = 0;
  private targetShelfX: number = 0;
  private shelfVelocityX: number = 0;
  private minX: number = -1;
  private maxX: number = 20;

  // Camera Shelf Default Pos
  private readonly shelfCamY = 1.7;
  private readonly shelfCamZ = 5.2;
  private readonly shelfLookY = 1.35;

  // Inspection Parameters
  private inspectRotationX = 0;
  private inspectRotationY = 0;
  private targetInspectRotX = 0;
  private targetInspectRotY = Math.PI; // Face front cover towards camera
  private inspectZoom = 3.2;
  private targetInspectZoom = 3.2;

  // Pointer Drag State
  private isPointerDown = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private dragDistance = 0;

  // Callbacks
  private onModeChange?: (mode: ControlMode) => void;
  private onBookSelected?: (book: BookMeshGroup | null) => void;

  // Reusable vectors to avoid per-frame heap allocation
  private readonly _inspectTargetPos = new THREE.Vector3();
  private readonly _targetCamPos = new THREE.Vector3();

  constructor(options: InspectionControlsOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.minX = options.minX ?? -1;
    this.maxX = options.maxX ?? 20;
    this.onModeChange = options.onModeChange;
    this.onBookSelected = options.onBookSelected;

    this.attach();
  }

  public setBounds(minX: number, maxX: number) {
    this.minX = minX;
    this.maxX = maxX;
  }

  public scrollToX(targetX: number, immediate = false) {
    this.targetShelfX = THREE.MathUtils.clamp(targetX, this.minX, this.maxX);
    if (immediate) {
      this.shelfX = this.targetShelfX;
    }
  }

  public selectBook(book: BookMeshGroup) {
    if (this.selectedBook === book && this.mode === 'inspecting') return;

    if (this.selectedBook && this.selectedBook !== book) {
      this.selectedBook.setSelected(false);
    }

    this.selectedBook = book;
    this.selectedBook.setSelected(true);
    this.mode = 'inspecting';

    // Reset inspection rotation angles (Face front cover)
    this.targetInspectRotX = 0;
    this.targetInspectRotY = Math.PI / 2; // Rotate 90 deg so cover faces camera
    this.inspectRotationX = 0;
    this.inspectRotationY = Math.PI / 2;
    this.targetInspectZoom = 3.2;
    this.inspectZoom = 3.2;

    this.onModeChange?.('inspecting');
    this.onBookSelected?.(book);
  }

  public deselectBook() {
    if (this.selectedBook) {
      this.selectedBook.setSelected(false);
      this.selectedBook = null;
    }
    this.mode = 'shelf';

    this.onModeChange?.('shelf');
    this.onBookSelected?.(null);
  }

  public isDragging(): boolean {
    return this.dragDistance > 5;
  }

  public attach() {
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
  }

  public detach() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.dragDistance = 0;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.dragDistance += Math.abs(dx) + Math.abs(dy);

    if (this.mode === 'shelf') {
      // Pan continuous horizontal shelf
      const sensitivity = 0.008;
      this.shelfVelocityX = -dx * sensitivity;
      this.targetShelfX += this.shelfVelocityX;
      this.targetShelfX = THREE.MathUtils.clamp(this.targetShelfX, this.minX, this.maxX);
    } else if (this.mode === 'inspecting' && this.selectedBook) {
      // 360 degree 3D Book Orbit inspection
      const orbitSensitivity = 0.01;
      this.targetInspectRotY += dx * orbitSensitivity;
      this.targetInspectRotX += dy * orbitSensitivity;
      // Clamp vertical pitch to prevent flipping
      this.targetInspectRotX = THREE.MathUtils.clamp(this.targetInspectRotX, -Math.PI / 3, Math.PI / 3);
    }

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (this.mode === 'shelf') {
      const delta = (e.deltaY || e.deltaX) * 0.005;
      this.targetShelfX += delta;
      this.targetShelfX = THREE.MathUtils.clamp(this.targetShelfX, this.minX, this.maxX);
    } else if (this.mode === 'inspecting') {
      const zoomDelta = e.deltaY * 0.003;
      this.targetInspectZoom = THREE.MathUtils.clamp(this.targetInspectZoom + zoomDelta, 1.8, 5.0);
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.mode === 'shelf') {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.targetShelfX = THREE.MathUtils.clamp(this.targetShelfX - 1.2, this.minX, this.maxX);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        this.targetShelfX = THREE.MathUtils.clamp(this.targetShelfX + 1.2, this.minX, this.maxX);
      }
    } else if (this.mode === 'inspecting') {
      if (e.key === 'Escape') {
        this.deselectBook();
      }
    }
  };

  public update(delta: number) {
    const lerpFactor = Math.min(1.0, delta * 8.5);

    if (this.mode === 'shelf') {
      // Apply momentum decay if not actively dragging
      if (!this.isPointerDown) {
        this.shelfVelocityX *= 0.90;
        this.targetShelfX += this.shelfVelocityX;
        this.targetShelfX = THREE.MathUtils.clamp(this.targetShelfX, this.minX, this.maxX);
      }

      // Smooth shelf position transition
      this.shelfX = THREE.MathUtils.lerp(this.shelfX, this.targetShelfX, lerpFactor);

      // Lerp camera position back to shelf view
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.shelfX, lerpFactor);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.shelfCamY, lerpFactor);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.shelfCamZ, lerpFactor);

      const lookTarget = new THREE.Vector3(this.shelfX, this.shelfLookY, 0);
      this.camera.lookAt(lookTarget);

    } else if (this.mode === 'inspecting' && this.selectedBook) {
      // Lerp inspection rotation and zoom
      this.inspectRotationX = THREE.MathUtils.lerp(this.inspectRotationX, this.targetInspectRotX, lerpFactor);
      this.inspectRotationY = THREE.MathUtils.lerp(this.inspectRotationY, this.targetInspectRotY, lerpFactor);
      this.inspectZoom = THREE.MathUtils.lerp(this.inspectZoom, this.targetInspectZoom, lerpFactor);

      // Selected book smooth pull-forward target center
      const bookBasePos = this.selectedBook.getBasePosition();

      // Move book group to inspection center position and set its 3D rotation
      this._inspectTargetPos.set(bookBasePos.x, 1.5, 2.2);
      this.selectedBook.group.position.lerp(this._inspectTargetPos, lerpFactor);
      this.selectedBook.group.rotation.x = THREE.MathUtils.lerp(this.selectedBook.group.rotation.x, this.inspectRotationX, lerpFactor);
      this.selectedBook.group.rotation.y = THREE.MathUtils.lerp(this.selectedBook.group.rotation.y, this.inspectRotationY, lerpFactor);
      this.selectedBook.group.rotation.z = THREE.MathUtils.lerp(this.selectedBook.group.rotation.z, 0, lerpFactor);

      // Lerp camera to focus directly on selected book
      this._targetCamPos.set(bookBasePos.x, 1.5, 2.2 + this.inspectZoom);
      this.camera.position.lerp(this._targetCamPos, lerpFactor);
      this.camera.lookAt(this._inspectTargetPos);
    }
  }

  public getShelfX(): number {
    return this.shelfX;
  }

  public getTargetShelfX(): number {
    return this.targetShelfX;
  }

  public dispose() {
    this.detach();
  }
}
