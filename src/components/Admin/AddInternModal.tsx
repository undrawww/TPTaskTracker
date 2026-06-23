import React, { useState, useEffect } from 'react';
import { DEPARTMENTS, type Department, type Intern } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  interns: Intern[];
  onSubmit: (data: { email: string; department: Department }) => Promise<{ success: boolean; error?: string } | void>;
}

export const AddInternModal: React.FC<Props> = ({ isOpen, onClose, interns, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<Department>(DEPARTMENTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    
    if (interns.some(i => i.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      setError('This intern has already been added to a department.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await onSubmit({ 
      email: trimmedEmail, 
      department: department
    });
    setSubmitting(false);

    if (!result || result.success !== false) {
      setEmail('');
      setDepartment(DEPARTMENTS[0]);
      onClose();
    } else {
      setError(result.error || 'Failed to add intern.');
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
          <h2 className="text-lg font-semibold">Add Intern</h2>
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
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-teal dark:text-cream mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="intern@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
            />
          </div>

          <div>
              <label htmlFor="intern-department" className="block text-sm font-medium text-teal dark:text-cream mb-1.5">
                Department
              </label>
              <select
                id="intern-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
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
              className="flex-1 px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light text-cream-dark dark:text-teal-light hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-teal font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Adding…' : 'Add Intern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
