"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface Task {
  id: number;
}

type CollectionContextType = {
  collection: Task[];
  addToCollection: (task: Task) => void;
  removeFromCollection: (taskId: number) => void;
  clearCollection: () => void;
};

const CollectionContext = createContext<CollectionContextType | undefined>(
  undefined
);

export const CollectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [collection, setCollection] = useState<Task[]>([]);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("globalCollection");
    if (saved && saved.trim() !== "") {
      // Добавляем проверку на пустую строку
      try {
        const parsed = JSON.parse(saved);

        // Если данные есть, но не в ожидаемом формате
        if (!Array.isArray(parsed)) {
          localStorage.removeItem("globalCollection");
          return;
        }

        // Обработка разных форматов данных
        if (parsed.length > 0) {
          if (typeof parsed[0] === "number") {
            // Старый формат - массив чисел
            setCollection(parsed.map((id) => ({ id })));
          } else if (
            typeof parsed[0] === "object" &&
            parsed[0].id !== undefined
          ) {
            // Новый формат - массив объектов
            setCollection(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse collection from localStorage", e);
        localStorage.removeItem("globalCollection"); // Удаляем битые данные
      }
    }
  }, []);

  const addToCollection = (task: Task) => {
    setCollection((prev) => {
      if (!prev.some((item) => item.id === task.id)) {
        const newCollection = [...prev, task];
        localStorage.setItem("globalCollection", JSON.stringify(newCollection));
        return newCollection;
      }
      return prev;
    });
  };

  const removeFromCollection = (taskId: number) => {
    setCollection((prev) => {
      const newCollection = prev.filter((task) => task.id !== taskId);
      localStorage.setItem("globalCollection", JSON.stringify(newCollection));
      return newCollection;
    });
  };

  const clearCollection = () => {
    setCollection([]);
    localStorage.removeItem("globalCollection");
  };

  return (
    <CollectionContext.Provider
      value={{
        collection,
        addToCollection,
        removeFromCollection,
        clearCollection,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
};
