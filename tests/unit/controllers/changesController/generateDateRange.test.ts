import { generateDateRange } from '@controllers/changesController';

describe('generateDateRange', () => {
  const RealDate = Date;

  beforeEach(() => {
    const mockNow = new RealDate(2023, 5, 15); // June 15, 2023

    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new RealDate(mockNow.getTime());
      }
      return new RealDate(...(args as [any]));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate correct date range with lookback days', () => {
    const { currentDate, pastDate } = generateDateRange(10);

    expect(currentDate).toBe('2023-06-15');
    expect(pastDate).toBe('2023-06-05');
  });

  it('should generate correct date range with 1 day lookback', () => {
    const { currentDate, pastDate } = generateDateRange(1);

    expect(currentDate).toBe('2023-06-15');
    expect(pastDate).toBe('2023-06-14');
  });

  it('should generate correct date range with 30 days lookback', () => {
    const { currentDate, pastDate } = generateDateRange(30);

    expect(currentDate).toBe('2023-06-15');
    expect(pastDate).toBe('2023-05-16');
  });

  it('should handle date crossing month boundaries', () => {
    const mockNow = new RealDate(2023, 6, 1); // July 1, 2023

    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new RealDate(mockNow.getTime());
      }
      return new RealDate(...(args as [any]));
    });

    const { currentDate, pastDate } = generateDateRange(5);

    expect(currentDate).toBe('2023-07-01');
    expect(pastDate).toBe('2023-06-26');
  });

  it('should handle date crossing year boundaries', () => {
    const mockNow = new RealDate(2023, 0, 1); // January 1, 2023

    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new RealDate(mockNow.getTime());
      }
      return new RealDate(...(args as [any]));
    });

    const { currentDate, pastDate } = generateDateRange(5);

    expect(currentDate).toBe('2023-01-01');
    expect(pastDate).toBe('2022-12-27');
  });

  it('should format dates with leading zeros', () => {
    const mockNow = new RealDate(2023, 0, 9); // January 9, 2023

    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new RealDate(mockNow.getTime());
      }
      return new RealDate(...(args as [any]));
    });

    const { currentDate, pastDate } = generateDateRange(5);

    expect(currentDate).toBe('2023-01-09');
    expect(pastDate).toBe('2023-01-04');
  });
});
