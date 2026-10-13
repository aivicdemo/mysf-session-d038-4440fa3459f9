import { renderDiscrepancyDetailPanel } from "../../src/logic/dashboard-presentation";
import * as discrepancyPersistence from "../../src/logic/discrepancy-persistence";
import type {
  RenderDiscrepancyDetailPanelOutput,
  ToleranceCriteriaDetail,
  CorrectionTrackingDetail,
} from "../../src/logic/dashboard-presentation";
import type {
  RetrieveDiscrepancyDetailsForConfirmationOutput,
  CorrectionTrackingRecord,
  ToleranceCriteriaRecord,
} from "../../src/logic/discrepancy-persistence";

jest.mock("../../src/logic/discrepancy-persistence", () => ({
  ...jest.requireActual<typeof import("../../src/logic/discrepancy-persistence")>(
    "../../src/logic/discrepancy-persistence"
  ),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe("SCEN-300: 差異のステータス差異がない場合、statusDifferenceにnullが設定される", () => {
  const mockRetrieveDiscrepancyDetails =
    discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.MockedFunction<
      typeof discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation
    >;
  const mockRetrieveCorrectionTracking =
    discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.MockedFunction<
      typeof discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId
    >;
  const mockRetrieveToleranceCriteria =
    discrepancyPersistence.retrieveToleranceCriteriaByType as jest.MockedFunction<
      typeof discrepancyPersistence.retrieveToleranceCriteriaByType
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("statusDifferenceがnullのとき、出力のstatusDeifferenceフィールドもnullであること", async () => {
    // Arrange
    const requestUserId = "user-001";
    const discrepancyId = "550e8400-e29b-41d4-a716-446655440000";

    const discrepancyDetail: RetrieveDiscrepancyDetailsForConfirmationOutput = {
      discrepancyId: "550e8400-e29b-41d4-a716-446655440000",
      discrepancyDetection: {
        discrepancyId: "550e8400-e29b-41d4-a716-446655440000",
        legacySystemInvoiceId: "SF-INV-2025-001",
        newSystemInvoiceId: "NEW-INV-2025-001",
        discrepancyType: "ステータス差異",
        discrepancyContent: "ステータスの差異",
        amountDifference: null,
        countDifference: null,
        statusDifference: null,
        severity: "info",
        detectionDateTime: "2025-12-01T10:30:00Z",
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    };

    const correctionTrackingRecords: ReadonlyArray<CorrectionTrackingRecord> = [];

    const toleranceCriteria: ToleranceCriteriaRecord = {
      criteriaId: "criteria-001",
      discrepancyType: "ステータス差異",
      toleranceAmount: null,
      toleranceCount: null,
      toleranceStatusDifference: "許容ステータス差異なし",
    };

    mockRetrieveDiscrepancyDetails.mockResolvedValue(discrepancyDetail);
    mockRetrieveCorrectionTracking.mockResolvedValue(correctionTrackingRecords);
    mockRetrieveToleranceCriteria.mockResolvedValue(toleranceCriteria);

    // Act
    const result: RenderDiscrepancyDetailPanelOutput = await renderDiscrepancyDetailPanel({
      requestUserId,
      discrepancyId,
    });

    // Assert - statusDifferenceがnullであること
    expect(result.statusDifference).toBeNull();
    expect(result.discrepancyId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.legacyInvoiceId).toBe("SF-INV-2025-001");
    expect(result.newInvoiceId).toBe("NEW-INV-2025-001");
    expect(result.discrepancyType).toBe("ステータス差異");
    expect(result.amountDifference).toBeNull();
    expect(result.countDifference).toBeNull();
    expect(result.severity).toBe("info");
    expect(result.detectionDateTime).toEqual(new Date("2025-12-01T10:30:00Z"));
    expect(result.toleranceJudgment).toBe("within_tolerance");
    expect(result.correctionTrackingHistory).toHaveLength(0);
  });
});
