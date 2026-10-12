import { fetchAllValidationRules } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import { DataStoreError } from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-870: fetchAllValidationRules - データ検証ルール定義テーブルへのアクセスに失敗した場合、設計済みエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DataStoreError が throw され、エラー文言「データ検証ルール定義の取得に失敗しました。システム管理者に連絡してください。」が返される", async () => {
    const error = new DataStoreError("データ検証ルール定義の取得に失敗しました。システム管理者に連絡してください。");
    (dataStore.listRecords as jest.Mock).mockRejectedValue(error);

    await expect(fetchAllValidationRules({})).rejects.toThrow(DataStoreError);
    await expect(fetchAllValidationRules({})).rejects.toThrow("データ検証ルール定義の取得に失敗しました。システム管理者に連絡してください。");
  });
});
