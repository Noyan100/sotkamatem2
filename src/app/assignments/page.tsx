// app/assignments/page.tsx

"use client";
import prisma from "@/lib/prisma";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function AssignmentsPage() {
  const { data: session, status } = useSession();
  (session?.user as any)?.role !== "ADMIN" && redirect("/tasks");
  // Получаем все CollectionAssignment с вложенными Assignment
  const collectionsWithAssignments = await prisma.collectionAssignment.findMany(
    {
      include: {
        assignments: {
          include: {
            whiteboards: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Все задания</h1>

      {collectionsWithAssignments.map((collection) => (
        <div key={collection.id} className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Коллекция #{collection.id}
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(collection.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-medium mb-2">{assignment.title}</h3>
                {assignment.description && (
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{assignment.whiteboards.length} доски</span>
                  <span>
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
