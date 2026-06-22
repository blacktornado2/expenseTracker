import { runDataMigration, type MigrationDeps } from '../dataMigration';

function makeDeps(overrides: Partial<MigrationDeps> = {}): MigrationDeps {
  return {
    isMigrated: jest.fn().mockResolvedValue(false),
    setMigrated: jest.fn().mockResolvedValue(undefined),
    loadLocalBudgets: jest.fn().mockResolvedValue([{ cat: 'fuel', limit: 3000 }]),
    loadLocalGoal: jest.fn().mockResolvedValue(20000),
    postBudget: jest.fn().mockResolvedValue(undefined),
    putGoal: jest.fn().mockResolvedValue(undefined),
    clearLocal: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runDataMigration', () => {
  it('skips when already migrated', async () => {
    const deps = makeDeps({ isMigrated: jest.fn().mockResolvedValue(true) });
    expect(await runDataMigration(deps)).toBe('skipped');
    expect(deps.postBudget).not.toHaveBeenCalled();
    expect(deps.clearLocal).not.toHaveBeenCalled();
  });

  it('sets the flag and skips POSTs when there is no local data', async () => {
    const deps = makeDeps({
      loadLocalBudgets: jest.fn().mockResolvedValue([]),
      loadLocalGoal: jest.fn().mockResolvedValue(0),
    });
    expect(await runDataMigration(deps)).toBe('skipped');
    expect(deps.postBudget).not.toHaveBeenCalled();
    expect(deps.setMigrated).toHaveBeenCalledTimes(1);
  });

  it('posts each budget + goal, then clears local and sets flag on success', async () => {
    const deps = makeDeps();
    expect(await runDataMigration(deps)).toBe('migrated');
    expect(deps.postBudget).toHaveBeenCalledWith({ category: 'fuel', limit: 3000 });
    expect(deps.putGoal).toHaveBeenCalledWith(20000);
    expect(deps.clearLocal).toHaveBeenCalledTimes(1);
    expect(deps.setMigrated).toHaveBeenCalledTimes(1);
  });

  it('does not post the goal when local goal is 0', async () => {
    const deps = makeDeps({ loadLocalGoal: jest.fn().mockResolvedValue(0) });
    await runDataMigration(deps);
    expect(deps.putGoal).not.toHaveBeenCalled();
    expect(deps.postBudget).toHaveBeenCalledTimes(1);
  });

  it('preserves local data and does not set the flag when a POST fails', async () => {
    const deps = makeDeps({ postBudget: jest.fn().mockRejectedValue(new Error('network')) });
    expect(await runDataMigration(deps)).toBe('failed');
    expect(deps.clearLocal).not.toHaveBeenCalled();
    expect(deps.setMigrated).not.toHaveBeenCalled();
  });
});
