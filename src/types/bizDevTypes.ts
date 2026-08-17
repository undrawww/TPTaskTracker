/* ──────────────────────────────────────────────
   Biz Dev Role Mastery Types
   ────────────────────────────────────────────── */

export const BIZ_DEV_ROLES = ['ASA', 'BSA', 'CRA', 'DCA'] as const;
export type BizDevRole = (typeof BIZ_DEV_ROLES)[number];

export const BACKUP_STATUSES = ['not_ready', 'developing', 'backup_ready'] as const;
export type BackupStatus = (typeof BACKUP_STATUSES)[number];

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  not_ready: 'Not Ready',
  developing: 'Developing',
  backup_ready: 'Backup Ready',
};

export interface MilestoneRequirement {
  id: string;
  label: string;
  target: number;
  current: number;
  isVerified?: boolean;
}

export interface MilestoneDefinition {
  starNumber: 1 | 2 | 3;
  title: string;
  requirements: MilestoneRequirement[];
}

export interface RoleProgress {
  role: BizDevRole;
  milestones: MilestoneDefinition[];
  backupStatus: BackupStatus;
  supervisorVerified: boolean;
}

export interface InternMastery {
  internId: string;
  internName: string;
  primaryRole: BizDevRole;
  roles: Record<BizDevRole, RoleProgress>;
}

/* ──────────────────────────────────────────────
   Role Color Map
   ────────────────────────────────────────────── */

export const ROLE_COLORS: Record<BizDevRole, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  ASA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', darkBg: 'dark:bg-red-500/10', darkText: 'dark:text-red-300' },
  BSA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-300' },
  CRA: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-300' },
  DCA: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', darkBg: 'dark:bg-purple-500/10', darkText: 'dark:text-purple-300' },
};

/* ──────────────────────────────────────────────
   Default Milestone Templates
   ────────────────────────────────────────────── */

export function createDefaultBSAMilestones(): MilestoneDefinition[] {
  return [
    {
      starNumber: 1,
      title: 'Application Processing',
      requirements: [
        { id: 'bsa_s1_apps', label: 'Applications submitted', target: 5, current: 0, isVerified: false },
        { id: 'bsa_s1_log', label: 'Log sheet completed', target: 1, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 2,
      title: 'Proposal Generation',
      requirements: [
        { id: 'bsa_s2_proposals', label: 'Proposals and OPP generated', target: 10, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 3,
      title: 'Updating',
      requirements: [
        { id: 'bsa_s3_cbt', label: 'CBT updated', target: 10, current: 0, isVerified: false },
        { id: 'bsa_s3_cwn', label: 'CWN updated', target: 10, current: 0, isVerified: false },
        { id: 'bsa_s3_cmgc', label: 'CMGC updated', target: 10, current: 0, isVerified: false },
      ],
    },
  ];
}

export function createDefaultCRAMilestones(): MilestoneDefinition[] {
  return [
    {
      starNumber: 1,
      title: 'Client Servicing',
      requirements: [
        { id: 'cra_s1_fs', label: 'FS client servicing', target: 5, current: 0, isVerified: false },
        { id: 'cra_s1_ciu', label: 'CIU client servicing', target: 5, current: 0, isVerified: false },
        { id: 'cra_s1_acr', label: 'ACR client servicing', target: 5, current: 0, isVerified: false },
        { id: 'cra_s1_bcr', label: 'BCR client servicing', target: 5, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 2,
      title: 'CPC Completion',
      requirements: [
        { id: 'cra_s2_premium', label: 'CPC Premium completed', target: 10, current: 0, isVerified: false },
        { id: 'cra_s2_basic', label: 'CPC Basic completed', target: 10, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 3,
      title: 'CMGC Inquiries',
      requirements: [
        { id: 'cra_s3_cmgc', label: 'CMGC inquiries solved', target: 10, current: 0, isVerified: false },
      ],
    },
  ];
}

export function createDefaultDCAMilestones(): MilestoneDefinition[] {
  return [
    {
      starNumber: 1,
      title: 'Client Business Support',
      requirements: [
        { id: 'dca_s1_help', label: 'Sun Life client businesses helped', target: 1, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 2,
      title: 'Short-form Videos',
      requirements: [
        { id: 'dca_s2_videos', label: 'Short-form Sun Life videos (≤30s)', target: 5, current: 0, isVerified: false },
      ],
    },
    {
      starNumber: 3,
      title: 'Long-form Videos',
      requirements: [
        { id: 'dca_s3_videos', label: 'Long-form Sun Life videos created', target: 3, current: 0, isVerified: false },
      ],
    },
  ];
}

export function createDefaultASAMilestones(): MilestoneDefinition[] {
  return [
    {
      starNumber: 1,
      title: 'TBD',
      requirements: [{ id: 'asa_s1_tbd', label: 'Criteria to be determined', target: 1, current: 0, isVerified: false }],
    },
    {
      starNumber: 2,
      title: 'TBD',
      requirements: [{ id: 'asa_s2_tbd', label: 'Criteria to be determined', target: 1, current: 0, isVerified: false }],
    },
    {
      starNumber: 3,
      title: 'TBD',
      requirements: [{ id: 'asa_s3_tbd', label: 'Criteria to be determined', target: 1, current: 0, isVerified: false }],
    },
  ];
}

export function createDefaultRoleProgress(role: BizDevRole): RoleProgress {
  const milestoneCreators: Record<BizDevRole, () => MilestoneDefinition[]> = {
    ASA: createDefaultASAMilestones,
    BSA: createDefaultBSAMilestones,
    CRA: createDefaultCRAMilestones,
    DCA: createDefaultDCAMilestones,
  };
  return {
    role,
    milestones: milestoneCreators[role](),
    backupStatus: 'not_ready',
    supervisorVerified: false,
  };
}

export function createDefaultInternMastery(internId: string, internName: string, primaryRole: BizDevRole): InternMastery {
  return {
    internId,
    internName,
    primaryRole,
    roles: {
      ASA: createDefaultRoleProgress('ASA'),
      BSA: createDefaultRoleProgress('BSA'),
      CRA: createDefaultRoleProgress('CRA'),
      DCA: createDefaultRoleProgress('DCA'),
    },
  };
}

/* ──────────────────────────────────────────────
   Utility: check if a role is TBD (ASA)
   ────────────────────────────────────────────── */
export function isRoleTBD(_role: BizDevRole): boolean {
  return false;
}

/* ──────────────────────────────────────────────
   Utility: count stars earned for a role
   ────────────────────────────────────────────── */
export function countStars(progress: RoleProgress): number {
  if (isRoleTBD(progress.role)) return 0;
  let stars = 0;
  for (const milestone of progress.milestones) {
    const allComplete = milestone.requirements.length > 0 &&
      milestone.requirements.every(r => r.current >= r.target && r.isVerified === true);
    if (allComplete) stars++;
  }
  return stars;
}
