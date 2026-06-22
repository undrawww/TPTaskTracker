import React, { useState } from 'react';
import type { Intern } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  interns: Intern[];
  onSubmit: (internId: string, taskName: string) => Promise<{ success: boolean; error?: string }>;
}

export const CreateTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  interns,
  onSubmit,
}) => {
  const [internId, setInternId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internId) {
      setError('Please select an intern.');
      return;
    }
    if (!taskName.trim()) {
      setError('Please enter a task name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await onSubmit(internId, taskName.trim());

    setSubmitting(false);

    if (result.success) {
      setTaskName('');
      setInternId('');
      onClose();
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#002b36] rounded-2xl shadow-xl w-full max-w-md mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-teal dark:bg-[#00151a] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Task</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Intern selector */}
          <div>
            <label htmlFor="task-intern" className="block text-sm font-medium text-teal dark:text-cream mb-1.5">
              Assign To
            </label>
            <select
              id="task-intern"
              value={internId}
              onChange={(e) => setInternId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="">Select an intern…</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.full_name} — {intern.department}
                </option>
              ))}
            </select>
          </div>

          {/* Task name */}
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-teal dark:text-cream mb-1.5">
              Task Name
            </label>
            <input
              id="task-name"
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Review onboarding materials"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-status-hold bg-status-hold-bg px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-cream-dark text-teal/60 hover:bg-cream transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-teal font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
