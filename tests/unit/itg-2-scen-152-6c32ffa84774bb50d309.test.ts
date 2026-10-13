import { saveMappingValidationResult, MappingValidationResultRecord, recordOperationAuditTrail } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-152: saveMappingValidationResult - 正常系で検証結果レコードが保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須項目を全て入力し、参照先プロジェクトと機能マッピング詳細が存在する場合、検証結果レコードが保存され返される', async () => {
    const projectId = 'proj-001';
    const mappingDetailId = 'mapping-detail-001';
    const validatorId = 'validator-user-001';
    const validationTimestamp = '2026-02-10T10:30:00Z';
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const now = new Date().toISOString();

    // プロジェクトの存在確認
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            プロジェクトID: projectId,
            プロジェクト名: 'Salesforce移行プロジェクト',
            説明: '既存Salesforceからの移行',
            ステータス: 'active',
            開始予定日: '2026-01-01T00:00:00Z',
            終了予定日: '2026-12-31T23:59:59Z',
            実開始日: '2026-01-15T00:00:00Z',
            実終了日: null,
            移行元システム: 'Salesforce',
            プロジェクトマネージャー: 'PM-user-001',
            進捗率: 45,
            作成日時: '2026-01-01T10:00:00Z',
            更新日時: '2026-02-01T15:30:00Z',
            作成者: 'admin-001',
            更新者: 'admin-001',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            機能マッピング詳細ID: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書発行',
            既存機能説明: 'Salesforceカスタムオブジェクトで構築した請求書管理機能',
            マッピング対象オブジェクトID: 'obj-001',
            マッピング方式: 'direct_mapping',
            実装方針: '標準オブジェクト+カスタムフィールド',
            移行ステータス: 'in_progress',
            優先度: 1,
            複雑度: 'high',
            依存関係: '取引先、商談と連携',
            検証方法: '単体テスト、統合テスト',
            検証ステータス: 'pending',
            備考: '複雑な計算ロジックあり',
            作成日時: '2026-01-10T09:00:00Z',
            作成者: 'mapper-001',
            更新日時: '2026-01-20T14:00:00Z',
            更新者: 'mapper-001',
          },
        ]);
      } else if (tableName === 'マッピング検証結果') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    // データベース作成のモック
    const savedRecord: MappingValidationResultRecord = {
      validationResultId: validationResultId,
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の自動番号採番ロジックがSalesforceの計算式に依存しており、移行先システムでの実装方法を要検討',
      recommendations: '計算ロジックをワークフロールールまたはAPIで実装し、テスト時に既存の採番ロジックとの一致を確認すること',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '請求明細の集計ロジックも類似の課題があり、セットで対応予定',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
      createdAt: now,
      createdBy: validatorId,
      updatedAt: now,
      updatedBy: validatorId,
    };

    jest.spyOn(dataStore, 'createRecord').mockResolvedValue(savedRecord as any);
    jest.spyOn(recordOperationAuditTrail as any, 'recordOperationAuditTrail' as any).mockResolvedValue({
      auditTrailId: 'audit-001',
      userId: validatorId,
      operationType: 'CREATE',
      targetTableName: 'マッピング検証結果',
      targetRecordId: validationResultId,
      operationStatus: '成功',
      operationTimestamp: now,
      createdAt: now,
    });

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の自動番号採番ロジックがSalesforceの計算式に依存しており、移行先システムでの実装方法を要検討',
      recommendations: '計算ロジックをワークフロールールまたはAPIで実装し、テスト時に既存の採番ロジックとの一致を確認すること',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '請求明細の集計ロジックも類似の課題があり、セットで対応予定',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    const result = await saveMappingValidationResult(input);

    // 返されたレコードが期待値と一致することを確認
    expect(result).toEqual(savedRecord);
    expect(result.validationResultId).toBeDefined();
    expect(result.projectId).toBe(projectId);
    expect(result.mappingDetailId).toBe(mappingDetailId);
    expect(result.validationStatus).toBe('検証完了');
    expect(result.gapClassification).toBe('部分対応');
    expect(result.gapScore).toBe(75);
    expect(result.riskLevel).toBe('中');
    expect(result.remediationStatus).toBe('対応中');
    expect(result.createdBy).toBe(validatorId);
    expect(result.updatedBy).toBe(validatorId);

    // createRecord が呼び出されたことを確認
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
