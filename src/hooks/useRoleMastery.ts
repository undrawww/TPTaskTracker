import { useState, useCallback, useEffect } from 'react';
import {
  type BizDevRole,
  type BackupStatus,
  type InternMastery,
  createDefaultInternMastery,
  countStars,
  isRoleTBD,
  BIZ_DEV_ROLES,
} from '../types/bizDevTypes';
import type { Intern } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'tp_role_mastery';

function loadMasteryDataFallback(): InternMastery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export interface RoleCoverageSummary {
  role: BizDevRole;
  primaryCount: number;
  backupReadyCount: number;
  developingCount: number;
}

export interface MasterySummary {
  totalInterns: number;
  rolesWithFullMastery: number;
  internsReadyAsBackups: number;
  internsInCrossTraining: number;
  roleCoverage: RoleCoverageSummary[];
}

export function useRoleMastery() {
  const [masteryData, setMasteryData] = useState<InternMastery[]>(loadMasteryDataFallback());
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) {
        setMasteryData(loadMasteryDataFallback());
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('role_mastery').select('*');
        if (error) throw error;
        
        if (data) {
          const parsed = data.map(row => ({
            internId: row.intern_id,
            internName: row.intern_name,
            primaryRole: row.primary_role as BizDevRole,
            roles: row.roles_data,
          }));
          setMasteryData(parsed);
        }
      } catch (err) {
        console.error('Failed to load role mastery from Supabase:', err);
        setMasteryData(loadMasteryDataFallback());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveToDb = async (intern: InternMastery) => {
    if (!isSupabaseConfigured) {
      // Fallback
      return;
    }
    try {
      await supabase.from('role_mastery').upsert({
        intern_id: intern.internId,
        intern_name: intern.internName,
        primary_role: intern.primaryRole,
        roles_data: intern.roles,
        updated_at: new Date().toISOString()
      }, { onConflict: 'intern_id' });
    } catch (err) {
      console.error('Failed to save role mastery to DB:', err);
    }
  };

  // Sync to localStorage as backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masteryData));
  }, [masteryData]);

  const initializeIntern = useCallback((internId: string, internName: string, primaryRole: BizDevRole) => {
    setMasteryData(prev => {
      if (prev.some(m => m.internId === internId)) return prev;
      return [...prev, createDefaultInternMastery(internId, internName, primaryRole)];
    });
  }, []);

  const autoSyncInterns = useCallback((interns: Intern[]) => {
    setMasteryData(prev => {
      let changed = false;
      const newData = [...prev];
      
      interns.forEach(intern => {
        if (intern.department === 'BizDev Leadership Team' || (intern.department as string).includes('Administrator')) return;
        
        const mappedRole = 
          intern.department === 'Advisor Support Associate' ? 'ASA' :
          intern.department === 'Business Support Associate' ? 'BSA' :
          intern.department === 'Client Relations Associate' ? 'CRA' :
          intern.department === 'Design Content Associate' ? 'DCA' : null;
          
        if (mappedRole && !newData.some(m => m.internId === intern.id)) {
          const newMastery = createDefaultInternMastery(intern.id, intern.full_name, mappedRole);
          newData.push(newMastery);
          saveToDb(newMastery); // Save to DB
          changed = true;
        }
      });
      
      return changed ? newData : prev;
    });
  }, []);

  const removeIntern = useCallback((internId: string) => {
    setMasteryData(prev => prev.filter(m => m.internId !== internId));
  }, []);

  const updatePrimaryRole = useCallback((internId: string, newRole: BizDevRole) => {
    setMasteryData(prev => prev.map(m => {
      if (m.internId === internId) {
        const updated = { ...m, primaryRole: newRole };
        saveToDb(updated);
        return updated;
      }
      return m;
    }));
  }, []);

  const updateMilestoneProgress = useCallback(
    (internId: string, role: BizDevRole, starNumber: 1 | 2 | 3, reqId: string, newValue: number) => {
      setMasteryData(prev => prev.map(m => {
        if (m.internId !== internId) return m;
        const roleProgress = { ...m.roles[role] };
        roleProgress.milestones = roleProgress.milestones.map(ms => {
          if (ms.starNumber !== starNumber) return ms;
          return {
            ...ms,
            requirements: ms.requirements.map(r =>
              r.id === reqId ? { ...r, current: Math.max(0, Math.min(newValue, r.target)) } : r
            ),
          };
        });
        const updated = { ...m, roles: { ...m.roles, [role]: roleProgress } };
        saveToDb(updated);
        return updated;
      }));
    },
    []
  );

  const toggleRequirementVerification = useCallback(
    (internId: string, role: BizDevRole, starNumber: 1 | 2 | 3, reqId: string) => {
      setMasteryData(prev => prev.map(m => {
        if (m.internId !== internId) return m;
        const roleProgress = { ...m.roles[role] };
        roleProgress.milestones = roleProgress.milestones.map(ms => {
          if (ms.starNumber !== starNumber) return ms;
          return {
            ...ms,
            requirements: ms.requirements.map(r =>
              r.id === reqId ? { ...r, isVerified: !r.isVerified } : r
            ),
          };
        });
        const updated = { ...m, roles: { ...m.roles, [role]: roleProgress } };
        saveToDb(updated);
        return updated;
      }));
    },
    []
  );

  const updateBackupStatus = useCallback((internId: string, role: BizDevRole, status: BackupStatus) => {
    setMasteryData(prev => prev.map(m => {
      if (m.internId !== internId) return m;
      const roleProgress = { ...m.roles[role], backupStatus: status };
      const updated = { ...m, roles: { ...m.roles, [role]: roleProgress } };
      saveToDb(updated);
      return updated;
    }));
  }, []);

  const getStarsForRole = useCallback((internId: string, role: BizDevRole): number => {
    const intern = masteryData.find(m => m.internId === internId);
    if (!intern) return 0;
    return countStars(intern.roles[role]);
  }, [masteryData]);

  const getTotalStars = useCallback((internId: string): number => {
    const intern = masteryData.find(m => m.internId === internId);
    if (!intern) return 0;
    return BIZ_DEV_ROLES.reduce((sum, role) => sum + countStars(intern.roles[role]), 0);
  }, [masteryData]);

  const getMaxPossibleStars = useCallback((): number => {
    // ASA is TBD so max is 9 (3 roles × 3 stars)
    return BIZ_DEV_ROLES.filter(r => !isRoleTBD(r)).length * 3;
  }, []);

  const getRecommendedNextRole = useCallback((internId: string): BizDevRole | null => {
    const intern = masteryData.find(m => m.internId === internId);
    if (!intern) return null;

    // Only recommend if primary role is mastered
    const primaryStars = countStars(intern.roles[intern.primaryRole]);
    if (primaryStars < 3) return null;

    // Find the non-primary, non-TBD role with the lowest stars
    let lowestStars = Infinity;
    let recommended: BizDevRole | null = null;

    for (const role of BIZ_DEV_ROLES) {
      if (role === intern.primaryRole || isRoleTBD(role)) continue;
      const stars = countStars(intern.roles[role]);
      if (stars < lowestStars) {
        lowestStars = stars;
        recommended = role;
      }
    }
    return recommended;
  }, [masteryData]);

  const getSummary = useCallback((): MasterySummary => {
    const totalInterns = masteryData.length;

    let rolesWithFullMastery = 0;
    let internsReadyAsBackups = 0;
    let internsInCrossTraining = 0;

    for (const intern of masteryData) {
      let hasMastered = false;
      let isBackup = false;
      let isCrossTraining = false;

      for (const role of BIZ_DEV_ROLES) {
        if (isRoleTBD(role)) continue;
        const stars = countStars(intern.roles[role]);
        
        if (stars === 3) hasMastered = true;
        
        if (intern.roles[role].backupStatus === 'backup_ready') {
          isBackup = true;
        }
        if (stars > 0 && stars < 3) {
          isCrossTraining = true;
        }
      }

      if (hasMastered) rolesWithFullMastery++;
      if (isBackup) internsReadyAsBackups++;
      if (isCrossTraining) internsInCrossTraining++;
    }

    const roleCoverage: RoleCoverageSummary[] = BIZ_DEV_ROLES.map(role => ({
      role,
      primaryCount: masteryData.filter(m => m.primaryRole === role).length,
      backupReadyCount: masteryData.filter(m => m.roles[role].backupStatus === 'backup_ready').length,
      developingCount: masteryData.filter(m => m.roles[role].backupStatus === 'developing').length,
    }));

    return { totalInterns, rolesWithFullMastery, internsReadyAsBackups, internsInCrossTraining, roleCoverage };
  }, [masteryData]);

  return {
    masteryData,
    isLoading: loading,
    initializeIntern,
    removeIntern,
    updatePrimaryRole,
    updateMilestoneProgress,
    toggleRequirementVerification,
    updateBackupStatus,
    getStarsForRole,
    getTotalStars,
    getMaxPossibleStars,
    getRecommendedNextRole,
    getSummary,
    autoSyncInterns,
  };
}
