# Phase 9 decision: custom categories stay client-side

**Decision:** Custom category metadata (`customCatMeta` / `loadCustomCategories`) remains in
AsyncStorage on the client. We are NOT adding `categoriesMeta` to the `User` server model in
Phase 9.

**Rationale (YAGNI, per spec §Transaction/category reconciliation):** The spec says to add
per-user custom-category storage **only if** users report losing custom categories across
devices. No such reports exist. Budgets/savings reference categories by string key, which works
whether the key is a built-in or a custom category, so server-side budgets do not require the
custom-category metadata to be persisted server-side.

**Revisit when:** a user reports custom categories disappearing after reinstall or on a second
device. At that point, add an optional `categoriesMeta` array to `user.model.js` and migrate
`loadCustomCategories` to the server following the same slice pattern as budgets.

**Mapping centralization:** credit↔income / debit↔expense conversion is centralized in
`client/utils/transactionMappings.ts` (`entryTypeToTxnType` / `txnTypeToEntryType`). Signed-amount
handling and raw `transactionType` filtering live in `client/redux/store/selectors.ts`.
