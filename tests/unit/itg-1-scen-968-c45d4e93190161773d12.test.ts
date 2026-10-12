import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-968: 存在する活動タイプマスタレコードを指定IDで削除", () => {
  const mockActivityType = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    活動タイプID: "550e8400-e29b-41d4-a716-446655440000",
    活動タイプ名: "電話営業",
    説明: "電話による営業活動",
    有効フラグ: true,
    作成日時: "2026-01-01T09:00:00Z",
    更新日時: "2026-01-01T09:00:00Z",
    作成者: "admin",
    更新者: "admin",
    createdAt: "2026-01-01T09:00:00Z",
    updatedAt: "2026-01-01T09:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing activity type master record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockActivityType]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "活動タイプマスタ",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("活動タイプマスタ");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("活動タイプマスタ");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("活動タイプマスタ", "550e8400-e29b-41d4-a716-446655440000");
  });
});
