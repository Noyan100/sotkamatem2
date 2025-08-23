"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  payment: number | null;
  createdAt: string;
}

const UserBalanceManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "asc" | "desc";
  }>({
    key: "payment",
    direction: "desc",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Не удалось загрузить пользователей");
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    setNewBalance(user?.payment?.toString() || "");
    setSuccessMessage(null);
    setError(null);
  };

  const handleBalanceChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserId === null || !newBalance) {
      setError("Выберите пользователя и укажите сумму");
      return;
    }

    const payment = parseInt(newBalance.replace(/\s/g, ""), 10);
    if (isNaN(payment)) {
      setError("Введите корректную сумму");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${selectedUserId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка обновления баланса");
      }

      const updatedUser = await response.json();
      setUsers(
        users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );

      // Обновляем сессию, если нужно
      try {
        await fetch("/api/auth/session?update=1");
      } catch (sessionError) {
        console.warn("Не удалось обновить сессию", sessionError);
      }

      setSuccessMessage(
        `Баланс обновлен: ${payment.toLocaleString("ru-RU")} ₽`
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Управление балансами
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список пользователей */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Пользователи
            </h2>
            <div className="text-sm text-gray-500">Всего: {users.length}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Имя{" "}
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("payment")}
                  >
                    Баланс{" "}
                    {sortConfig.key === "payment" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Дата{" "}
                    {sortConfig.key === "createdAt" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedUserId === user.id ? "bg-gray-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                            {user.role === "ADMIN" && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Админ
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.payment?.toLocaleString("ru-RU") || "0"} ₽
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.payment === null ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Не указан
                        </span>
                      ) : user.payment < 0 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Отрицательный
                        </span>
                      ) : user.payment > 0 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Активен
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Нулевой
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Форма редактирования */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {selectedUserId
              ? "Редактирование баланса"
              : "Выберите пользователя"}
          </h2>

          {selectedUserId ? (
            <form onSubmit={handleBalanceChange}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пользователь:
                </label>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">
                    {users.find((u) => u.id === selectedUserId)?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {users.find((u) => u.id === selectedUserId)?.email}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <Label
                  htmlFor="balance"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Новый баланс (₽):
                </Label>
                <Input
                  type="text"
                  id="balance"
                  value={
                    newBalance === "-"
                      ? "-"
                      : newBalance.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    if (value === "-" || /^-?\d*$/.test(value)) {
                      setNewBalance(value);
                    }
                  }}
                  className="w-full p-2 border rounded"
                  placeholder="Введите сумму"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий баланс:
                </label>
                <p className="text-lg font-semibold">
                  {users
                    .find((u) => u.id === selectedUserId)
                    ?.payment?.toLocaleString("ru-RU") || "0"}{" "}
                  ₽
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full p-5">
                {isLoading ? "Сохранение..." : "Обновить баланс"}
              </Button>

              {successMessage && (
                <div className="mt-3 p-3 bg-gray-100 text-black-700 rounded">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Выберите пользователя из списка</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBalanceManager;
