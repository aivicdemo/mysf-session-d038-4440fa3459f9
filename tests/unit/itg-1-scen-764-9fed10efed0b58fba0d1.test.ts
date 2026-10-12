import { saveAnomalyDetectionLog } from '../../src/logic/data-persistence';
import type { SaveAnomalyDetectionLogInput, SaveAnomalyDetectionLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-764: saveAnomalyDetectionLog - 既存異常検知ログ更新', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存の異常検知ログを更新するとき、入力値で既存レコードを更新して保存後の内容が返される', async () => {
    const existingRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      異常検知ログID: '550e8400-e29b-41d4-a716-446655440000',
      検知日時: '2024-01-15T10:30:00Z',
      異常タイプ: '金額ズレ',
      重要度: '高',
      対象テーブル: '請求明細',
      対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
      検証ルールID: '770e8400-e29b-41d4-a716-446655440002',
      異常内容: '請求額が仕入額と一致していない',
      期待値: '50000',
      実際値: '48500',
      ステータス: '未対応',
      対応者ID: null,
      対応日時: null,
      対応コメント: null,
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedAt: '2024-01-15T10:30:00Z',
      updatedBy: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    const mockOutput: SaveAnomalyDetectionLogOutput = {
      anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440000',
      detectionDateTime: '2024-01-15T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '中',
      targetTable: '請求明細',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
      anomalyContent: '請求額が仕入額と一致していない。再計算が必要。',
      expectedValue: '50000',
      actualValue: '48500',
      status: '対応中',
      responderId: 'user-002',
      responseDateTime: '2024-01-15T14:45:00Z',
      responseComment: '金額を再計算し、50000に修正しました。',
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedAt: '2024-01-15T14:45:00Z',
      updatedBy: 'user-002',
    };

    (dataStore.updateRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveAnomalyDetectionLogInput = {
      anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440000',
      detectionDateTime: '2024-01-15T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '中',
      targetTable: '請求明細',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
      anomalyContent: '請求額が仕入額と一致していない。再計算が必要。',
      expectedValue: '50000',
      actualValue: '48500',
      status: '対応中',
      responderId: 'user-002',
      responseDateTime: '2024-01-15T14:45:00Z',
      responseComment: '金額を再計算し、50000に修正しました。',
      currentUserId: 'user-002',
      operationTimestamp: '2024-01-15T14:45:00Z',
    };

    const result = await saveAnomalyDetectionLog(input);

    expect(result.anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.detectionDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.anomalyType).toBe('金額ズレ');
    expect(result.severity).toBe('中');
    expect(result.targetTable).toBe('請求明細');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.validationRuleId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.anomalyContent).toBe('請求額が仕入額と一致していない。再計算が必要。');
    expect(result.expectedValue).toBe('50000');
    expect(result.actualValue).toBe('48500');
    expect(result.status).toBe('対応中');
    expect(result.responderId).toBe('user-002');
    expect(result.responseDateTime).toBe('2024-01-15T14:45:00Z');
    expect(result.responseComment).toBe('金額を再計算し、50000に修正しました。');
    expect(result.createdAt).toBe('2024-01-15T10:30:00Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedAt).toBe('2024-01-15T14:45:00Z');
    expect(result.updatedBy).toBe('user-002');
  });
});
