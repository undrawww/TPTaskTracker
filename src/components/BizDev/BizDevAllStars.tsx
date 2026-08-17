import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useInterns } from '../../hooks/useInterns';
import { useRoleMastery } from '../../hooks/useRoleMastery';
import {
  BIZ_DEV_ROLES,
  ROLE_COLORS,
  BACKUP_STATUSES,
  BACKUP_STATUS_LABELS,
  countStars,
  isRoleTBD,
  type BizDevRole,
  type BackupStatus,
  type InternMastery,
} from '../../types/bizDevTypes';
import { StarRating } from './StarRating';
import { RoleMasteryModal } from './RoleMasteryModal';

type SortKey = 'name' | 'primaryRole' | 'progress' | 'mastered';
type SortDir = 'asc' | 'desc';

export const BizDevAllStars: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const { interns } = useInterns();
  const {
    masteryData,
    initializeIntern,
    updatePrimaryRole,
    updateMilestoneProgress,
    toggleRequirementVerification,
    updateBackupStatus,
    getStarsForRole,
    getTotalStars,
    getMaxPossibleStars,
    getRecommendedNextRole,
    getSummary,
    removeIntern: removeMasteryIntern,
    autoSyncInterns,
  } = useRoleMastery();

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    internId: string;
    role: BizDevRole;
  }>({ isOpen: false, internId: '', role: 'BSA' });

  // Filters
  const [filterPrimaryRole, setFilterPrimaryRole] = useState<BizDevRole | 'all'>('all');
  const [filterBackupStatus, setFilterBackupStatus] = useState<BackupStatus | 'all'>('all');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('primaryRole');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const maxStars = getMaxPossibleStars();
  const summary = getSummary();

  // Auto-sync available interns
  React.useEffect(() => {
    if (interns.length > 0) {
      autoSyncInterns(interns);
    }
  }, [interns, autoSyncInterns]);

  // Filtered & sorted mastery data
  const filteredData = useMemo(() => {
    let data = [...masteryData];

    if (filterPrimaryRole !== 'all') {
      data = data.filter(m => m.primaryRole === filterPrimaryRole);
    }

    if (filterBackupStatus !== 'all') {
      data = data.filter(m =>
        BIZ_DEV_ROLES.some(r => m.roles[r].backupStatus === filterBackupStatus)
      );
    }

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.internName.localeCompare(b.internName);
          break;
        case 'primaryRole':
          cmp = a.primaryRole.localeCompare(b.primaryRole);
          break;
        case 'progress':
          cmp = getTotalStars(a.internId) - getTotalStars(b.internId);
          break;
        case 'mastered': {
          const aMastered = BIZ_DEV_ROLES.filter(r => !isRoleTBD(r) && countStars(a.roles[r]) === 3).length;
          const bMastered = BIZ_DEV_ROLES.filter(r => !isRoleTBD(r) && countStars(b.roles[r]) === 3).length;
          cmp = aMastered - bMastered;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [masteryData, filterPrimaryRole, filterBackupStatus, sortKey, sortDir, getTotalStars]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const openModal = (internId: string, role: BizDevRole) => {
    setModalState({ isOpen: true, internId, role });
  };

  const modalIntern = masteryData.find(m => m.internId === modalState.internId);

  const getBackupRoles = (intern: InternMastery): string[] => {
    return BIZ_DEV_ROLES.filter(r =>
      r !== intern.primaryRole && !isRoleTBD(r) && intern.roles[r].backupStatus === 'backup_ready'
    );
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" className={`transition-all ${active ? 'text-gold' : 'text-teal/20 dark:text-white/15'}`}>
      {dir === 'asc' ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-teal dark:text-cream leading-tight">Biz Dev All-Stars</h2>
          <p className="text-sm text-teal/50 dark:text-cream/40 mt-1 max-w-3xl">
            Master your primary role, then gain exposure to other roles to build team-wide capability and backup coverage.
          </p>
        </div>
      </div>

      {/* Summary Cards (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Interns', value: summary.totalInterns, icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            ), color: 'text-teal-lighter dark:text-teal-lighter' },
            { label: 'Roles with Full Mastery', value: summary.rolesWithFullMastery, icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ebbc0f" stroke="#ebbc0f" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ), color: 'text-gold dark:text-gold' },
            { label: 'Backup Ready', value: summary.internsReadyAsBackups, icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ), color: 'text-status-done' },
            { label: 'Cross-Training', value: summary.internsInCrossTraining, icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            ), color: 'text-status-progress' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-[#002833]/80 rounded-2xl p-4 border border-teal/10 dark:border-white/5 hover:shadow-md transition-shadow"
            >
              <div className={`mb-2 ${card.color}`}>{card.icon}</div>
              <p className="text-2xl font-poppins font-bold text-teal dark:text-cream">{card.value}</p>
              <p className="text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Role Coverage (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.roleCoverage.map((rc) => {
            const colors = ROLE_COLORS[rc.role];
            const isTBD = isRoleTBD(rc.role);
            return (
              <div
                key={rc.role}
                className={`rounded-xl p-4 border transition-all ${
                  isTBD
                    ? 'border-teal/5 dark:border-white/[0.03] opacity-50'
                    : 'border-teal/10 dark:border-white/5'
                } bg-white dark:bg-[#002833]/60`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                    {rc.role}
                  </span>
                  {isTBD && (
                    <span className="text-[9px] font-bold text-teal/25 dark:text-white/15 uppercase tracking-wider">TBD</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-teal/50 dark:text-white/40">Primary</span>
                    <span className="font-bold text-teal dark:text-cream">{rc.primaryCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-teal/50 dark:text-white/40">Backup Ready</span>
                    <span className="font-bold text-status-done">{rc.backupReadyCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-teal/50 dark:text-white/40">Developing</span>
                    <span className="font-bold text-gold-dark dark:text-gold">{rc.developingCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter & Sort Bar */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-teal/40 dark:text-white/30 uppercase tracking-wider">Filter:</span>
            <div className="relative">
              <select
                value={filterPrimaryRole}
                onChange={(e) => setFilterPrimaryRole(e.target.value as BizDevRole | 'all')}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-teal/10 dark:border-white/10 bg-white dark:bg-[#002833] text-teal dark:text-cream font-medium cursor-pointer"
              >
                <option value="all">All Roles</option>
                {BIZ_DEV_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-teal/50 dark:text-cream/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-teal/40 dark:text-white/30 uppercase tracking-wider">Backup Status:</span>
            <div className="relative">
              <select
                value={filterBackupStatus}
                onChange={(e) => setFilterBackupStatus(e.target.value as BackupStatus | 'all')}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-teal/10 dark:border-white/10 bg-white dark:bg-[#002833] text-teal dark:text-cream font-medium cursor-pointer"
              >
                <option value="all">Any Status</option>
                {BACKUP_STATUSES.map(s => (
                  <option key={s} value={s}>{BACKUP_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-teal/50 dark:text-cream/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1" />
        </div>
      )}

      {/* Main Mastery Table */}
      {masteryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="flex items-center gap-1 mb-4">
            {[0, 1, 2].map(i => (
              <svg key={i} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal/15 dark:text-white/10">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">No interns tracked yet</h3>
          <p className="text-sm text-teal/50 dark:text-cream/40 max-w-md text-center">
            Click "Add Intern" to start tracking Biz Dev role mastery for your team.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#002833]/60 rounded-2xl border border-teal/10 dark:border-white/5 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-teal/10 dark:border-white/5">
                  <th className="text-left px-5 py-3.5">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider hover:text-teal dark:hover:text-cream transition-colors">
                      Intern
                      <SortIcon active={sortKey === 'name'} dir={sortKey === 'name' ? sortDir : 'asc'} />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3.5">
                    <button onClick={() => handleSort('primaryRole')} className="flex items-center gap-1.5 text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider hover:text-teal dark:hover:text-cream transition-colors mx-auto">
                      Primary
                      <SortIcon active={sortKey === 'primaryRole'} dir={sortKey === 'primaryRole' ? sortDir : 'asc'} />
                    </button>
                  </th>
                  {BIZ_DEV_ROLES.map(role => (
                    <th key={role} className="text-center px-3 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[role].text} ${ROLE_COLORS[role].darkText}`}>
                        {role}
                      </span>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3.5">
                    <span className="text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider">Backup</span>
                  </th>
                  <th className="text-center px-3 py-3.5">
                    <button onClick={() => handleSort('progress')} className="flex items-center gap-1.5 text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider hover:text-teal dark:hover:text-cream transition-colors mx-auto">
                      Progress
                      <SortIcon active={sortKey === 'progress'} dir={sortKey === 'progress' ? sortDir : 'asc'} />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3.5">
                    <span className="text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider">Next</span>
                  </th>
                  {isAdmin && (
                    <th className="text-center px-3 py-3.5">
                      <span className="text-[10px] font-bold text-teal/50 dark:text-white/40 uppercase tracking-wider"></span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((intern, idx) => {
                  const totalStars = getTotalStars(intern.internId);
                  const recommended = getRecommendedNextRole(intern.internId);
                  const backupRoles = getBackupRoles(intern);
                  const progressPct = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;

                  return (
                    <motion.tr
                      key={intern.internId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-teal/5 dark:border-white/[0.03] hover:bg-teal/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-teal dark:text-cream text-sm">{intern.internName}</span>
                      </td>

                      {/* Primary Role */}
                      <td className="text-center px-3 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${ROLE_COLORS[intern.primaryRole].bg} ${ROLE_COLORS[intern.primaryRole].text} ${ROLE_COLORS[intern.primaryRole].darkBg} ${ROLE_COLORS[intern.primaryRole].darkText}`}>
                          {intern.primaryRole}
                        </span>
                      </td>

                      {/* Role Stars */}
                      {BIZ_DEV_ROLES.map(r => {
                        const stars = getStarsForRole(intern.internId, r);
                        const isPrimary = intern.primaryRole === r;
                        return (
                          <td key={r} className={`text-center px-3 py-3.5 ${isPrimary ? 'bg-gold/[0.04] dark:bg-gold/[0.03]' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              {isPrimary && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-gold-dark dark:text-gold/70 leading-none">Primary</span>
                              )}
                              <StarRating
                                stars={stars}
                                role={r}
                                size="sm"
                                onClick={() => openModal(intern.internId, r)}
                              />
                            </div>
                          </td>
                        );
                      })}

                      {/* Backup Ready */}
                      <td className="text-center px-3 py-3.5">
                        {backupRoles.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-1">
                            {backupRoles.map(r => (
                              <span key={r} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ROLE_COLORS[r as BizDevRole].bg} ${ROLE_COLORS[r as BizDevRole].text} ${ROLE_COLORS[r as BizDevRole].darkBg} ${ROLE_COLORS[r as BizDevRole].darkText}`}>
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-teal/25 dark:text-white/15">—</span>
                        )}
                      </td>

                      {/* Overall Progress */}
                      <td className="text-center px-3 py-3.5">
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                          <span className="text-xs font-bold tabular-nums text-teal dark:text-cream">{totalStars}/{maxStars}</span>
                          <div className="w-full h-1.5 rounded-full bg-teal/5 dark:bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Recommended Next */}
                      <td className="text-center px-3 py-3.5">
                        {recommended ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ROLE_COLORS[recommended].bg} ${ROLE_COLORS[recommended].text} ${ROLE_COLORS[recommended].darkBg} ${ROLE_COLORS[recommended].darkText}`}>
                            {recommended}
                          </span>
                        ) : (
                          <span className="text-[10px] text-teal/25 dark:text-white/15">
                            {countStars(intern.roles[intern.primaryRole]) < 3 ? 'Master primary first' : '—'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="text-center px-3 py-3.5">
                          <button
                            onClick={() => removeMasteryIntern(intern.internId)}
                            className="p-1.5 rounded-lg text-teal/20 dark:text-white/15 hover:text-status-hold hover:bg-status-hold/10 transition-colors"
                            title="Remove from tracker"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Mastery Modal */}
      {modalIntern && (
        <RoleMasteryModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
          internName={modalIntern.internName}
          role={modalState.role}
          roleProgress={modalIntern.roles[modalState.role]}
          isPrimary={modalState.role === modalIntern.primaryRole}
          isAdmin={isAdmin}
          onUpdateProgress={(star, reqId, val) =>
            updateMilestoneProgress(modalIntern.internId, modalState.role, star, reqId, val)
          }
          onToggleVerification={(star, reqId) =>
            toggleRequirementVerification(modalIntern.internId, modalState.role, star, reqId)
          }
          onUpdateBackupStatus={(status) => updateBackupStatus(modalIntern.internId, modalState.role, status)}
        />
      )}
    </div>
  );
};
