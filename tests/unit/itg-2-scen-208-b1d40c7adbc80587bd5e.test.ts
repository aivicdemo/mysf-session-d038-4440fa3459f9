import { retrieveMappingValidationResultsForProject, MappingValidationResultRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-208: retrieveMappingValidationResultsForProject - 複数件返却', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたプロジェクトIDに属するマッピング検証結果が複数件存在するとき、全件を配列で返す', async () => {
    // 前提条件: projectId = "550e8400-e29b-41d4-a716-446655440001"
    // 前提条件: resolveProjectContext の戻り値 = {
    //   "projectId":"550e8400-e29b-41d4-a716-446655440001",
    //   "projectName":"請求書機能移行プロジェクト",
    //   "userAccessLevel":"full"
    // }
    // 前提条件: マッピング検証結果テーブルの全レコード

    // resolveProjectContext がプロジェクトコンテキストを正常に解決
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      projectName: '請求書機能移行プロジェクト',
      userAccessLevel: 'full',
    });

    // マッピング検証結果テーブルから、移行プロジェクトID="550e8400-e29b-41d4-a716-446655440001" に
    // 一致するレコードが検索される
    const allRecords = [
      {
        id: '650e8400-e29b-41d4-a716-446655440010',
        validationResultId: '650e8400-e29b-41d4-a716-446655440010',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        mappingDetailId: '750e8400-e29b-41d4-a716-446655440001',
        validationStatus: '完了',
        validationTimestamp: '2026-01-15T10:30:00Z',
        validatorId: '850e8400-e29b-41d4-a716-446655440001',
        detectedIssues: 'フィールド長の不一致',
        recommendations: 'フィールド長を512文字に統一',
        riskLevel: '中',
        remediationStatus: '実装完了',
        remarks: 'テスト済み',
        gapClassification: 'データ型差異',
        gapScore: 45,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440011',
        validationResultId: '650e8400-e29b-41d4-a716-446655440011',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        mappingDetailId: '750e8400-e29b-41d4-a716-446655440002',
        validationStatus: '完了',
        validationTimestamp: '2026-01-14T14:15:00Z',
        validatorId: '850e8400-e29b-41d4-a716-446655440002',
        detectedIssues: '計算ロジックの差異',
        recommendations: 'カスタム計算式で実装が必要',
        riskLevel: '高',
        remediationStatus: '検討中',
        remarks: '顧客との調整待ち',
        gapClassification: '計算式差異',
        gapScore: 78,
        createdAt: '2026-01-08T08:00:00Z',
        updatedAt: '2026-01-14T15:30:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440012',
        validationResultId: '650e8400-e29b-41d4-a716-446655440012',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        mappingDetailId: '750e8400-e29b-41d4-a716-446655440003',
        validationStatus: '完了',
        validationTimestamp: '2026-01-13T11:45:00Z',
        validatorId: '850e8400-e29b-41d4-a716-446655440003',
        detectedIssues: '参照関係の不一致',
        recommendations: 'ルックアップフィールドで対応',
        riskLevel: '低',
        remediationStatus: '実装完了',
        remarks: '検証完了',
        gapClassification: '参照関係差異',
        gapScore: 20,
        createdAt: '2026-01-05T07:30:00Z',
        updatedAt: '2026-01-13T12:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440020',
        validationResultId: '650e8400-e29b-41d4-a716-446655440020',
        projectId: '550e8400-e29b-41d4-a716-446655440999',
        mappingDetailId: '750e8400-e29b-41d4-a716-446655440099',
        validationStatus: '完了',
        validationTimestamp: '2026-01-12T13:20:00Z',
        validatorId: '850e8400-e29b-41d4-a716-446655440004',
        detectedIssues: '権限設定の差異',
        recommendations: 'カスタムプロファイルを作成',
        riskLevel: '中',
        remediationStatus: '計画中',
        remarks: '別プロジェクト',
        gapClassification: '権限管理差異',
        gapScore: 35,
        createdAt: '2026-01-02T06:00:00Z',
        updatedAt: '2026-01-12T14:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allRecords);

    // テスト対象の処理を呼び出す
    const result = await retrieveMappingValidationResultsForProject({ projectId });

    // 期待結果: MappingValidationResultRecord[] 型の配列が返される。
    // 配列要素は3件で、以下のレコードを含む：
    // 1件目は検証ステータス「完了」、ギャップスコア45、ギャップ分類「データ型差異」
    // 2件目は検証ステータス「完了」、ギャップスコア78、ギャップ分類「計算式差異」
    // 3件目は検証ステータス「完了」、ギャップスコア20、ギャップ分類「参照関係差異」
    // 異なるプロジェクトID「550e8400-e29b-41d4-a716-446655440999」に属するレコードは配列に含まれない

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    // 1件目の検証
    expect(result[0].validationStatus).toBe('完了');
    expect(result[0].gapScore).toBe(45);
    expect(result[0].gapClassification).toBe('データ型差異');
    expect(result[0].projectId).toBe(projectId);

    // 2件目の検証
    expect(result[1].validationStatus).toBe('完了');
    expect(result[1].gapScore).toBe(78);
    expect(result[1].gapClassification).toBe('計算式差異');
    expect(result[1].projectId).toBe(projectId);

    // 3件目の検証
    expect(result[2].validationStatus).toBe('完了');
    expect(result[2].gapScore).toBe(20);
    expect(result[2].gapClassification).toBe('参照関係差異');
    expect(result[2].projectId).toBe(projectId);

    // 異なるプロジェクトIDのレコードが含まれていないことを確認
    const hasOtherProjectRecord = result.some((record) => record.projectId === '550e8400-e29b-41d4-a716-446655440999');
    expect(hasOtherProjectRecord).toBe(false);
  });
});
