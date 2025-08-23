// constants.ts

// Базовые типы для всех заданий
export const COMMON_TASK_TYPES = [
  { value: "algebra", label: "Алгебра" },
  { value: "geometry", label: "Геометрия" },
  { value: "probability", label: "Теория вероятностей" },
  // ... другие общие типы
] as const;

// Специализированные типы для конкретных заданий
export const SPECIALIZED_TASK_TYPES: Record<string, Array<{value: string, label: string}>> = {
  "1": [ // Для задания №1
    { value: "Окружности", label: "Окружности" },
    { value: "Треугольники", label: "Треугольники" },
    { value: "Четырёхугольники", label: "Четырёхугольники" },
  ],
  "6": [ // Для задания №6
    { value: "Производные", label: "Производные" },
    { value: "Интегралы", label: "Интегралы" },
  ],
  // ... другие специализированные типы
};

// Получаем типы для конкретного номера задания
export const getTaskTypesForNumber = (taskNumber: string) => {
  const specializedTypes = SPECIALIZED_TASK_TYPES[taskNumber] || [];
  return [...COMMON_TASK_TYPES, ...specializedTypes];
};

export const SOURCE_TYPES = [
  { value: "ФИПИ", label: "ФИПИ" },
  { value: "mathege", label: "mathege" },
  { value: "Волны ЕГЭ", label: "Волна ЕГЭ" },
  { value: "Сборники", label: "Сборник задач" },
  { value: "Статград", label: "СтатГрад" },
  { value: "Другое", label: "Другой источник" },
] as const;

export const WAVE_TYPES = [
  { value: "Досрочная волна", label: "Досрочная волна" },
  { value: "Основная волна", label: "Основная волна" },
  { value: "Резервная волна", label: "Резервная волна" },
  { value: "Досрочная волна (резерв)", label: "Досрочная волна (резерв)" },
  { value: "Пересдача", label: "Пересдача" },
] as const;

export const FILTER_SOURCE_TYPES = [
  { value: "Все", label: "Все" },
  { value: "ФИПИ", label: "ФИПИ" },
  { value: "mathege", label: "mathege" },
  { value: "Волны ЕГЭ", label: "Основная волна" },
  { value: "Сборники", label: "Сборники" },
  { value: "Статград", label: "СтатГрад" },
  { value: "Другое", label: "Другие источники" },
] as const;

export const FILTER_TASK_TYPES = [
  { value: "Все", label: "Все" },
  { value: "algebra", label: "Алгебра" },
  { value: "geometry", label: "Геометрия" },
  { value: "triangle", label: "Прямоугольный треугольник" },
] as const;

export const TASK_NUMBERS = Array.from({ length: 19 }, (_, i) => (i + 1).toString());