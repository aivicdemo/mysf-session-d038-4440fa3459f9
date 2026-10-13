import { runTx12Imp1Agent, Tx12Imp1AiClient } from '../../src/agents/tx-12-imp-1/orchestrator';

interface Tx12Imp1AgentInput {
  projectId: string;
  targetSystemId: string;
  userId: string;
  existingProcessDefinitions: Array<{
    processName: string;
    processDescription: string;
    workflowSteps: Array<{ stepName: string; stepLogic: string }>;
    calculationLogics: Array<{ logicName: string; logicExpression: string }>;
  }>;
  partnerConfirmationDetails: Array<{
    confirmationTopic: string;
    confirmedContent: string;
    confirmationDate: string;
    confirmedBy: string;
  }>;
  executionTimestamp: string;
}

interface Tx12Imp1AgentOutput {
  status: string;
  mappingTableId: string | null;
  validationResults: Array<{
    mappingId: string;
    gapClassification: string;
    gapScore: number;
    validationStatus: string;
  }>;
  riskAssessments: Array<{
    riskId: string;
    riskClassification: string;
    riskScore: number;
    mitigationStrategy: string;
  }>;
  technicalSpecification: {
    specificationId: string;
    content: string;
    generatedAt: string;
  };
  operationGuideInfo: {
    guideId: string;
    requiredSections: Array<string>;
    completionPercentage: number;
  };
  auditTrailId: string | null;
  errorMessage: string | null;
}

