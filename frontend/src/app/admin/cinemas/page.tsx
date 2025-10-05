// app/admin/cinemas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Cinema, adminAPI } from '@/lib/api';

export default function CinemasManagement() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  useEffect(() => {
    loadCinemas();
  }, []);

  const loadCinemas = async () => {
    try {
      const response = await adminAPI.getAllCinemas?.() || await import('@/lib/api').then(module => module.cinemaAPI.getAll());
      setCinemas(response.data);
    } catch (error) {
      console.error('Failed to load cinemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCinema) {
        await adminAPI.updateCinema(editingCinema.id, formData);
      } else {
        await adminAPI.createCinema(formData);
      }
      setShowForm(false);
      setEditingCinema(null);
      setFormData({ name: '', location: '' });
      loadCinemas();
    } catch (error) {
      console.error('Failed to save cinema:', error);
      alert('Failed to save cinema');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cinema?')) return;
    
    try {
      await adminAPI.deleteCinema(id);
      loadCinemas();
    } catch (error) {
      console.error('Failed to delete cinema:', error);
      alert('Failed to delete cinema');
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cinemas Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Cinema
        </button>
      </div>

      {/* Cinema Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCinema ? 'Edit Cinema' : 'Add New Cinema'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Cinema Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCinema(null);
                    setFormData({ name: '', location: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCinema ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cinemas List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cinemas.map((cinema) => (
              <tr key={cinema.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cinema.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cinema.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setEditingCinema(cinema);
                      setFormData({ name: cinema.name, location: cinema.location });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cinema.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cinemas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No cinemas found
        </div>
      )}
    </div>
  );
}