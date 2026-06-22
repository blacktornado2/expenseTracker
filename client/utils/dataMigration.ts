export type MigrationDeps = {
  isMigrated: () => Promise<boolean>;
  setMigrated: () => Promise<void>;
  loadLocalBudgets: () => Promise<{ cat: string; limit: number }[]>;
  loadLocalGoal: () => Promise<number>;
  postBudget: (payload: { category: string; limit: number }) => Promise<void>;
  putGoal: (amount: number) => Promise<void>;
  clearLocal: () => Promise<void>;
};

export type MigrationResult = 'skipped' | 'migrated' | 'failed';

export async function runDataMigration(deps: MigrationDeps): Promise<MigrationResult> {
  if (await deps.isMigrated()) {
    return 'skipped';
  }

  const budgets = await deps.loadLocalBudgets();
  const goal = await deps.loadLocalGoal();

  if (budgets.length === 0 && goal <= 0) {
    await deps.setMigrated();
    return 'skipped';
  }

  try {
    for (const b of budgets) {
      await deps.postBudget({ category: b.cat, limit: b.limit });
    }
    if (goal > 0) {
      await deps.putGoal(goal);
    }
    await deps.clearLocal();
    await deps.setMigrated();
    return 'migrated';
  } catch (err) {
    console.log('data migration failed, will retry next launch', err);
    return 'failed';
  }
}
