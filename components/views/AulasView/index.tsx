import React, { useState } from "react";
import Bookshelf from "./Bookshelf";
import BookDetails from "./BookDetails";
import ChapterView from "./ChapterView";

type ViewType = "bookshelf" | "book-details" | "chapter-view";

interface NavigationState {
  view: ViewType;
  bookId?: string;
  chapterId?: string;
}

const AulasView: React.FC = () => {
  const [nav, setNav] = useState<NavigationState>({ view: "bookshelf" });

  const handleSelectBook = (bookId: string) => {
    setNav({ view: "book-details", bookId });
  };

  const handleBackToBookshelf = () => {
    setNav({ view: "bookshelf" });
  };

  const handleSelectChapter = (bookId: string, chapterId: string) => {
    setNav({ view: "chapter-view", bookId, chapterId });
  };

  const handleBackToBookDetails = (bookId: string) => {
    setNav({ view: "book-details", bookId });
  };

  switch (nav.view) {
    case "bookshelf":
      return <Bookshelf onSelectBook={handleSelectBook} />;
    
    case "book-details":
      if (!nav.bookId) {
        return <div className="p-12 text-center text-red-500">Erro: ID do curso não especificado.</div>;
      }
      return (
        <BookDetails
          bookId={nav.bookId}
          onBack={handleBackToBookshelf}
          onSelectChapter={(chapterId) => handleSelectChapter(nav.bookId!, chapterId)}
        />
      );

    case "chapter-view":
      if (!nav.bookId || !nav.chapterId) {
        return <div className="p-12 text-center text-red-500">Erro: Parâmetros de aula incompletos.</div>;
      }
      return (
        <ChapterView
          bookId={nav.bookId}
          chapterId={nav.chapterId}
          onBack={() => handleBackToBookDetails(nav.bookId!)}
        />
      );

    default:
      return <div className="p-12 text-center text-[#737373]">Página não encontrada.</div>;
  }
};

export default AulasView;
