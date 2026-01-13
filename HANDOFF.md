# Handoff: ZQL Select Feature Debugging

## Overall Goal
Test and debug the ZQL `.select()` feature in zbugs app. The user wants to use `.select()` to exclude the `description` column from the issue list query to reduce data sent to the frontend.

## Current Status
**The `.select()` feature is broken on the client side.** When select is used, the query never gets sent to the server - it silently fails.

## Key Findings

### 1. Server-side Select Implementation (FIXED)
The server-side `projectRow()` function in `packages/zero-cache/src/services/view-syncer/pipeline-driver.ts` was missing the `_0_version` column when projecting rows. This was fixed by:
- Adding import: `import {ZERO_VERSION_COLUMN_NAME} from '../replicator/schema/constants.ts';`
- Modifying `projectRow()` to always include the version column

### 2. Client-side Select Issue (NOT FIXED - NEXT STEP)
When `.select()` is added to a query in zbugs:
- The query builds successfully on the client
- `useQuery()` is called
- But the query **never reaches the server** (no `[ADD QUERY]` log for the issue table)
- The query returns empty results forever, causing the app to hang on loading

The issue is likely in:
- `packages/zero-protocol/src/ast.ts` - `normalizeAST()` or AST serialization
- `packages/zero-client/src/client/query-manager.ts` - query registration/sending
- The `select` field might not be properly handled in the client-side pipeline

### 3. Build Requirement
Changes to `packages/zero-cache/` or `packages/zql/` require rebuilding the zero package:
```bash
npm --workspace=@rocicorp/zero run build
```

### 4. Dev Server Requirement
The zbugs dev script needs tsx:
```json
"dev": "tsx node_modules/vite/bin/vite.js"
```
(This was added to `apps/zbugs/package.json`)

## Files Modified

### packages/zero-cache/src/services/view-syncer/pipeline-driver.ts
- Added `ZERO_VERSION_COLUMN_NAME` import
- Added version column to `projectRow()` function
- Added debug logging (can be removed): `[PIPELINE-DRIVER]`, `[ADD QUERY]`, `[SCHEMA DEBUG]`, `[SELECT DEBUG]`

### apps/zbugs/shared/queries.ts
- The `.select()` call in `buildListQuery()` is currently **commented out** to keep app working
- Location: lines 349-362

### apps/zbugs/src/pages/list/list-page.tsx
- Added `AnchorRow` type (minimal type for pagination)
- Changed `Anchor.startRow` type from `Row['issue']` to `AnchorRow`
- Removed `Row` import (unused when select is active)
- Added debug console.logs (can be removed)

## Next Steps

1. **Debug why client-side select fails**:
   - Check `normalizeAST()` in `packages/zero-protocol/src/ast.ts` - verify `select` field is preserved
   - Check `query-manager.ts` - verify queries with select are properly registered and sent
   - Look for any validation that rejects queries with select field

2. **Once fixed**, uncomment the select in `apps/zbugs/shared/queries.ts`:
```typescript
let q = issueQuery
  .select(
    'id',
    'shortID',
    'title',
    'open',
    'modified',
    'created',
    'projectID',
    'creatorID',
    'assigneeID',
    'visibility',
  )
  .related('viewState', ...)
  .related('labels');
```

3. **Clean up debug logs** from pipeline-driver.ts after debugging is complete

## Test Commands
```bash
# In apps/zbugs directory:
npm run dev              # Start frontend
npm run zero-cache-dev   # Start zero-cache server

# After modifying zero-cache or zql packages:
npm --workspace=@rocicorp/zero run build
```

## Related Files to Investigate
- `packages/zero-protocol/src/ast.ts` - AST schema and normalizeAST
- `packages/zero-client/src/client/query-manager.ts` - Client query handling
- `packages/zql/src/query/query-impl.ts` - select() method implementation (line ~463)
- `packages/zql/src/ivm/select.ts` - Select operator (pass-through, schema annotation only)
- `packages/zql/src/builder/builder.ts` - Pipeline building with Select operator (line ~352)
