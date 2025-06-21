"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface CandidateFormData {
  name: string;
  politicalParty: string;
  description: string;
}

interface CandidateFormProps {
  candidate?: {
    id: number;
    name: string;
    politicalParty: string;
    description: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CandidateForm({ candidate, onSuccess, onCancel }: CandidateFormProps) {
  const [formData, setFormData] = useState<CandidateFormData>({
    name: candidate?.name ?? "",
    politicalParty: candidate?.politicalParty ?? "",
    description: candidate?.description ?? "",
  });
  const [errors, setErrors] = useState<Partial<CandidateFormData>>({});

  const utils = api.useUtils();
  
  const createMutation = api.candidates.create.useMutation({
    onSuccess: (data) => {
      console.log(`✅ [CandidateForm] Create mutation succeeded: ${data.name}`);
      // Invalidate queries to ensure UI updates even if WebSocket fails
      utils.candidates.getAll.invalidate().catch(console.error);
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ [CandidateForm] Create error:", error);
    },
  });

  const updateMutation = api.candidates.update.useMutation({
    onSuccess: (data) => {
      console.log(`✅ [CandidateForm] Update mutation succeeded: ${data.name}`);
      // Invalidate queries to ensure UI updates even if WebSocket fails
      utils.candidates.getAll.invalidate().catch(console.error);
      utils.candidates.getById.invalidate().catch(console.error);
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ [CandidateForm] Update error:", error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CandidateFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name too long";
    }

    if (!formData.politicalParty.trim()) {
      newErrors.politicalParty = "Political party is required";
    } else if (formData.politicalParty.length > 100) {
      newErrors.politicalParty = "Party name too long";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description too long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log(`📝 [CandidateForm] Form submitted:`, formData);
    
    if (!validateForm()) {
      console.log(`❌ [CandidateForm] Form validation failed`);
      return;
    }

    if (candidate) {
      // Update existing candidate
      console.log(`🔄 [CandidateForm] Updating candidate ID: ${candidate.id}`);
      updateMutation.mutate({
        id: candidate.id,
        ...formData,
      });
    } else {
      // Create new candidate
      console.log(`➕ [CandidateForm] Creating new candidate`);
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof CandidateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {candidate ? "Edit Candidate" : "Add New Candidate"}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter candidate's full name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Political Party Field */}
            <div>
              <label htmlFor="politicalParty" className="block text-sm font-medium text-gray-700 mb-2">
                Political Party *
              </label>
              <input
                type="text"
                id="politicalParty"
                value={formData.politicalParty}
                onChange={(e) => handleInputChange("politicalParty", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.politicalParty ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter political party name"
                disabled={isLoading}
              />
              {errors.politicalParty && (
                <p className="mt-1 text-sm text-red-600">{errors.politicalParty}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter candidate's background, experience, and platform (minimum 10 characters)"
                disabled={isLoading}
              />
              <div className="mt-1 text-sm text-gray-500">
                {formData.description.length}/1000 characters
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {candidate ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  candidate ? "Update Candidate" : "Create Candidate"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 