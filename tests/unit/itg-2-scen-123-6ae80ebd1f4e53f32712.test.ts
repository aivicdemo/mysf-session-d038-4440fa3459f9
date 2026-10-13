import { analyzeReferenceRelationships } from "../../src/logic/reference-relationship-analyzer";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-123: calculation logic dependencies excluded from output", () => {
  it("should not include calculationLogicDependencies field when includeCalculationLogicDependencies is false", async () => {
    const mockMappingDetailsForProject = jest.fn().mockResolvedValue({
      customObjectDefinitions: [
        {
          objectId: "obj-invoice",
          objectName: "請求書",
          fields: [
            { fieldId: "f-inv-001", fieldName: "請求番号", dataType: "Text" },
            { fieldId: "f-inv-002", fieldName: "請求日", dataType: "Date" }
          ]
        },
        {
          objectId: "obj-invoice-line",
          objectName: "請求明細",
          fields: [
            { fieldId: "f-line-001", fieldName: "金額", dataType: "Currency" },
            { fieldId: "f-line-002", fieldName: "請求書参照", dataType: "Lookup" }
          ]
        }
      ],
      objectReferences: [
        { relationshipId: "rel-001", sourceObjectId: "obj-invoice-line", targetObjectId: "obj-invoice", referenceFieldId: "f-line-002", cardinality: "Many-to-One", deleteAction: "Cascade" }
      ],
      calculationLogics: [
        { logicId: "logic-001", objectId: "obj-invoice", logicType: "RollupSummary", dependentFieldId: "f-inv-003", referencedLogicIds: [] }
      ]
    });

    const mockMappingDetailsByTargetSystem = jest.fn().mockResolvedValue([
      { featureId: "feat-001", featureName: "主明細参照関係", supportedCardinalities: ["One-to-Many", "Many-to-One"], supportedCalculationTypes: ["Aggregate"] }
    ]);

    jest.spyOn(mappingPersistence, "retrieveMappingDetailsForProject").mockImplementation(mockMappingDetailsForProject);
    jest.spyOn(mappingPersistence, "retrieveMappingDetailsByTargetSystem").mockImplementation(mockMappingDetailsByTargetSystem);

    const input = {
      projectId: "proj-001",
      targetSystemId: "target-sys-001",
      includeCalculationLogicDependencies: false,
      executedAt: new Date("2026-01-15T10:30:00Z"),
      executedByUserId: "user-admin-001"
    };

    const result = await analyzeReferenceRelationships(input);

    expect(result).toHaveProperty("referenceGraph");
    expect(result.referenceGraph.nodes).toHaveLength(2);
    expect(result.referenceGraph.edges).toHaveLength(1);
    expect(result).toHaveProperty("circularDependencies");
    expect(result.circularDependencies).toEqual([]);
    expect(result).not.toHaveProperty("calculationLogicDependencies");
    expect(result).toHaveProperty("targetSystemCompatibility");
    expect(result.targetSystemCompatibility).toHaveProperty("overallCompatibility");
    expect(result).toHaveProperty("analysisMetadata");
    expect(result.analysisMetadata.executedAt).toEqual(new Date("2026-01-15T10:30:00Z"));
    expect(result.analysisMetadata.executedByUserId).toBe("user-admin-001");
  });
});
