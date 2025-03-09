import Profile from '@models/profile';
import { getDbPool } from '@utils/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

jest.mock('@utils/db', () => {
  const mockPool = {
    execute: jest.fn(),
  };
  return {
    getDbPool: jest.fn(() => mockPool),
  };
});

describe('Profile class', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = getDbPool();
    mockPool.execute.mockReset();
  });

  test('save() should insert profile into DB', async () => {
    mockPool.execute.mockResolvedValueOnce([{ insertId: 5 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile');
    await profile.save();

    expect(mockPool.execute).toHaveBeenCalledTimes(1);
    expect(mockPool.execute).toHaveBeenCalledWith('INSERT into profiles (account_id, name) VALUES (?, ?)', [
      1,
      'Test Profile',
    ]);
    expect(profile.id).toBe(5);
  });

  test('update() should update profile name', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const updatedProfile = await profile.update('Updated Profile');

    expect(mockPool.execute).toHaveBeenCalledWith('UPDATE profiles SET name = ? WHERE profile_id = ?', [
      'Updated Profile',
      5,
    ]);
    expect(updatedProfile).not.toBeNull();
    expect(updatedProfile?.name).toBe('Updated Profile');
  });

  test('update() should return null when no rows are affected', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const updatedProfile = await profile.update('Updated Profile');

    expect(updatedProfile).toBeNull();
  });

  test('updateProfileImage() should update profile image', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const updatedProfile = await profile.updateProfileImage('/path/to/image.jpg');

    expect(mockPool.execute).toHaveBeenCalledWith('UPDATE profiles SET image = ? WHERE profile_id = ?', [
      '/path/to/image.jpg',
      5,
    ]);
    expect(updatedProfile).not.toBeNull();
    expect(updatedProfile?.image).toBe('/path/to/image.jpg');
  });

  test('updateProfileImage() should return null when no rows are affected', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const updatedProfile = await profile.updateProfileImage('/path/to/image.jpg');

    expect(updatedProfile).toBeNull();
  });

  test('delete() should delete profile from DB', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const result = await profile.delete(5);

    expect(mockPool.execute).toHaveBeenCalledWith('DELETE FROM profiles WHERE profile_id = ?', [5]);
    expect(result).toBe(true);
  });

  test('delete() should return false when no rows are affected', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 } as ResultSetHeader]);

    const profile = new Profile(1, 'Test Profile', 5);
    const result = await profile.delete(5);

    expect(result).toBe(false);
  });

  test('findById() should return a profile object', async () => {
    const mockProfile = {
      profile_id: 5,
      account_id: 1,
      name: 'Test Profile',
      image: null,
    };

    mockPool.execute.mockResolvedValueOnce([[mockProfile] as RowDataPacket[]]);

    const profile = await Profile.findById(5);

    expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM profiles WHERE profile_id = ?', [5]);
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(5);
    expect(profile?.name).toBe('Test Profile');
    expect(profile?.account_id).toBe(1);
  });

  test('findById() should return null when profile is not found', async () => {
    mockPool.execute.mockResolvedValueOnce([[] as RowDataPacket[]]);

    const profile = await Profile.findById(999);

    expect(profile).toBeNull();
  });

  test('getAllByAccountId() should return an array of profiles', async () => {
    const mockProfiles = [
      { profile_id: 5, account_id: 1, name: 'Profile 1', image: null },
      { profile_id: 6, account_id: 1, name: 'Profile 2', image: '/path/to/image.jpg' },
    ];

    mockPool.execute.mockResolvedValueOnce([mockProfiles as RowDataPacket[]]);

    const profiles = await Profile.getAllByAccountId(1);

    expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM profiles WHERE account_id = ?', [1]);
    expect(profiles.length).toBe(2);
    expect(profiles[0].id).toBe(5);
    expect(profiles[0].name).toBe('Profile 1');
    expect(profiles[1].id).toBe(6);
    expect(profiles[1].name).toBe('Profile 2');
    expect(profiles[1].image).toBe('/path/to/image.jpg');
  });
});
