import { fetchAllActivityResults, FetchAllActivityResultsInput } from '../../src/logic/data-persistence';
import { DataStoreError } from '../../src/platform/data-store';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-860: 活動結果マスタテーブルへのアクセス失敗時に設計済みエラーが発生する', () => {
  it('DataStoreError で失敗したときに「活動結果マスタの取得に失敗しました。システム管理者に連絡してください。」メッセージが含まれたエラーが発生する', async () => {
    const error = new DataStoreError('活動結果マスタの取得に失敗しました。システム管理者に連絡してください。');
    (dataStore.listRecords as jest.Mock).mockRejectedValue(error);

    const input: FetchAllActivityResultsInput = {};

    await expect(fetchAllActivityResults(input)).rejects.toThrow(
      '活動結果マスタの取得に失敗しました。システム管理者に連絡してください。'
    );

    await expect(fetchAllActivityResults(input)).rejects.toBeInstanceOf(DataStoreError);
  });
});
