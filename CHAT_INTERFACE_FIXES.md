# Chat Interface Fixes

## Issues Fixed

### 1. Markdown Rendering Issue ✅

**Problem**: Chat messages showed literal `**` asterisks instead of rendering bold text.

**Solution**:

- Created `MarkdownText` component in `apps/web/src/components/markdown-text.tsx`
- Handles basic markdown formatting (bold text with `**text**`)
- Preserves line breaks and whitespace
- Updated both coach and today page chat interfaces to use this component

### 2. Database ID Exposure ✅

**Problem**: Users were seeing ugly database UUIDs like `ID 24706292-ba33-4ab0-a51b-52ff2ffd20b1` in chat responses.

**Solution**:

- Modified `apps/api/src/routes/ai.ts` to move Task IDs to background context
- Updated AI instructions to never include database IDs in user-facing responses
- Task IDs are now hidden from users but still available for AI tool execution

## Files Modified

### Frontend:

- `apps/web/src/components/markdown-text.tsx` - New component for markdown rendering
- `apps/web/src/app/coach/page.tsx` - Updated to use MarkdownText component
- `apps/web/src/app/today/page.tsx` - Updated to use MarkdownText component
- `apps/web/src/app/tasks/new/page.tsx` - Fixed useSearchParams Suspense issue

### Backend:

- `apps/api/src/routes/ai.ts` - Hidden task IDs from user responses, updated AI instructions

## Before vs After

### Before:

```
**Define MVP scope - maximum 3 core features**: ID 24706292-ba33-4ab0-a51b-52ff2ffd20b1. Quit dreaming about the full product.
```

### After:

```
**Define MVP scope - maximum 3 core features**: Quit dreaming about the full product.
```

The text now renders as:

- **Define MVP scope - maximum 3 core features**: Quit dreaming about the full product.

## Technical Details

### MarkdownText Component

- Parses `**text**` into `<strong>` tags
- Handles line breaks properly
- Maintains whitespace formatting
- Uses regex to find and replace markdown patterns
- Provides proper React keys for dynamic content

### AI Context Update

- Task IDs moved to parentheses in system context: `(Task ID: uuid)`
- Added explicit instruction: "NEVER include Task IDs or UUIDs in your responses to users"
- Task titles and descriptions used for user-facing references

## Testing

Both issues are now resolved:

1. ✅ Markdown text renders properly with bold formatting
2. ✅ Database IDs are hidden from users
3. ✅ AI can still complete tasks using the hidden IDs
4. ✅ Chat interface is more user-friendly

## Future Improvements

The MarkdownText component can be extended to support:

- Italic text (`*text*`)
- Links (`[text](url)`)
- Code blocks (`code`)
- Lists (`- item`)

For now, it handles the most common case (bold text) that was causing the immediate issue.
