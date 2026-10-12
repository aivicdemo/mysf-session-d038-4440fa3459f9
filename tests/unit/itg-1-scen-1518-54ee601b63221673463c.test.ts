import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1518: 営業担当者IDが空または無効なとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが空文字のときSalesRepresentativeNotFoundエラーが発生する', async () => {
    const salesRepresentativeId = '';

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === 'SalesRepresentative') {
        return [];
      }
      if (tableName === 'Activity') {
        return [];
      }
      return [];
    });

    const input: FetchActivitiesByRepresentativeInput = { salesRepresentativeId };

    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow(SalesRepresentativeNotFound);
    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow('指定された営業担当者が見つかりません。');
  });
});
