
## Plan to Fix TypeScript Build Errors

### Issues Found:
1. **execute-code/index.ts** (lines 119-120): `error.message` accessing unknown type
2. **submit-solution/index.ts** (line 71, 98): `judge0ApiKey` might be undefined
3. **submit-solution/index.ts** (lines 153, 206): `error.message` accessing unknown type

### Fixes Required:

**1. Fix error handling in execute-code/index.ts:**
```typescript
// Line 119-120
catch (error: any) {
  console.error('Error in execute-code function:', error);
  return new Response(JSON.stringify({ 
    error: error?.message || 'Unknown error',
    stderr: error?.message || 'Unknown error'
  }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**2. Fix Judge0 API key handling in submit-solution/index.ts:**
```typescript
// After line 52
const judge0ApiKey = Deno.env.get('JUDGE0_API_KEY');
if (!judge0ApiKey) {
  throw new Error('Judge0 API key not configured');
}
```

**3. Fix error handling in submit-solution/index.ts:**
```typescript
// Line 148-157
catch (error: any) {
  console.error(`Error running test case ${index + 1}:`, error);
  return {
    testCase: index + 1,
    passed: false,
    error: error?.message || 'Unknown error',
    expected: testCase.expectedOutput,
    actual: null
  };
}

// Line 203-214
catch (error: any) {
  console.error('Error in submit-solution function:', error);
  return new Response(JSON.stringify({ 
    error: error?.message || 'Unknown error',
    passed: false,
    testResults: [],
    passedTests: 0,
    totalTests: 0
  }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

These changes will:
- Add proper type checking for error objects
- Ensure judge0ApiKey is validated before use
- Prevent TypeScript compilation errors
