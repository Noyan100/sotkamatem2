// types.ts
// src/types/task.ts
export interface Task {
  id: number;
  number: string;
  text: string;
  image?: string | null;  // Объединяем оба варианта
  videoSrc?: string | null;
  answer: string;
  solution: string;
  type?: string | null;
  sources?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollectionTask {
  id: string;
  taskId: number;
  order: number | null;
  task?: Task;
}

export interface Collection {
  activeAnswer: boolean;
  id: number;
  name: string;
  tasks?: CollectionTask[];
}

