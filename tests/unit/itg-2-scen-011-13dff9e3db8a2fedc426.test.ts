import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingGenerationAuditTrail: jest.fn(),
}));

describe('SCEN-011: データ収集が一部成功した場合', () => {
  let mockAiClient: jest.Mocked<Tx9Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {
      extractDataItems: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
    } as any;
  });

  it('ステータスが partial_success となり、収集済みデータと欠落項目を含むレスポンスが返される', async () => {
    const input = {
      projectId: 'proj-migration-001',
      targetSystemCandidates: [
        {
          systemId: 'sys-oracle-001',
          systemName: 'Oracle ERP',
          systemDescription: '移行対象のOracle請求システム',
        },
        {
          systemId: 'sys-sap-001',
          systemName: 'SAP S/4HANA',
          systemDescription: '移行対象のSAP請求システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: [
          'invoice_id',
          'invoice_date',
          'invoice_amount',
          'line_item_description',
          'unit_price',
          'quantity',
          'tax_amount',
        ],
        departmentSources: [
          {
            departmentName: '会計部門',
            sourceSystemIds: ['sys-oracle-001'],
          },
          {
            departmentName: '営業部門',
            sourceSystemIds: ['sys-sap-001'],
          },
        ],
        collectionDeadline: '2026-01-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 80,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2026-01-20T10:00:00Z',
      executingUserId: 'user-pm-001',
    };

    // スタブ化：認証成功
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      userId: 'user-pm-001',
      roles: ['mapping_executor'],
      permissionLevel: 'full',
    });

    // スタブ化：プロジェクトコンテキスト解決成功
    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-001',
      resolved: true,
      accessible: true,
      targetSystemIds: ['sys-oracle-001', 'sys-sap-001'],
    });

    // スタブ化：マッピング詳細取得成功
    (persistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-001',
      status: 'ACTIVE',
      projectName: 'Salesforce移行プロジェクト',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });

    // AI クライアント：データ抽出（6項目）
    mockAiClient.extractDataItems = jest.fn().mockResolvedValue({
      items: [
        {
          itemName: 'invoice_id',
          itemType: 'string',
          sourceSystem: 'sys-oracle-001',
          extractedValue: 'INV-001',
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
        {
          itemName: 'invoice_date',
          itemType: 'date',
          sourceSystem: 'sys-oracle-001',
          extractedValue: '2026-01-15',
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
        {
          itemName: 'invoice_amount',
          itemType: 'number',
          sourceSystem: 'sys-oracle-001',
          extractedValue: 150000,
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
        {
          itemName: 'line_item_description',
          itemType: 'string',
          sourceSystem: 'sys-sap-001',
          extractedValue: 'Software License',
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
        {
          itemName: 'unit_price',
          itemType: 'number',
          sourceSystem: 'sys-sap-001',
          extractedValue: 50000,
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
        {
          itemName: 'quantity',
          itemType: 'number',
          sourceSystem: 'sys-sap-001',
          extractedValue: 3,
          extractionTimestamp: '2026-01-20T09:00:00Z',
        },
      ],
    });

    // AI クライアント：データ収集（6項目、tax_amount は欠落）
    mockAiClient.collectData = jest.fn().mockResolvedValue({
      collectedItems: [
        {
          itemName: 'invoice_id',
          itemType: 'string',
          sourceSystem: 'sys-oracle-001',
          collectedValue: 'INV-001',
          collectionTimestamp: '2026-01-20T09:30:00Z',
        },
        {
          itemName: 'invoice_date',
          itemType: 'date',
          sourceSystem: 'sys-oracle-001',
          collectedValue: '2026-01-15',
          collectionTimestamp: '2026-01-20T09:30:00Z',
        },
        {
          itemName: 'invoice_amount',
          itemType: 'number',
          sourceSystem: 'sys-oracle-001',
          collectedValue: 150000,
          collectionTimestamp: '2026-01-20T09:30:00Z',
        },
        {
          itemName: 'line_item_description',
          itemType: 'string',
          sourceSystem: 'sys-sap-001',
          collectedValue: 'Software License',
          collectionTimestamp: '2026-01-20T09:45:00Z',
        },
        {
          itemName: 'unit_price',
          itemType: 'number',
          sourceSystem: 'sys-sap-001',
          collectedValue: 50000,
          collectionTimestamp: '2026-01-20T09:45:00Z',
        },
        {
          itemName: 'quantity',
          itemType: 'number',
          sourceSystem: 'sys-sap-001',
          collectedValue: 3,
          collectionTimestamp: '2026-01-20T09:45:00Z',
        },
      ],
      missingItems: ['tax_amount'],
      completenessPercentage: 85.71,
    });

    // AI クライアント：TCO 計算（3年間）
    mockAiClient.calculateTco = jest.fn().mockResolvedValue({
      tcoResults: [
        {
          systemId: 'sys-oracle-001',
          systemName: 'Oracle ERP',
          yearlyBreakdown: [
            {
              year: 1,
              capitalCost: 500000,
              operatingCost: 300000,
              maintenanceCost: 100000,
              totalCost: 900000,
            },
            {
              year: 2,
              capitalCost: 0,
              operatingCost: 320000,
              maintenanceCost: 110000,
              totalCost: 430000,
            },
            {
              year: 3,
              capitalCost: 0,
              operatingCost: 340000,
              maintenanceCost: 120000,
              totalCost: 460000,
            },
          ],
          threeyearTotalCost: 1790000,
          costPerUser: 35800,
          costPerTransaction: 1790,
          calculationTimestamp: '2026-01-20T09:20:00Z',
        },
        {
          systemId: 'sys-sap-001',
          systemName: 'SAP S/4HANA',
          yearlyBreakdown: [
            {
              year: 1,
              capitalCost: 800000,
              operatingCost: 400000,
              maintenanceCost: 150000,
              totalCost: 1350000,
            },
            {
              year: 2,
              capitalCost: 0,
              operatingCost: 420000,
              maintenanceCost: 160000,
              totalCost: 580000,
            },
            {
              year: 3,
              capitalCost: 0,
              operatingCost: 450000,
              maintenanceCost: 170000,
              totalCost: 620000,
            },
          ],
          threeyearTotalCost: 2550000,
          costPerUser: 51000,
          costPerTransaction: 2550,
          calculationTimestamp: '2026-01-20T09:20:00Z',
        },
      ],
    });

    // AI クライアント：異常値検出
    mockAiClient.detectAnomalies = jest.fn().mockResolvedValue({
      results: [
        {
          systemId: 'sys-oracle-001',
          anomalies: [],
          detectionTimestamp: '2026-01-20T10:00:00Z',
        },
        {
          systemId: 'sys-sap-001',
          anomalies: [],
          detectionTimestamp: '2026-01-20T10:00:00Z',
        },
      ],
    });

    // スタブ化：操作履歴記録成功
    (auditModule.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-trail-20260120-001',
      recorded: true,
      recordedAt: '2026-01-20T10:00:30Z',
    });

    // テスト実行
    const result = await runTx9Imp1Agent(input, mockAiClient);

    // ステータスが partial_success であることを確認
    expect(result.status).toBe('partial_success');

    // 抽出データ項目が 6 件含まれることを確認
    expect(result.extractedDataItems).toHaveLength(6);
    expect(result.extractedDataItems).toContainEqual(
      expect.objectContaining({
        itemName: 'invoice_id',
        itemType: 'string',
        sourceSystem: 'sys-oracle-001',
        extractedValue: 'INV-001',
      })
    );

    // 収集データサマリーの確認
    expect(result.collectedDataSummary).toMatchObject({
      totalItemsRequired: 7,
      totalItemsCollected: 6,
      missingItems: expect.arrayContaining(['tax_amount']),
    });
    expect(result.collectedDataSummary.completenessPercentage).toBeCloseTo(85.71, 1);

    // TCO 計算結果の確認
    expect(result.tcoCalculationResult).toHaveLength(2);
    expect(result.tcoCalculationResult[0]).toMatchObject({
      systemId: 'sys-oracle-001',
      systemName: 'Oracle ERP',
      threeyearTotalCost: 1790000,
      costPerUser: 35800,
    });
    expect(result.tcoCalculationResult[0].yearlyBreakdown).toHaveLength(3);
    expect(result.tcoCalculationResult[1]).toMatchObject({
      systemId: 'sys-sap-001',
      systemName: 'SAP S/4HANA',
      threeyearTotalCost: 2550000,
      costPerUser: 51000,
    });

    // 異常値検出結果の確認
    expect(result.anomalyDetectionResults).toBeDefined();
    expect(result.anomalyDetectionResults.length).toBeGreaterThanOrEqual(1);

    // 実行サマリーの確認
    expect(result.executionSummary).toMatchObject({
      stepsCompleted: expect.arrayContaining([
        'data_extraction',
        'data_collection',
        'tco_calculation',
        'anomaly_detection',
        'audit_trail_recording',
      ]),
      stepsFailed: [],
      errorsCount: 0,
      auditTrailId: 'audit-trail-20260120-001',
    });
    expect(result.executionSummary.warningsCount).toBeGreaterThanOrEqual(1);
    expect(result.executionSummary.totalExecutionTimeMs).toBeGreaterThan(0);
  });
});
