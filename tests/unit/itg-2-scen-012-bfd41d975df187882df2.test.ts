import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditTrailModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-012: 複数の移行対象システム候補が入力された場合、各システムごとのTCO試算結果と異常値検出結果が配列で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成功ステータスで3つのシステムに対するTCO試算結果と異常値検出結果が配列で返される', async () => {
    const targetSystemCandidates = [
      {
        systemId: 'oracle-erp-001',
        systemName: 'Oracle ERP System',
        systemDescription: 'Current Oracle-based billing system',
      },
      {
        systemId: 'sap-s4-001',
        systemName: 'SAP S/4HANA',
        systemDescription: 'Alternative SAP billing platform',
      },
      {
        systemId: 'dynamics-001',
        systemName: 'Microsoft Dynamics 365',
        systemDescription: 'Microsoft cloud ERP option',
      },
    ];

    const dataExtractionScope = {
      requiredDataItems: [
        'invoice_id',
        'customer_id',
        'invoice_date',
        'total_amount',
        'line_item_count',
        'invoice_line_items',
        'unit_cost',
        'quantity',
        'tax_rate',
      ],
      departmentSources: [
        { departmentName: 'Finance', sourceSystemIds: ['oracle-erp-001', 'sap-s4-001', 'dynamics-001'] },
        { departmentName: 'Operations', sourceSystemIds: ['oracle-erp-001', 'dynamics-001'] },
      ],
      collectionDeadline: '2026-12-31T23:59:59Z',
    };

    const anomalyDetectionThresholds = {
      costVariancePercentage: 15,
      dataCompletenessMinimum: 95,
      outlierStandardDeviations: 2.5,
    };

    const mockAiClient: Tx9Imp1AiClient = {
      extractDataItemsFromSystems: jest.fn().mockResolvedValue({
        extractedItems: [
          {
            itemName: 'invoice_id',
            itemType: 'string',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 'INV-001',
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'customer_id',
            itemType: 'string',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 'CUST-001',
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'invoice_date',
            itemType: 'date',
            sourceSystem: 'oracle-erp-001',
            extractedValue: '2026-10-01',
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'total_amount',
            itemType: 'number',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 50000,
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'line_item_count',
            itemType: 'number',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 3,
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'invoice_line_items',
            itemType: 'array',
            sourceSystem: 'oracle-erp-001',
            extractedValue: '[{id: 1, desc: "Item 1", qty: 2, price: 15000}, {id: 2, desc: "Item 2", qty: 1, price: 20000}]',
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'unit_cost',
            itemType: 'number',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 15000,
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'quantity',
            itemType: 'number',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 2,
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'tax_rate',
            itemType: 'number',
            sourceSystem: 'oracle-erp-001',
            extractedValue: 0.1,
            extractionTimestamp: '2026-10-15T10:30:05Z',
          },
          {
            itemName: 'invoice_id',
            itemType: 'string',
            sourceSystem: 'sap-s4-001',
            extractedValue: 'SAP-INV-001',
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'customer_id',
            itemType: 'string',
            sourceSystem: 'sap-s4-001',
            extractedValue: 'SAP-CUST-001',
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'invoice_date',
            itemType: 'date',
            sourceSystem: 'sap-s4-001',
            extractedValue: '2026-10-01',
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'total_amount',
            itemType: 'number',
            sourceSystem: 'sap-s4-001',
            extractedValue: 60000,
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'line_item_count',
            itemType: 'number',
            sourceSystem: 'sap-s4-001',
            extractedValue: 4,
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'invoice_line_items',
            itemType: 'array',
            sourceSystem: 'sap-s4-001',
            extractedValue: '[{id: 1, desc: "SAP Item 1", qty: 3, price: 15000}]',
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'unit_cost',
            itemType: 'number',
            sourceSystem: 'sap-s4-001',
            extractedValue: 15000,
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'quantity',
            itemType: 'number',
            sourceSystem: 'sap-s4-001',
            extractedValue: 3,
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'tax_rate',
            itemType: 'number',
            sourceSystem: 'sap-s4-001',
            extractedValue: 0.08,
            extractionTimestamp: '2026-10-15T10:30:10Z',
          },
          {
            itemName: 'invoice_id',
            itemType: 'string',
            sourceSystem: 'dynamics-001',
            extractedValue: 'DYN-INV-001',
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'customer_id',
            itemType: 'string',
            sourceSystem: 'dynamics-001',
            extractedValue: 'DYN-CUST-001',
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'invoice_date',
            itemType: 'date',
            sourceSystem: 'dynamics-001',
            extractedValue: '2026-10-01',
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'total_amount',
            itemType: 'number',
            sourceSystem: 'dynamics-001',
            extractedValue: 55000,
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'line_item_count',
            itemType: 'number',
            sourceSystem: 'dynamics-001',
            extractedValue: 5,
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'invoice_line_items',
            itemType: 'array',
            sourceSystem: 'dynamics-001',
            extractedValue: '[{id: 1, desc: "Item A", qty: 5, price: 10000}]',
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'unit_cost',
            itemType: 'number',
            sourceSystem: 'dynamics-001',
            extractedValue: 10000,
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'quantity',
            itemType: 'number',
            sourceSystem: 'dynamics-001',
            extractedValue: 5,
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
          {
            itemName: 'tax_rate',
            itemType: 'number',
            sourceSystem: 'dynamics-001',
            extractedValue: 0.12,
            extractionTimestamp: '2026-10-15T10:30:15Z',
          },
        ],
      }),
      collectDataFromDepartments: jest.fn().mockResolvedValue({
        collectedData: {
          totalItemsRequired: 9,
          totalItemsCollected: 9,
          completenessPercentage: 100,
          missingItems: [],
          collectionTimestamp: '2026-10-15T10:30:20Z',
        },
      }),
      calculateTcoCosts: jest.fn().mockResolvedValue({
        tcoResults: [
          {
            systemId: 'oracle-erp-001',
            systemName: 'Oracle ERP System',
            yearlyBreakdown: [
              {
                year: 1,
                capitalCost: 500000,
                operatingCost: 250000,
                maintenanceCost: 50000,
                totalCost: 800000,
              },
              {
                year: 2,
                capitalCost: 0,
                operatingCost: 280000,
                maintenanceCost: 55000,
                totalCost: 335000,
              },
              {
                year: 3,
                capitalCost: 0,
                operatingCost: 310000,
                maintenanceCost: 60000,
                totalCost: 370000,
              },
            ],
            threeyearTotalCost: 1505000,
            costPerUser: 15050,
            costPerTransaction: 6.02,
            calculationTimestamp: '2026-10-15T10:30:25Z',
          },
          {
            systemId: 'sap-s4-001',
            systemName: 'SAP S/4HANA',
            yearlyBreakdown: [
              {
                year: 1,
                capitalCost: 600000,
                operatingCost: 300000,
                maintenanceCost: 60000,
                totalCost: 960000,
              },
              {
                year: 2,
                capitalCost: 0,
                operatingCost: 330000,
                maintenanceCost: 65000,
                totalCost: 395000,
              },
              {
                year: 3,
                capitalCost: 0,
                operatingCost: 360000,
                maintenanceCost: 70000,
                totalCost: 430000,
              },
            ],
            threeyearTotalCost: 1785000,
            costPerUser: 17850,
            costPerTransaction: 7.14,
            calculationTimestamp: '2026-10-15T10:30:25Z',
          },
          {
            systemId: 'dynamics-001',
            systemName: 'Microsoft Dynamics 365',
            yearlyBreakdown: [
              {
                year: 1,
                capitalCost: 400000,
                operatingCost: 200000,
                maintenanceCost: 40000,
                totalCost: 640000,
              },
              {
                year: 2,
                capitalCost: 0,
                operatingCost: 220000,
                maintenanceCost: 44000,
                totalCost: 264000,
              },
              {
                year: 3,
                capitalCost: 0,
                operatingCost: 240000,
                maintenanceCost: 48000,
                totalCost: 288000,
              },
            ],
            threeyearTotalCost: 1192000,
            costPerUser: 11920,
            costPerTransaction: 4.768,
            calculationTimestamp: '2026-10-15T10:30:25Z',
          },
        ],
      }),
      detectAnomalies: jest.fn().mockResolvedValue({
        anomalyResults: [
          {
            systemId: 'oracle-erp-001',
            anomalies: [
              {
                anomalyType: 'cost_variance',
                affectedField: 'operatingCost',
                detectedValue: 280000,
                expectedRange: { min: 238000, max: 272000 },
                severity: 'medium',
                recommendation: '年間運用コストのトレンドを確認してください',
              },
            ],
            detectionTimestamp: '2026-10-15T10:30:30Z',
          },
          {
            systemId: 'sap-s4-001',
            anomalies: [
              {
                anomalyType: 'cost_variance',
                affectedField: 'capitalCost',
                detectedValue: 600000,
                expectedRange: { min: 510000, max: 590000 },
                severity: 'high',
                recommendation: '初期投資額が予想範囲を超えています。見積もり再確認を推奨します',
              },
            ],
            detectionTimestamp: '2026-10-15T10:30:30Z',
          },
          {
            systemId: 'dynamics-001',
            anomalies: [],
            detectionTimestamp: '2026-10-15T10:30:30Z',
          },
        ],
      }),
      organizeDataSheet: jest.fn().mockResolvedValue({
        sheetInfo: {
          sheetId: 'sheet-001',
          sheetName: 'TCO試算結果_2026-10-15',
          rowCount: 27,
          columnCount: 12,
          dataUrl: 'https://data.example.com/sheets/tco-2026-10-15.xlsx',
          generatedTimestamp: '2026-10-15T10:30:35Z',
        },
      }),
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      userId: 'user-migration-lead-001',
      roles: ['migration_project_lead', 'data_analyst'],
      sessionId: 'session-xyz-12345',
      validationTimestamp: '2026-10-15T10:30:00Z',
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migrate-001',
      projectName: 'Salesforce to Multi-System Migration',
      resolved: true,
      resolutionTimestamp: '2026-10-15T10:30:00Z',
    });

    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-migrate-001',
      status: 'active',
      projectStartDate: '2026-09-01T00:00:00Z',
      projectEndDate: '2027-09-01T00:00:00Z',
      scope: {
        objectsInScope: ['Invoice', 'InvoiceLineItem'],
        fieldsInScope: 47,
        estimatedRecordVolume: 250000,
      },
      lastMetadataSyncTimestamp: '2026-10-14T22:00:00Z',
    });

    (auditTrailModule.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-trail-20261015-001',
      projectId: 'proj-migrate-001',
      userId: 'user-migration-lead-001',
      operationName: 'runTx9Imp1Agent',
      recordedTimestamp: '2026-10-15T10:30:05Z',
      recorded: true,
    });

    const input = {
      projectId: 'proj-migrate-001',
      targetSystemCandidates,
      dataExtractionScope,
      tcoPeriodYears: 3,
      anomalyDetectionThresholds,
      currentDateTime: '2026-10-15T10:30:00Z',
      executingUserId: 'user-migration-lead-001',
    };

    const result = await runTx9Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('success');

    expect(result.extractedDataItems).toBeDefined();
    expect(Array.isArray(result.extractedDataItems)).toBe(true);
    expect(result.extractedDataItems.length).toBeGreaterThan(0);

    expect(result.collectedDataSummary).toBeDefined();
    expect(result.collectedDataSummary.totalItemsRequired).toBe(9);
    expect(result.collectedDataSummary.totalItemsCollected).toBeGreaterThanOrEqual(9);
    expect(result.collectedDataSummary.completenessPercentage).toBeGreaterThanOrEqual(95);
    expect(result.collectedDataSummary.missingItems).toBeDefined();
    expect(Array.isArray(result.collectedDataSummary.missingItems)).toBe(true);

    expect(result.tcoCalculationResult).toBeDefined();
    expect(Array.isArray(result.tcoCalculationResult)).toBe(true);
    expect(result.tcoCalculationResult.length).toBe(3);

    const systemIds = result.tcoCalculationResult.map((tco: any) => tco.systemId);
    expect(systemIds).toContain('oracle-erp-001');
    expect(systemIds).toContain('sap-s4-001');
    expect(systemIds).toContain('dynamics-001');

    result.tcoCalculationResult.forEach((tcoResult: any) => {
      expect(tcoResult.systemId).toBeDefined();
      expect(tcoResult.systemName).toBeDefined();
      expect(tcoResult.yearlyBreakdown).toBeDefined();
      expect(Array.isArray(tcoResult.yearlyBreakdown)).toBe(true);
      expect(tcoResult.yearlyBreakdown.length).toBe(3);

      tcoResult.yearlyBreakdown.forEach((yearData: any, index: number) => {
        expect(yearData.year).toBe(index + 1);
        expect(typeof yearData.capitalCost).toBe('number');
        expect(typeof yearData.operatingCost).toBe('number');
        expect(typeof yearData.maintenanceCost).toBe('number');
        expect(typeof yearData.totalCost).toBe('number');
      });

      expect(typeof tcoResult.threeyearTotalCost).toBe('number');
      expect(tcoResult.threeyearTotalCost).toBeGreaterThan(0);
      expect(typeof tcoResult.costPerUser).toBe('number');
      expect(typeof tcoResult.costPerTransaction).toBe('number');
      expect(tcoResult.calculationTimestamp).toBeDefined();
    });

    expect(result.anomalyDetectionResults).toBeDefined();
    expect(Array.isArray(result.anomalyDetectionResults)).toBe(true);
    expect(result.anomalyDetectionResults.length).toBe(3);

    result.anomalyDetectionResults.forEach((anomalyResult: any) => {
      expect(anomalyResult.systemId).toBeDefined();
      expect(Array.isArray(anomalyResult.anomalies)).toBe(true);
      expect(anomalyResult.detectionTimestamp).toBeDefined();

      anomalyResult.anomalies.forEach((anomaly: any) => {
        expect(anomaly.anomalyType).toBeDefined();
        expect(anomaly.affectedField).toBeDefined();
        expect(anomaly.detectedValue).toBeDefined();
        expect(anomaly.expectedRange).toBeDefined();
        expect(anomaly.expectedRange.min).toBeDefined();
        expect(anomaly.expectedRange.max).toBeDefined();
        expect(anomaly.severity).toBeDefined();
        expect(anomaly.recommendation).toBeDefined();
      });
    });

    expect(result.organizedDataSheet).toBeDefined();
    expect(result.organizedDataSheet.sheetId).toBeDefined();
    expect(result.organizedDataSheet.sheetName).toBeDefined();
    expect(typeof result.organizedDataSheet.rowCount).toBe('number');
    expect(typeof result.organizedDataSheet.columnCount).toBe('number');
    expect(result.organizedDataSheet.dataUrl).toBeDefined();
    expect(result.organizedDataSheet.generatedTimestamp).toBeDefined();

    expect(result.executionSummary).toBeDefined();
    expect(typeof result.executionSummary.totalExecutionTimeMs).toBe('number');
    expect(Array.isArray(result.executionSummary.stepsCompleted)).toBe(true);
    expect(result.executionSummary.stepsCompleted).toContain('データ抽出');
    expect(result.executionSummary.stepsCompleted).toContain('データ収集');
    expect(result.executionSummary.stepsCompleted).toContain('TCO計算');
    expect(result.executionSummary.stepsCompleted).toContain('異常値検出');
    expect(result.executionSummary.stepsCompleted).toContain('監査記録');
    expect(Array.isArray(result.executionSummary.stepsFailed)).toBe(true);
    expect(result.executionSummary.stepsFailed.length).toBe(0);
    expect(typeof result.executionSummary.warningsCount).toBe('number');
    expect(result.executionSummary.errorsCount).toBe(0);
    expect(result.executionSummary.auditTrailId).toBe('audit-trail-20261015-001');
  });
});
