/**
 * Fixed demo records for the DCBrain "seed" commands.
 *
 * Each module has a FIXED count (no CLI override) with deliberately varied
 * select fields (priority / severity / hold-point / status) so the module's
 * KPI cards and filters show a realistic non-zero spread in the demo.
 *
 * Content is themed for "Orion Data Centre Phase 1" — a Tier III data-centre
 * EPC project (electrical, mechanical/HVAC, fire, BMS, commissioning).
 */

export type ModuleKey =
  | 'rfis'
  | 'ncrs'
  | 'inspections'
  | 'commissioning'
  | 'change-orders'
  | 'simulations'
  | 'reports';

export const MODULE_KEYS: readonly ModuleKey[] = [
  'rfis',
  'ncrs',
  'inspections',
  'commissioning',
  'change-orders',
  'simulations',
  'reports',
] as const;

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type ReportType = 'DAILY' | 'WEEKLY' | 'EXECUTIVE' | 'COMPLIANCE' | 'RISK' | 'PROCUREMENT';

export interface RfiRecord {
  subject: string;
  question: string;
  priority: Priority;
  discipline?: string;
}

export interface NcrRecord {
  title: string;
  description: string;
  severity: Severity;
  discipline?: string;
  rootCause?: string;
}

export interface InspectionRecord {
  title: string;
  discipline?: string;
  itpRef?: string;
  inspector?: string;
  holdPoint: boolean;
}

export interface CommissioningRecord {
  systemName: string;
  testRef?: string;
  discipline?: string;
  procedure?: string;
  testedBy?: string;
}

export interface ChangeOrderRecord {
  title: string;
  description: string;
  reason?: string;
  costImpact: number;
  scheduleImpactDays: number;
}

export interface SimulationRecord {
  scenarioName: string;
  /** 1-based index into the schedule-activity dropdown (skips the placeholder). */
  activityIndex: number;
  delayDays: number;
}

export interface ReportRecord {
  reportType: ReportType;
}

/** RFIs — 7 records. Priority spread: LOW×1, MEDIUM×3, HIGH×2, CRITICAL×1. */
export const RFIS: readonly RfiRecord[] = [
  {
    subject: 'CRAC unit airflow vs ASHRAE TC 9.9 envelope',
    question:
      'Please confirm the supply-air temperature setpoint for the CRAC units in Data Hall 1. The mechanical schedule shows 22°C but the ASHRAE TC 9.9 recommended envelope suggests we can raise it. Clarify the design intent before commissioning.',
    priority: 'MEDIUM',
    discipline: 'Mechanical & HVAC',
  },
  {
    subject: 'Busway current rating for 2N UPS distribution',
    question:
      'The single-line diagram specifies a 1600A busway on the 2N UPS feed, but the load schedule totals 1720A at design capacity. Confirm whether the busway should be upsized to 2000A or the load re-balanced.',
    priority: 'HIGH',
    discipline: 'Electrical',
  },
  {
    subject: 'Fire suppression agent for battery rooms',
    question:
      'Which clean-agent suppression system is approved for the VRLA battery rooms — NOVEC 1230 or IG-541? The fire spec references both. This affects the gas storage layout and room integrity requirements.',
    priority: 'CRITICAL',
    discipline: 'Fire, BMS & Security',
  },
  {
    subject: 'Raised floor height in Data Hall 2',
    question:
      'Drawing A-201 shows a 600mm raised floor, structural shows 750mm. Confirm the finished floor-to-floor dimension so we can order the correct pedestal heights.',
    priority: 'MEDIUM',
    discipline: 'Structural',
  },
  {
    subject: 'Cable tray fill ratio for containment',
    question:
      'Confirm the maximum permissible cable-tray fill ratio for the hot-aisle containment routes. Current design is at 48% — please confirm this meets the project standard of 40% max.',
    priority: 'LOW',
    discipline: 'Electrical',
  },
  {
    subject: 'Chilled water pipe insulation thickness',
    question:
      'The mechanical spec calls for 25mm insulation on chilled-water pipework, but the energy model assumes 40mm. Confirm which value governs for the primary loop.',
    priority: 'MEDIUM',
    discipline: 'Mechanical & HVAC',
  },
  {
    subject: 'BMS integration protocol for generators',
    question:
      'Confirm whether the standby generators integrate to the BMS via Modbus TCP or BACnet/IP. The controls spec and the generator submittal disagree, impacting the head-end configuration.',
    priority: 'HIGH',
    discipline: 'Fire, BMS & Security',
  },
];

