import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-969: 存在する活動結果マスタレコードを指定IDで削除", () => {
  const mockActivityResult = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    活動結果ID: "550e8400-e29b-41d4-a716-446655440000",
    活動結果名: "成功",
    説明: "営業活動が成功に終わった場合",
    有効フラグ: true,
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
    作成者: "system",
    更新者: "system",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing activity result master record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockActivityResult]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "活動結果マスタ",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("活動結果マスタ");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("活動結果マスタ");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("活動結果マスタ", "550e8400-e29b-41d4-a716-446655440000");
  });
});
