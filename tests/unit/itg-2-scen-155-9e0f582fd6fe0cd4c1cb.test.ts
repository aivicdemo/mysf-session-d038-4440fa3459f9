import { saveMappingValidationResult, InvalidGapClassificationError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-155: saveMappingValidationResult - InvalidGapClassificationError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ギャップ分類が定義済み値（完全対応・部分対応・カスタマイズ必要・非対応）以外の場合、InvalidGapClassificationErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '660e8400-e29b-41d4-a716-446655440001';
    const validatorId = '770e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-10-07T10:30:00.000Z';

    // プロジェクトと機能マッピング詳細は存在する
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            id: projectId,
            プロジェクト名: 'Salesforceリプレース移行',
            ステータス: '進行中',
            作成日時: '2026-09-01T00:00:00.000Z',
            更新日時: '2026-10-06T00:00:00.000Z',
            作成者: 'admin-user-001',
            更新者: 'admin-user-002',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            id: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書作成',
            既存機能説明: 'Oracle ERPシステムでの請求書作成機能',
            マッピング方式: 'カスタムオブジェクト',
            移行ステータス: 'マッピング完了',
            作成日時: '2026-09-15T00:00:00.000Z',
            更新日時: '2026-10-05T00:00:00.000Z',
            作成者: 'mapper-001',
            更新者: 'mapper-002',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '対応可能', // 無効な値
      gapScore: 75,
      riskLevel: '中',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // InvalidGapClassificationError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(InvalidGapClassificationError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      'ギャップ分類が無効です。完全対応、部分対応、カスタマイズ必要、非対応のいずれかを指定してください。'
    );

    // レコード保存が実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
