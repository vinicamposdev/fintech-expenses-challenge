import { useState } from 'react';
import { useCategories, useDeleteCategory } from '../hooks';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryList } from '../components/CategoryList';

export function Categories(): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: categories = [], isLoading, error } = useCategories();
  const deleteMutation = useDeleteCategory();

  const handleCreateSuccess = (): void => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleDeleteClick = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            New Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <CategoryForm
            editingId={editingId}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">
            Failed to load categories. Please try again.
          </div>
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No categories yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first category
          </button>
        </div>
      )}

      {!isLoading && categories.length > 0 && (
        <CategoryList
          categories={categories}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onDelete={handleDeleteClick}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
