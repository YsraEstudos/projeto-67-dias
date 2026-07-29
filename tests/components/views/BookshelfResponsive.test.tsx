import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Bookshelf, {
  useAulasSensors,
  useIsSmallScreen,
  TOUCH_SENSOR_OPTIONS,
  POINTER_SENSOR_OPTIONS,
} from "../../../components/views/AulasView/Bookshelf";
import { useAulasStore } from "../../../stores/aulasStore";

let viewportWidth = 1024;

const matchMediaMock = (query: string) => {
  const match = query.match(/min-width:\s*(\d+)/);
  const min = match ? parseInt(match[1], 10) : 0;
  const matches = viewportWidth >= min;
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;
};

beforeEach(() => {
  viewportWidth = 1024;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  });
  useAulasStore.getState()._reset();
  useAulasStore.getState()._hydrateFromFirestore({ folders: [], collections: [] });
});

function seedShelf(bookCount = 1) {
  const store = useAulasStore.getState();
  store.addFolder("Folder");
  const folder = useAulasStore.getState().folders.find((f) => f.name === "Folder")!;
  for (let i = 0; i < bookCount; i++) {
    store.addBook(folder.id, `Book ${i + 1}`);
  }
  return folder;
}

describe("Bookshelf responsiveness", () => {
  it("renders the book grid with mobile 2-col and desktop 4-col classes", () => {
    seedShelf(2);
    const { container } = render(<Bookshelf onSelectBook={() => {}} />);
    const grid = container.querySelector('[data-testid="book-grid"]');
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain("grid-cols-2");
    expect(grid!.className).toContain("lg:grid-cols-4");
  });

  it("shows the shelf3d toggle on small screens (adaptado, nao desativado)", () => {
    viewportWidth = 375;
    seedShelf(1);
    render(<Bookshelf onSelectBook={() => {}} />);
    expect(screen.queryByTitle("Exibição em Prateleira 3D")).not.toBeNull();
  });

  it("shows the shelf3d toggle on desktop", () => {
    viewportWidth = 1280;
    seedShelf(1);
    render(<Bookshelf onSelectBook={() => {}} />);
    expect(screen.queryByTitle("Exibição em Prateleira 3D")).not.toBeNull();
  });

  it("renders the empty-shelf state and the create-folder affordance on mobile", () => {
    viewportWidth = 320;
    render(<Bookshelf onSelectBook={() => {}} />);
    expect(screen.getByText("Sua estante de aulas está vazia.")).toBeInTheDocument();
    expect(screen.getByText("Criar primeira pasta")).toBeInTheDocument();
  });

  it("registers Pointer + Touch + Keyboard sensors (TouchSensor present)", () => {
    function Probe() {
      const sensors = useAulasSensors();
      return <div data-testid="count">{sensors.length}</div>;
    }
    render(<Probe />);
    expect(screen.getByTestId("count")).toHaveTextContent("3");
  });

  it("exports the touch activation constraint with a delay (long-press, not tap)", () => {
    const c = TOUCH_SENSOR_OPTIONS.activationConstraint as { delay: number; tolerance: number };
    expect(typeof c.delay).toBe("number");
    expect(c.delay).toBeGreaterThanOrEqual(150);
    expect(c.delay).toBeLessThanOrEqual(300);
  });

  it("preserves the desktop PointerSensor activation distance", () => {
    const c = POINTER_SENSOR_OPTIONS.activationConstraint as { distance: number };
    expect(c.distance).toBe(5);
  });

  it("exposes folder action buttons without hover dependency on mobile", () => {
    viewportWidth = 375;
    seedShelf(1);
    render(<Bookshelf onSelectBook={() => {}} />);
    const renameBtn = screen.getByRole("button", { name: "Renomear Pasta" });
    expect(renameBtn.className).toContain("opacity-100");
    expect(renameBtn.className).toContain("sm:opacity-0");
    expect(renameBtn.className).toContain("sm:group-hover:opacity-100");
  });

  it("useIsSmallScreen returns true on mobile", () => {
    viewportWidth = 360;
    function Probe() {
      const small = useIsSmallScreen();
      return <div data-testid="small">{String(small)}</div>;
    }
    render(<Probe />);
    expect(screen.getByTestId("small")).toHaveTextContent("true");
  });

  it("useIsSmallScreen returns false on desktop", () => {
    viewportWidth = 1200;
    function Probe() {
      const small = useIsSmallScreen();
      return <div data-testid="small">{String(small)}</div>;
    }
    render(<Probe />);
    expect(screen.getByTestId("small")).toHaveTextContent("false");
  });
});