describe('runTx12Imp1Agent - SCEN-014: Complete workflow from process analysis to operation guide', () => {
  let mockAiClient: jest.Mocked<Tx12Imp1AiClient>;

  beforeEach(() => {
    mockAiClient = {
      action01: jest.fn(),
      action02: jest.fn(),
      action03: jest.fn(),
      action04: jest.fn(),
      action05: jest.fn(),
    } as any;
  });

  it('should execute complete workflow and generate all artifacts', async () => {
    const input: Tx12Imp1AgentInput = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-system-oracle-erp-001',
      userId: 'user-migration-admin-001',
      existingProcessDefinitions: [
        {
          processName: '請求書生成プロセス',
          processDescription: '商談から請求書を自動生成するワークフロー',
          workflowSteps: [
            { stepName: '取引先検証', stepLogic: '取引先レコードが有効であることを確認' },
            { stepName: '請求明細集計', stepLogic: '商談商品から請求明細を作成し合計金額を計算' },
            { stepName: '請求書確定', stepLogic: '請求書ステータスを確定に更新' },
          ],
          calculationLogics: [
            { logicName: '税抜金額計算', logicExpression: '請求明細.金額 = 商談商品.単価 × 商談商品.数量' },
            { logicName: '税金計算', logicExpression: '請求書.税金 = SUM(請求明細.税抜金額) × 0.10' },
            { logicName: '請求金額計算', logicExpression: '請求書.合計金額 = SUM(請求明細.税抜金額) + 請求書.税金' },
          ],
        },
        {
          processName: '請求書承認プロセス',
          processDescription: '生成された請求書に対する承認フロー',
          workflowSteps: [
            { stepName: '初期承認', stepLogic: '部門マネージャーによる確認' },
            { stepName: '最終承認', stepLogic: '財務部門責任者による最終確認' },
          ],
          calculationLogics: [
            { logicName: '承認ルーティング', logicExpression: '請求金額 > 100万円 の場合は取締役承認も必須' },
          ],
        },
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書オブジェクトの必須フィールド',
          confirmedContent: '請求書番号、請求日、請求先、請求金額、ステータスは Salesforce と Oracle ERP で同じように実装する',
          confirmationDate: '2026-10-05',
          confirmedBy: 'partner-finance-lead-001',
        },
        {
          confirmationTopic: '計算ロジックの差分対応',
          confirmedContent: 'Salesforce の計算項目を Oracle ERP では Trigger/Procedure で実装。税計算ロジックは両システムで一致させる',
          confirmationDate: '2026-10-05',
          confirmedBy: 'partner-tech-lead-001',
        },
        {
          confirmationTopic: '承認フロー移行',
          confirmedContent: '100万円以上の請求書は取締役承認を必須とする要件を Oracle ERP の承認プロセスに組み込む',
          confirmationDate: '2026-10-05',
          confirmedBy: 'partner-process-lead-001',
        },
      ],
      executionTimestamp: '2026-10-07T10:30:00Z',
    };

    mockAiClient.action01.mockResolvedValue({
      projectContext: {
        projectId: 'proj-salesforce-migration-001',
        targetSystemId: 'target-system-oracle-erp-001',
      },
    });

    mockAiClient.action02.mockResolvedValue({
      userAuth: {
        userId: 'user-migration-admin-001',
        authenticationStatus: 'verified',
        authorizationStatus: 'authorized',
      },
    });

    mockAiClient.action03.mockResolvedValue({
      mappingTableId: 'mapping-table-001',
    });

    mockAiClient.action04.mockResolvedValue({
      validationResults: [
        { mappingId: 'map-001', gapClassification: 'exact-match', gapScore: 0, validationStatus: 'passed' },
        { mappingId: 'map-002', gapClassification: 'calculation-logic-difference', gapScore: 2, validationStatus: 'passed' },
        { mappingId: 'map-003', gapClassification: 'workflow-adaptation-required', gapScore: 3, validationStatus: 'passed' },
        { mappingId: 'map-004', gapClassification: 'exact-match', gapScore: 0, validationStatus: 'passed' },
        { mappingId: 'map-005', gapClassification: 'exact-match', gapScore: 0, validationStatus: 'passed' },
      ],
      riskAssessments: [
        {
          riskId: 'risk-001',
          riskClassification: 'calculation-logic-implementation',
          riskScore: 7,
          mitigationStrategy: 'Oracle ERP の Trigger/Procedure で計算ロジックを実装し、Salesforce との検証テストを実施',
        },
        {
          riskId: 'risk-002',
          riskClassification: 'approval-process-complexity',
          riskScore: 5,
          mitigationStrategy: '承認ルーティングロジックを詳細設計し、段階的なテストを実施',
        },
        {
          riskId: 'risk-003',
          riskClassification: 'data-consistency',
          riskScore: 6,
          mitigationStrategy: '移行前後のデータ検証スクリプトを開発し、差分を監視',
        },
      ],
      technicalSpecification: {
        specificationId: 'spec-001',
        content: 'Technical specification for Oracle ERP migration',
        generatedAt: '2026-10-07T10:30:00Z',
      },
      operationGuideInfo: {
        guideId: 'guide-001',
        requiredSections: [
          'マッピング概要',
          '計算ロジック実装ガイド',
          '承認フロー設定',
          'データ移行手順',
          'テスト計画',
        ],
        completionPercentage: 100,
      },
      auditTrailId: 'audit-trail-001',
    });

    const result = await runTx12Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.mappingTableId).toBe('mapping-table-001');
    expect(result.validationResults).toHaveLength(5);
    expect(result.validationResults[0]).toEqual({
      mappingId: 'map-001',
      gapClassification: 'exact-match',
      gapScore: 0,
      validationStatus: 'passed',
    });
    expect(result.validationResults[1]).toEqual({
      mappingId: 'map-002',
      gapClassification: 'calculation-logic-difference',
      gapScore: 2,
      validationStatus: 'passed',
    });
    expect(result.validationResults[2]).toEqual({
      mappingId: 'map-003',
      gapClassification: 'workflow-adaptation-required',
      gapScore: 3,
      validationStatus: 'passed',
    });
    expect(result.validationResults[3]).toEqual({
      mappingId: 'map-004',
      gapClassification: 'exact-match',
      gapScore: 0,
      validationStatus: 'passed',
    });
    expect(result.validationResults[4]).toEqual({
      mappingId: 'map-005',
      gapClassification: 'exact-match',
      gapScore: 0,
      validationStatus: 'passed',
    });

    expect(result.riskAssessments).toHaveLength(3);
    expect(result.riskAssessments[0]).toEqual({
      riskId: 'risk-001',
      riskClassification: 'calculation-logic-implementation',
      riskScore: 7,
      mitigationStrategy: 'Oracle ERP の Trigger/Procedure で計算ロジックを実装し、Salesforce との検証テストを実施',
    });
    expect(result.riskAssessments[1]).toEqual({
      riskId: 'risk-002',
      riskClassification: 'approval-process-complexity',
      riskScore: 5,
      mitigationStrategy: '承認ルーティングロジックを詳細設計し、段階的なテストを実施',
    });
    expect(result.riskAssessments[2]).toEqual({
      riskId: 'risk-003',
      riskClassification: 'data-consistency',
      riskScore: 6,
      mitigationStrategy: '移行前後のデータ検証スクリプトを開発し、差分を監視',
    });

    expect(result.technicalSpecification).toBeDefined();
    expect(result.technicalSpecification.specificationId).toBe('spec-001');
    expect(result.technicalSpecification.content).toBeDefined();
    expect(result.technicalSpecification.generatedAt).toBe('2026-10-07T10:30:00Z');

    expect(result.operationGuideInfo).toBeDefined();
    expect(result.operationGuideInfo.guideId).toBe('guide-001');
    expect(result.operationGuideInfo.requiredSections).toEqual([
      'マッピング概要',
      '計算ロジック実装ガイド',
      '承認フロー設定',
      'データ移行手順',
      'テスト計画',
    ]);
    expect(result.operationGuideInfo.completionPercentage).toBe(100);

    expect(result.auditTrailId).toBe('audit-trail-001');
    expect(result.errorMessage).toBeNull();
  });
});
