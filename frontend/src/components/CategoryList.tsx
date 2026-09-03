import type { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  isDeleting,
}: CategoryListProps): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{category.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{category.description || '—'}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(category.id)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(category.id)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
