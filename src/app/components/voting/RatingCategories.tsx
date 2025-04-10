"use client";
import { RatingCategory } from "@/app/types";

interface Props {
  categories: RatingCategory[];
}

export default function RatingCategories({ categories }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900">Rating Categories</h3>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(category => (
          <div key={category.id} className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium">{category.name}</h4>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}