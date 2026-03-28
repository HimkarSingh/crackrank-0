import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language ID mapping for Judge0
const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, problemId, testCases } = await req.json();
    
    if (!code || !language || !problemId || !testCases) {
      throw new Error('Code, language, problemId, and testCases are required');
    }

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const languageId = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const judge0ApiKeyValue = Deno.env.get('JUDGE0_API_KEY');
    if (!judge0ApiKeyValue) {
      throw new Error('Judge0 API key not configured');
    }
    const judge0ApiKey: string = judge0ApiKeyValue;

    console.log(`Submitting solution for problem ${problemId} by user ${user.id}`);

    // Function to execute code with test case
    async function runTestCase(testCase: any, index: number) {
      try {
        // Use the input directly as it's already formatted
        const input = testCase.input;
        
        // Submit to Judge0
        const submissionResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'X-RapidAPI-Key': judge0ApiKey,
          },
          body: JSON.stringify({
            language_id: languageId,
            source_code: btoa(code),
            stdin: btoa(input),
          }),
        });

        if (!submissionResponse.ok) {
          throw new Error(`Judge0 submission failed: ${submissionResponse.status}`);
        }

        const submissionData = await submissionResponse.json();
        const token = submissionData.token;

        // Poll for result
        let attempts = 0;
        const maxAttempts = 15;
        let result;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`, {
            headers: {
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
              'X-RapidAPI-Key': judge0ApiKey,
            },
          });

          if (!resultResponse.ok) {
            throw new Error(`Failed to get result: ${resultResponse.status}`);
          }

          result = await resultResponse.json();
          
          if (result.status.id !== 1 && result.status.id !== 2) {
            break;
          }
          
          attempts++;
        }

        if (attempts >= maxAttempts) {
          return {
            testCase: index + 1,
            passed: false,
            error: 'Execution timed out',
            expected: testCase.expectedOutput,
            actual: null
          };
        }

        // Check if execution was successful
        if (result.status.id !== 3) { // 3 = Accepted
          return {
            testCase: index + 1,
            passed: false,
            error: result.stderr ? atob(result.stderr) : result.status.description,
            expected: testCase.expectedOutput,
            actual: null
          };
        }

        const output = result.stdout ? atob(result.stdout).trim() : '';
        const expected = testCase.expectedOutput.trim();
        const passed = output === expected;

        return {
          testCase: index + 1,
          passed,
          expected,
          actual: output,
          error: passed ? null : 'Output mismatch'
        };

      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error running test case ${index + 1}:`, error);
        return {
          testCase: index + 1,
          passed: false,
          error: msg,
          expected: testCase.expectedOutput,
          actual: null
        };
      }
    }

    // Run all test cases
    console.log(`Running ${testCases.length} test cases...`);
    const testResults = await Promise.all(
      testCases.map((testCase: any, index: number) => runTestCase(testCase, index))
    );

    const passedTests = testResults.filter(result => result.passed).length;
    const totalTests = testResults.length;
    const allPassed = passedTests === totalTests;

    // Store submission in database
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        problem_id: problemId,
        code,
        language,
        passed: allPassed,
        testcases: testResults,
        output: allPassed ? 'All test cases passed!' : `${passedTests}/${totalTests} test cases passed`,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save submission');
    }

    console.log(`Submission completed: ${passedTests}/${totalTests} tests passed`);

    return new Response(JSON.stringify({
      submissionId: submission.id,
      passed: allPassed,
      testResults,
      passedTests,
      totalTests,
      message: allPassed ? 'Congratulations! All test cases passed.' : `${passedTests} out of ${totalTests} test cases passed.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in submit-solution function:', error);
    return new Response(JSON.stringify({ 
      error: msg,
      passed: false,
      testResults: [],
      passedTests: 0,
      totalTests: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});