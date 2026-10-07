import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Bookshelf from "../../../components/views/AulasView/Bookshelf";
import { useAulasStore } from "../../../stores/aulasStore";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }),
  });
  useAulasStore.getState()._reset();
  useAulasStore.getState()._hydrateFromFirestore({ folders: [], collections: [] });
});

function seedRecentChapter() {
  const store = useAulasStore.getState();
  store.addFolder("Pasta");
  const folder = useAulasStore.getState().folders.find((f) => f.name === "Pasta")!;
  store.addBook(folder.id, "Direito Constitucional");
  const book = useAulasStore.getState().books.find((b) => b.title === "Direito Constitucional")!;
  store.addChaptersJson(book.id, [{ title: "Aula 1 - Princípios" }]);
  const chapter = useAulasStore.getState().books.find((b) => b.id === book.id)!.chapters[0];
  store.addRecentlyStudied(book.id, chapter.id);
  return { book, chapter };
}

describe("Bookshelf - Continuar Estudando", () => {
  it("opens the lesson directly when clicking a recent item", () => {
    const { book, chapter } = seedRecentChapter();
    const onSelectBook = vi.fn();
    const onSelectChapter = vi.fn();
    render(<Bookshelf onSelectBook={onSelectBook} onSelectChapter={onSelectChapter} />);

    fireEvent.click(screen.getByTestId("resume-chapter-card"));

    expect(onSelectChapter).toHaveBeenCalledWith(book.id, chapter.id);
    expect(onSelectBook).not.toHaveBeenCalled();
  });

  it("is keyboard accessible (Enter activates the card)", () => {
    const { book, chapter } = seedRecentChapter();
    const onSelectChapter = vi.fn();
    render(<Bookshelf onSelectBook={vi.fn()} onSelectChapter={onSelectChapter} />);

    const card = screen.getByRole("button", { name: /Continuar Aula 1 - Princípios/ });
    expect(card).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(onSelectChapter).toHaveBeenCalledWith(book.id, chapter.id);
  });

  it("falls back to the book details when no chapter handler is provided", () => {
    const { book } = seedRecentChapter();
    const onSelectBook = vi.fn();
    render(<Bookshelf onSelectBook={onSelectBook} />);

    fireEvent.click(screen.getByTestId("resume-chapter-card"));

    expect(onSelectBook).toHaveBeenCalledWith(book.id);
  });

  it("hides recent items whose book no longer exists", () => {
    const { book } = seedRecentChapter();
    // Simulate a book removed on another device (recent list not yet pruned).
    useAulasStore.setState({ books: useAulasStore.getState().books.filter((b) => b.id !== book.id) });
    render(<Bookshelf onSelectBook={vi.fn()} />);

    expect(screen.queryByTestId("resume-chapter-card")).toBeNull();
    expect(screen.queryByText("Continuar Estudando")).toBeNull();
  });
});
