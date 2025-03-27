import { ChangeItem } from '../../../../src/types/contentTypes';
import { filterUniqueSeasonIds } from '@controllers/changesController';

describe('filterUniqueSeasonIds', () => {
  it('should return empty array when changes array is empty', () => {
    const changes: ChangeItem[] = [];
    const result = filterUniqueSeasonIds(changes);
    expect(result).toEqual([]);
  });

  it('should extract unique season IDs from change items', () => {
    const changes: ChangeItem[] = [
      {
        id: '1',
        action: 'added',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 123 },
        original_value: null,
      },
      {
        id: '2',
        action: 'updated',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 456 },
        original_value: { season_id: 456 },
      },
      {
        id: '3',
        action: 'added',
        time: '2023-06-16',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 123 },
        original_value: null,
      },
    ];

    const result = filterUniqueSeasonIds(changes);
    expect(result).toEqual([123, 456]);
    expect(result.length).toBe(2);
  });

  it('should ignore changes without season_id', () => {
    const changes: ChangeItem[] = [
      {
        id: '1',
        action: 'added',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 123 },
        original_value: null,
      },
      {
        id: '2',
        action: 'updated',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { some_other_property: 'value' },
        original_value: null,
      },
      {
        id: '3',
        action: 'deleted',
        time: '2023-06-16',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: null,
        original_value: { season_id: 789 },
      },
    ];

    const result = filterUniqueSeasonIds(changes);
    expect(result).toEqual([123]);
    expect(result.length).toBe(1);
  });

  it('should handle changes with undefined or null values', () => {
    const changes: ChangeItem[] = [
      {
        id: '1',
        action: 'added',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: undefined,
        original_value: null,
      },
      {
        id: '2',
        action: 'updated',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: null,
        original_value: null,
      },
    ];

    const result = filterUniqueSeasonIds(changes);
    expect(result).toEqual([]);
  });

  it('should handle mixed types of changes', () => {
    const changes: ChangeItem[] = [
      {
        id: '1',
        action: 'added',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 123 },
        original_value: null,
      },
      {
        id: '2',
        action: 'updated',
        time: '2023-06-15',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: null,
        original_value: null,
      },
      {
        id: '3',
        action: 'deleted',
        time: '2023-06-16',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        value: { season_id: 456 },
        original_value: { season_id: 789 },
      },
    ];

    const result = filterUniqueSeasonIds(changes);
    expect(result).toEqual([123, 456]);
  });
});
