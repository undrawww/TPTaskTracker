import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type BizDevRole,
  type BackupStatus,
  type RoleProgress,
  type MilestoneDefinition,
  isRoleTBD,
  countStars,
  BACKUP_STATUS_LABELS,
  ROLE_COLORS,
} from '../../types/bizDevTypes';
import { StarRating } from './StarRating';

interface RoleMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  internName: string;
  role: BizDevRole;
  roleProgress: RoleProgress;
  isPrimary: boolean;
  isAdmin: boolean;
  onUpdateProgress: (starNumber: 1 | 2 | 3, reqId: string, newValue: number) => void;
  onToggleVerification: (starNumber: 1 | 2 | 3, reqId: string) => void;
  onUpdateBackupStatus: (status: BackupStatus) => void;
}

export const RoleMasteryModal: React.FC<RoleMasteryModalProps> = ({
  isOpen,
  onClose,
  internName,
  role,
  roleProgress,
  isPrimary,
  isAdmin,
  onUpdateProgress,
  onToggleVerification,
  onUpdateBackupStatus,
}) => {
  const isTBD = isRoleTBD(role);
  const stars = countStars(roleProgress);
  const colors = ROLE_COLORS[role];
  const [editingReq, setEditingReq] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const isMilestoneComplete = (ms: MilestoneDefinition): boolean => {
    return ms.requirements.length > 0 && ms.requirements.every(r => r.current >= r.target && r.isVerified === true);
  };

  const getMilestoneProgress = (ms: MilestoneDefinition): number => {
    if (ms.requirements.length === 0) return 0;
    const total = ms.requirements.reduce((sum, r) => sum + r.target, 0);
    const current = ms.requirements.reduce((sum, r) => sum + Math.min(r.current, r.target), 0);
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  const handleSaveEdit = (starNumber: 1 | 2 | 3, reqId: string) => {
    onUpdateProgress(starNumber, reqId, editValue);
    setEditingReq(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#001f26] rounded-2xl shadow-2xl border border-teal/10 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-teal/10 dark:border-white/5 bg-teal/5 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                    {role}
                  </div>
                  {isPrimary && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold-dark dark:bg-gold/15 dark:text-gold">
                      Primary
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-teal/10 dark:hover:bg-white/10 text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-teal dark:text-cream">{internName}</h3>
                  <p className="text-sm text-teal/50 dark:text-cream/40 mt-0.5">
                    {isTBD ? 'Milestones not yet defined' : `Current Rating`}
                  </p>
                </div>
                {!isTBD && (
                  <StarRating stars={stars} role={role} size="lg" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {isTBD ? (
                <div className="flex flex-col items-center justify-center py-12 text-teal/30 dark:text-white/20">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm font-medium">ASA milestone criteria are coming soon</p>
                  <p className="text-xs mt-1">The system will be updated once the criteria are finalized.</p>
                </div>
              ) : (
                <>
                  {roleProgress.milestones.map((ms) => {
                    const complete = isMilestoneComplete(ms);
                    const progress = getMilestoneProgress(ms);
                    return (
                      <div
                        key={ms.starNumber}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          complete
                            ? 'border-gold/30 bg-gold/5 dark:border-gold/20 dark:bg-gold/5'
                            : 'border-teal/10 bg-teal/[0.02] dark:border-white/5 dark:bg-white/[0.02]'
                        }`}
                      >
                        {/* Milestone header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              complete
                                ? 'bg-gold/20 dark:bg-gold/15'
                                : 'bg-teal/5 dark:bg-white/5'
                            }`}>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={complete ? '#ebbc0f' : 'none'}
                                stroke={complete ? '#ebbc0f' : 'currentColor'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={complete ? '' : 'text-teal/30 dark:text-white/20'}
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-teal dark:text-cream">
                                Star {ms.starNumber} — {ms.title}
                              </h4>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            complete
                              ? 'bg-status-done/10 text-status-done'
                              : 'bg-teal/5 text-teal/40 dark:bg-white/5 dark:text-white/30'
                          }`}>
                            {complete ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        {/* Overall milestone progress bar */}
                        <div className="mb-3">
                          <div className="h-1.5 rounded-full bg-teal/5 dark:bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                complete
                                  ? 'bg-gradient-to-r from-gold to-gold-light'
                                  : 'bg-gradient-to-r from-teal-light to-teal-lighter dark:from-teal-lighter dark:to-teal-light'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-teal/40 dark:text-white/30 mt-1 text-right font-medium">{progress}%</p>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2.5">
                          {ms.requirements.map((req) => {
                            const reqTargetMet = req.current >= req.target;
                            const reqComplete = reqTargetMet && req.isVerified === true;
                            const reqProgress = Math.round((Math.min(req.current, req.target) / req.target) * 100);
                            const isEditing = editingReq === req.id;

                            return (
                              <div
                                key={req.id}
                                className="flex items-center gap-3"
                              >
                                {/* Completion indicator (Verification Checkbox) */}
                                <button
                                  onClick={() => {
                                    if (isAdmin) {
                                      // If not met yet, clicking the checkbox will max out the count AND verify it?
                                      // The user said "even i put there 3/3 it will still not verified as 1 star when i not clicked the check box"
                                      // So the checkbox only toggles verification. We will just trigger onToggleVerification.
                                      onToggleVerification(ms.starNumber, req.id);
                                    }
                                  }}
                                  disabled={!isAdmin}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                    isAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                                  } ${
                                    reqComplete
                                      ? 'bg-status-done text-white border-transparent shadow-[0_0_8px_rgba(45,188,145,0.4)]'
                                      : reqTargetMet
                                      ? 'bg-gold/10 border-2 border-gold text-gold hover:bg-gold hover:text-white'
                                      : 'border-2 border-teal/20 dark:border-white/10 hover:border-teal/40 dark:hover:border-white/30'
                                  }`}
                                >
                                  {reqComplete && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                  {!reqComplete && reqTargetMet && isAdmin && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>

                                {/* Requirement details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-medium ${reqComplete ? 'text-teal dark:text-cream' : 'text-teal/60 dark:text-cream/50'}`}>
                                      {req.label}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isEditing && isAdmin ? (
                                        <div className="flex items-center gap-1.5">
                                          <div className="flex items-center gap-0.5 bg-teal/5 dark:bg-white/5 p-0.5 rounded-lg border border-teal/20 dark:border-white/10">
                                            <button 
                                              type="button"
                                              onClick={() => setEditValue(Math.max(0, editValue - 1))}
                                              className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-[#002833] text-teal/70 dark:text-cream/70 hover:text-teal dark:hover:text-cream hover:bg-teal/5 dark:hover:bg-white/10 shadow-sm transition-colors active:scale-95"
                                            >
                                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </button>
                                            <input
                                              type="number"
                                              min={0}
                                              max={req.target}
                                              value={editValue}
                                              onChange={(e) => setEditValue(Math.max(0, Math.min(parseInt(e.target.value) || 0, req.target)))}
                                              className="w-7 px-0 py-0.5 text-xs font-bold text-center bg-transparent text-teal dark:text-cream outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(ms.starNumber, req.id);
                                                if (e.key === 'Escape') setEditingReq(null);
                                              }}
                                            />
                                            <button 
                                              type="button"
                                              onClick={() => setEditValue(Math.min(req.target, editValue + 1))}
                                              className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-[#002833] text-teal/70 dark:text-cream/70 hover:text-teal dark:hover:text-cream hover:bg-teal/5 dark:hover:bg-white/10 shadow-sm transition-colors active:scale-95"
                                            >
                                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </button>
                                          </div>
                                          <span className="text-[10px] text-teal/40 dark:text-white/30">/ {req.target}</span>
                                          <button
                                            onClick={() => handleSaveEdit(ms.starNumber, req.id)}
                                            className="p-1 rounded-md bg-status-done/10 text-status-done hover:bg-status-done/20 transition-colors"
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => setEditingReq(null)}
                                            className="p-1 rounded-md bg-status-hold/10 text-status-hold hover:bg-status-hold/20 transition-colors"
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                              <line x1="18" y1="6" x2="6" y2="18" />
                                              <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            if (isAdmin) {
                                              setEditingReq(req.id);
                                              setEditValue(req.current);
                                            }
                                          }}
                                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tabular-nums rounded-lg border transition-all ${
                                            reqComplete
                                              ? 'bg-status-done/10 border-status-done/20 text-status-done'
                                              : 'bg-teal/5 border-teal/10 text-teal/70 dark:bg-white/5 dark:border-white/10 dark:text-cream/70'
                                          } ${isAdmin ? 'hover:bg-teal/10 hover:border-teal/20 dark:hover:bg-white/10 dark:hover:border-white/20 cursor-pointer shadow-sm hover:shadow active:scale-95' : ''}`}
                                        >
                                          <span>{req.current} / {req.target}</span>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Requirement mini progress bar */}
                                  <div className="h-1 rounded-full bg-teal/5 dark:bg-white/5 mt-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        reqComplete
                                          ? 'bg-status-done'
                                          : 'bg-teal/20 dark:bg-white/15'
                                      }`}
                                      style={{ width: `${reqProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Backup Status */}
              {!isTBD && (
                <div className="rounded-xl border border-teal/10 dark:border-white/5 p-4 bg-teal/[0.02] dark:bg-white/[0.02]">
                  <h4 className="text-sm font-bold text-teal dark:text-cream mb-3 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M17 11l2 2 4-4" />
                    </svg>
                    Backup Capability
                  </h4>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <div className="relative">
                        <select
                          value={roleProgress.backupStatus}
                          onChange={(e) => onUpdateBackupStatus(e.target.value as BackupStatus)}
                          className="appearance-none px-3 pr-8 py-2 text-sm rounded-xl border border-teal/15 dark:border-white/10 bg-white dark:bg-[#002833] text-teal dark:text-cream font-medium focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all cursor-pointer"
                        >
                          <option value="not_ready">Not Ready</option>
                          <option value="developing">Developing</option>
                          <option value="backup_ready">Backup Ready</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal/50 dark:text-cream/40">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        roleProgress.backupStatus === 'backup_ready'
                          ? 'bg-status-done/10 text-status-done'
                          : roleProgress.backupStatus === 'developing'
                            ? 'bg-gold/10 text-gold-dark dark:text-gold'
                            : 'bg-teal/5 text-teal/40 dark:bg-white/5 dark:text-white/30'
                      }`}>
                        {BACKUP_STATUS_LABELS[roleProgress.backupStatus]}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
