"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SOURCE_TYPES,
  TASK_NUMBERS,
  COMMON_TASK_TYPES,
  getTaskTypesForNumber,
  WAVE_TYPES,
} from "./constants";
import { Input } from "../ui/input";
import { Search, X } from "lucide-react";

interface Props {
  className?: string;
}

export const Filters: React.FC<Props> = ({ className }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Get current filter values
  const currentNumbers = searchParams.getAll("number");
  const currentTypes = searchParams.getAll("type");
  const currentSources = searchParams.getAll("sourceType");
  const currentYears = searchParams.getAll("year");
  const currentWaves = searchParams.getAll("wave");
  const currentSearch = searchParams.get("search") || "";

  // Initialize search query from URL
  useEffect(() => {
    setSearchQuery(currentSearch);
    setDebouncedQuery(currentSearch);
  }, [currentSearch]);

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  // Apply debounced search
  useEffect(() => {
    if (debouncedQuery !== currentSearch) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  // Get available task types
  const availableTaskTypes =
    currentNumbers.length > 0
      ? currentNumbers.flatMap((num) => getTaskTypesForNumber(num))
      : COMMON_TASK_TYPES;

  // Get unique task types
  const uniqueTaskTypes = Array.from(
    new Set(availableTaskTypes.map((t) => t.value))
  ).map((value) => availableTaskTypes.find((t) => t.value === value)!);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.delete("search");
      }

      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    handleSearch("");
  };

  // Multi-filter handler
  const handleMultiFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(key);

    if (currentValues.includes(value)) {
      const newValues = currentValues.filter((v) => v !== value);
      params.delete(key);
      newValues.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }

    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  // Check if filter is active
  const isActive = (key: string, value: string) => {
    return searchParams.getAll(key).includes(value);
  };

  // Reset specific filter
  const resetFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  // Reset all filters
  const resetAllFilters = () => {
    router.push("?page=1");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search input */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Поиск</h3>
        <div className="relative">
          <Input
            placeholder="Поиск по ID или тексту задания..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleSearch(searchQuery)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task number filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Номер задания</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentNumbers.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => resetFilter("number")}
          >
            Все
          </Button>
          {TASK_NUMBERS.map((number) => (
            <Button
              key={number}
              variant={isActive("number", number) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMultiFilter("number", number)}
            >
              {number}
            </Button>
          ))}
          {currentNumbers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetFilter("number")}
            >
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Task type filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Тип задания</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentTypes.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => resetFilter("type")}
          >
            Все
          </Button>
          {uniqueTaskTypes.map((type) => (
            <Button
              key={type.value}
              variant={isActive("type", type.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMultiFilter("type", type.value)}
            >
              {type.label}
            </Button>
          ))}
          {currentTypes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetFilter("type")}
            >
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Source filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Источник</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentSources.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => resetFilter("sourceType")}
          >
            Все
          </Button>
          {SOURCE_TYPES.map((source) => (
            <Button
              key={source.value}
              variant={
                isActive("sourceType", source.value) ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleMultiFilter("sourceType", source.value)}
            >
              {source.label}
            </Button>
          ))}
          {currentSources.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetFilter("sourceType")}
            >
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Year filter (only for "Волны ЕГЭ") */}
      {currentSources.includes("Волны ЕГЭ") && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Год</h3>
            {currentYears.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetFilter("year")}
              >
                Сбросить
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentYears.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => resetFilter("year")}
            >
              Все
            </Button>
            {Array.from({ length: 10 }, (_, i) => {
              const year = (new Date().getFullYear() - i).toString();
              return (
                <Button
                  key={year}
                  variant={isActive("year", year) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMultiFilter("year", year)}
                >
                  {year}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wave filter (only for "Волны ЕГЭ") */}
      {currentSources.includes("Волны ЕГЭ") && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Волна</h3>
            {currentWaves.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetFilter("wave")}
              >
                Сбросить
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentWaves.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => resetFilter("wave")}
            >
              Все
            </Button>
            {WAVE_TYPES.map((wave) => (
              <Button
                key={wave.value}
                variant={isActive("wave", wave.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleMultiFilter("wave", wave.value)}
              >
                {wave.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Reset all filters button */}
      {(currentNumbers.length > 0 ||
        currentTypes.length > 0 ||
        currentSources.length > 0 ||
        currentYears.length > 0 ||
        currentWaves.length > 0 ||
        currentSearch) && (
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={resetAllFilters}
          >
            Сбросить все фильтры
          </Button>
        </div>
      )}
    </div>
  );
};