/** NCRs — 6 records. Severity spread: MINOR×2, MAJOR×3, CRITICAL×1. */
export const NCRS: readonly NcrRecord[] = [
  {
    title: 'Containment gap in Hot Aisle 3',
    description:
      'Blanking panels missing across 12U of rack space in Hot Aisle 3, allowing hot-air recirculation. Thermal survey shows a 4°C rise at the top of adjacent racks.',
    severity: 'MAJOR',
    discipline: 'Mechanical & HVAC',
    rootCause: 'Blanking panels not delivered with the rack shipment.',
  },
  {
    title: 'Earth-bond continuity failure at PDU-07',
    description:
      'Continuity test between PDU-07 chassis and the main earth bar exceeded 0.1Ω. Bonding conductor found loose at the lug termination.',
    severity: 'CRITICAL',
    discipline: 'Electrical',
    rootCause: 'Under-torqued lug termination during install.',
  },
  {
    title: 'Chilled-water pipe weld porosity',
    description:
      'Radiographic testing of weld CW-14 on the primary chilled-water loop revealed porosity exceeding the acceptance criteria in the welding procedure spec.',
    severity: 'MAJOR',
    discipline: 'Mechanical & HVAC',
    rootCause: 'Inadequate gas shielding during welding.',
  },
  {
    title: 'Fire-stop penetration seal incomplete',
    description:
      'Cable penetration through the 2-hour fire barrier at grid line C/4 was not sealed with the approved fire-stop system at the time of inspection.',
    severity: 'MAJOR',
    discipline: 'Fire, BMS & Security',
    rootCause: 'Sequencing — cabling completed after barrier sign-off.',
  },
  {
    title: 'Incorrect label on distribution board DB-2A',
    description:
      'Circuit schedule label on DB-2A does not match the as-installed circuit allocation. Minor documentation discrepancy, no safety impact.',
    severity: 'MINOR',
    discipline: 'Electrical',
    rootCause: 'Late circuit re-allocation not reflected on the printed label.',
  },
  {
    title: 'Raised-floor pedestal adhesive cure time',
    description:
      'Several raised-floor pedestals in Data Hall 2 were loaded before the adhesive reached full cure, per the installer log. Spot checks show acceptable stability but the deviation is recorded.',
    severity: 'MINOR',
    discipline: 'Structural',
    rootCause: 'Programme pressure shortened the specified cure window.',
  },
];

/** Inspections — 6 records. Hold-points: 2 of 6. */
export const INSPECTIONS: readonly InspectionRecord[] = [
  {
    title: 'Main LV switchboard installation check',
    discipline: 'Electrical',
    itpRef: 'ITP-EL-001',
    inspector: 'A. Mehra',
    holdPoint: true,
  },
  {
    title: 'Chilled-water pressure test — primary loop',
    discipline: 'Mechanical & HVAC',
    itpRef: 'ITP-ME-004',
    inspector: 'R. Nair',
    holdPoint: true,
  },
  {
    title: 'Fire-stop penetration seal verification',
    discipline: 'Fire, BMS & Security',
    itpRef: 'ITP-FR-002',
    inspector: 'S. Khan',
    holdPoint: false,
  },
  {
    title: 'Raised-floor level and grid alignment',
    discipline: 'Structural',
    itpRef: 'ITP-ST-003',
    inspector: 'P. Rao',
    holdPoint: false,
  },
  {
    title: 'Earth-bonding continuity — Data Hall 1',
    discipline: 'Electrical',
    itpRef: 'ITP-EL-006',
    inspector: 'A. Mehra',
    holdPoint: false,
  },
  {
    title: 'CRAC unit setting-to-work inspection',
    discipline: 'Mechanical & HVAC',
    itpRef: 'ITP-ME-009',
    inspector: 'R. Nair',
    holdPoint: false,
  },
];

