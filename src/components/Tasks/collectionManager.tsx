import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCollection } from "../Tasks/collectionContext";

export const CollectionManager = ({
  taskId,
  onCollectionCreated,
}: {
  taskId: number;
  onCollectionCreated?: (collectionId: number) => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const { collection, addToCollection, removeFromCollection, clearCollection } =
    useCollection();

  const addTaskToCollection = () => {
    if (!collection.some((item) => item.id === taskId)) {
      addToCollection({ id: taskId });
      toast.success(`Задание #${taskId} добавлено в подборку`, {
        action: {
          label: "Просмотреть",
          onClick: () => setIsMenuOpen(true),
        },
      });
    } else {
      toast.error(`Задание #${taskId} уже есть в подборке`);
    }
  };

  const removeTaskFromCollection = (id: number) => {
    removeFromCollection(id);
    toast.success(`Задание #${id} удалено из подборки`);
  };

  const createCollection = async () => {
    if (!collectionName.trim()) {
      toast.error("Введите название подборки");
      return;
    }

    if (collection.length === 0) {
      toast.error("Добавьте хотя бы одно задание");
      return;
    }

    setIsCreatingCollection(true);

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: collectionName,
          tasks: collection.map((task, index) => ({
            id: task.id,
            order: index + 1,
          })),
        }),
      });

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка сервера");
      }

      // Проверяем, что ответ не пустой
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Пустой ответ от сервера");
      }

      // Парсим JSON только если есть содержимое
      const result = JSON.parse(responseText);

      toast.success(`Подборка "${result.name}" успешно создана!`);
      clearCollection();
      setCollectionName("");
      setIsMenuOpen(false);

      if (onCollectionCreated) onCollectionCreated(result.id);
    } catch (error) {
      console.error("Ошибка при создании подборки:", error);
      toast.error(
        `Ошибка: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsCreatingCollection(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={addTaskToCollection}
        className="gap-1 cursor-pointer"
        disabled={collection.some((item) => item.id === taskId)}
      >
        <Plus size={16} />
        <span>В подборку</span>
      </Button>

      {collection.length > 0 && (
        <>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="fixed right-6 top-6 z-50 p-3 bg-white border rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          >
            <div className="relative">
              <Bookmark size={20} className="text-blue-600" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {collection.length}
              </span>
            </div>
          </button>

          {isMenuOpen && (
            <div className="fixed right-6 top-24 z-50 w-80 bg-white border rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">
                  Моя подборка ({collection.length})
                </h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {collection.map((task) => (
                  <div
                    key={task.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">Задание #{task.id}</span>
                    <button
                      onClick={() => removeTaskFromCollection(task.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Название подборки"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                />
                <Button
                  onClick={createCollection}
                  className="w-full"
                  disabled={isCreatingCollection}
                >
                  {isCreatingCollection ? "Создание..." : "Создать подборку"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollectionManager;
