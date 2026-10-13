import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput, MapCalculationLogicsToTargetSystemOutput } from '../../src/logic/calculation-logic-mapper';

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/reference-relationship-analyzer', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reference-relationship-analyzer')>('../../src/logic/reference-relationship-analyzer'),
  analyzeReferenceRelationships: jest.fn(),
}));

describe('SCEN-134: 境界値：計算ロジック配列が空の場合、移行難易度・リスク・工数が適切に初期化され、incompatibleLogicsCountが0で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initialized values with empty calculation logics array', async () => {
    // Setup
    const projectId = 'proj-20260107-001';
    const targetSystemId = 'oracle-erp-2025';
    const userId = 'user-migration-admin-001';
    const executionTimestamp = new Date('2026-01-07T10:30:00Z');

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      projectName: 'Salesforce to Oracle ERP Migration',
      isActive: true,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthorized: true,
      permissions: ['MAPPING_OPERATION', 'RISK_ASSESSMENT', 'LOGIC_MAPPING'],
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      dependencyGraph: [],
      hasCircularDependency: false,
      relationshipCount: 0,
    });

    const calculationLogics: any[] = [];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: '計算フィールド',
        functionCategory: 'calculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'ワークフロー自動化',
        functionCategory: 'automation',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: MapCalculationLogicsToTargetSystemInput = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    // Execute
    const result: MapCalculationLogicsToTargetSystemOutput = await mapCalculationLogicsToTargetSystem(input);

    // Verify
    expect(result.mappingResults).toEqual([]);
    expect(result.overallMigrationComplexity).toBe('Low');
    expect(result.overallMigrationRisk).toBe('Low');
    expect(result.totalEstimatedEffort).toBe(0);
    expect(result.incompatibleLogicsCount).toBe(0);
    expect(result.recommendedMitigationStrategies).toEqual([]);
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
