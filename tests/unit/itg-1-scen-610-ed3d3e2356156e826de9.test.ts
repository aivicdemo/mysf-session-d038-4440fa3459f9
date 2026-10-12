import { generateProcessDataflowDiagram, ReferenceIntegrityViolation } from '../../src/logic/process-dataflow-mapping';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-610: ReferenceIntegrityViolation when reference relationships are broken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect orphaned and invalid reference relationships', async () => {
    const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

    const deals = [{
      id: 'DEAL001',
      customerId: 'CUST001',
      salesRepresentativeId: 'SR001',
      stageName: '受注',
      amount: 1000000,
      createdAt: '2024-01-05T09:00:00Z',
    }];

    const invoices = [
      {
        id: 'INV001',
        relatedDealId: 'DEAL001',
        lineItems: [{
          id: 'LI001',
          parentInvoiceId: 'INV001',
          amount: 1000000,
        }],
      },
      {
        id: 'INV002',
        relatedDealId: 'DEAL_ORPHANED',
        lineItems: [{
          id: 'LI002',
          parentInvoiceId: 'INV002',
          amount: 500000,
        }],
      },
    ];

    const activities = [
      {
        id: 'ACT001',
        relatedDealId: 'DEAL001',
        relatedInvoiceId: 'INV001',
        activityType: '電話',
        createdAt: '2024-01-06T10:00:00Z',
      },
      {
        id: 'ACT002',
        relatedDealId: null,
        relatedInvoiceId: 'INV002',
        activityType: 'メール',
        createdAt: '2024-01-07T11:00:00Z',
      },
    ];

    const customers = [{
      id: 'CUST001',
      name: '顧客A',
      createdAt: '2024-01-01T00:00:00Z',
    }];

    const salesReps = [{
      id: 'SR001',
      name: '営業担当者A',
      createdAt: '2024-01-01T00:00:00Z',
    }];

    const stages = [{
      id: 'STAGE001',
      stageName: '受注',
      sequenceOrder: 5,
    }];

    mockDataPersistence.fetchDealsForPeriod = jest.fn().mockResolvedValue(deals);
    mockDataPersistence.fetchInvoiceWithLineItems = jest.fn().mockResolvedValue(invoices);
    mockDataPersistence.fetchActivityWithRelatedDealAndInvoice = jest.fn().mockResolvedValue(activities);
    mockDataPersistence.fetchAllCustomers = jest.fn().mockResolvedValue(customers);
    mockDataPersistence.fetchAllSalesRepresentatives = jest.fn().mockResolvedValue(salesReps);
    mockDataPersistence.fetchAllDealStages = jest.fn().mockResolvedValue(stages);

    const filterCriteria = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      salesRepresentativeIds: ['SR001'],
      customerIds: ['CUST001'],
    };

    const input = {
      filterCriteria,
      displayFormat: 'diagram' as const,
      includeAnomalies: true,
      requestedAt: new Date('2024-02-01T10:00:00Z'),
    };

    const result = await generateProcessDataflowDiagram(input);

    expect(result.anomalies).toContainEqual(
      expect.objectContaining({
        anomalyType: expect.stringMatching(/reference_broken|orphaned_record/),
        description: 'データ参照関係に不整合があります。対象レコードを確認してください。',
        severity: 'critical',
      })
    );

    const validEdges = result.dataflowEdges.filter(e => e.isValid);
    expect(validEdges).toContainEqual(
      expect.objectContaining({
        sourceNodeId: expect.stringContaining('DEAL001'),
        targetNodeId: expect.stringContaining('INV001'),
      })
    );
  });
});