/** Commissioning — 5 records. */
export const COMMISSIONING: readonly CommissioningRecord[] = [
  {
    systemName: 'Cooling System A — Primary Chilled Water',
    testRef: 'CX-001',
    discipline: 'Mechanical & HVAC',
    procedure: 'Chilled-water loop functional performance test',
    testedBy: 'R. Nair',
  },
  {
    systemName: 'UPS System 2N — Module A',
    testRef: 'CX-002',
    discipline: 'Electrical',
    procedure: 'UPS load-bank and battery autonomy test',
    testedBy: 'A. Mehra',
  },
  {
    systemName: 'Standby Generator G1',
    testRef: 'CX-003',
    discipline: 'Electrical',
    procedure: 'Black-start and load-acceptance test',
    testedBy: 'A. Mehra',
  },
  {
    systemName: 'Fire Detection & VESDA — Data Hall 1',
    testRef: 'CX-004',
    discipline: 'Fire, BMS & Security',
    procedure: 'Cause-and-effect matrix verification',
    testedBy: 'S. Khan',
  },
  {
    systemName: 'BMS Head-End Integration',
    testRef: 'CX-005',
    discipline: 'Fire, BMS & Security',
    procedure: 'Point-to-point I/O verification',
    testedBy: 'M. Iyer',
  },
];

/** Change Orders — 4 records with varied cost/schedule impact. */
export const CHANGE_ORDERS: readonly ChangeOrderRecord[] = [
  {
    title: 'Upsize 2N UPS busway to 2000A',
    description:
      'Replace the specified 1600A busway on the 2N UPS distribution with 2000A to accommodate the revised load schedule and provide headroom for Phase 2.',
    reason: 'Load schedule exceeded original busway rating (see RFI on busway rating).',
    costImpact: 125000,
    scheduleImpactDays: 5,
  },
  {
    title: 'Substitute chilled-water valve vendor',
    description:
      'Approve alternative butterfly-valve vendor for the chilled-water loop due to lead-time on the specified brand. Equivalent pressure/temperature rating.',
    reason: 'Specified vendor lead-time slipped 10 weeks; substitution recovers programme.',
    costImpact: -20000,
    scheduleImpactDays: 0,
  },
  {
    title: 'Add second VESDA loop in Data Hall 2',
    description:
      'Client-requested addition of a redundant VESDA aspirating-smoke-detection loop in Data Hall 2 for enhanced early-warning coverage.',
    reason: 'Client risk-reduction request post design review.',
    costImpact: 48000,
    scheduleImpactDays: 12,
  },
  {
    title: 'Additional standby generator for N+1',
    description:
      'Add one 2.5MW standby generator to move the backup topology from N to N+1, including associated fuel, switchgear and controls integration.',
    reason: 'Uptime requirement raised to Tier III+ during stakeholder review.',
    costImpact: 310000,
    scheduleImpactDays: 30,
  },
];

/** Simulations — 3 delay scenarios targeting distinct schedule activities. */
export const SIMULATIONS: readonly SimulationRecord[] = [
  { scenarioName: 'UPS Commissioning Slip', activityIndex: 2, delayDays: 30 },
  { scenarioName: 'Switchgear Late Energisation', activityIndex: 3, delayDays: 7 },
];

/** Reports — 1 executive briefing (snapshots the other modules). */
export const REPORTS: readonly ReportRecord[] = [{ reportType: 'EXECUTIVE' }];

export const SEED_COUNTS: Readonly<Record<ModuleKey, number>> = {
  rfis: RFIS.length,
  ncrs: NCRS.length,
  inspections: INSPECTIONS.length,
  commissioning: COMMISSIONING.length,
  'change-orders': CHANGE_ORDERS.length,
  simulations: SIMULATIONS.length,
  reports: REPORTS.length,
};
