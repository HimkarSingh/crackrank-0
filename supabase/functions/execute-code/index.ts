import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language ID mapping for Judge0
const LANGUAGE_IDS = {
  python: 71,    // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  java: 62,      // Java OpenJDK 13.0.1
  cpp: 54,       // C++ (GCC 9.2.0)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, input = "" } = await req.json();
    
    if (!code || !language) {
      throw new Error('Code and language are required');
    }

    const languageId = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const judge0ApiKey = Deno.env.get('JUDGE0_API_KEY');
    if (!judge0ApiKey) {
      throw new Error('Judge0 API key not configured');
    }

    console.log(`Executing ${language} code with Judge0...`);

    // Submit code to Judge0
    const submissionResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': judge0ApiKey,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: btoa(code), // Base64 encode
        stdin: btoa(input), // Base64 encode input
        expected_output: null,
      }),
    });

    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text();
      console.error('Judge0 submission error:', errorText);
      throw new Error(`Judge0 API error: ${submissionResponse.status}`);
    }

    const submissionData = await submissionResponse.json();
    const token = submissionData.token;

    // Poll for result
    let attempts = 0;
    const maxAttempts = 10;
    let result;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
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
      
      // Status 1 = In Queue, Status 2 = Processing
      if (result.status.id !== 1 && result.status.id !== 2) {
        break;
      }
      
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Code execution timed out');
    }

    // Decode base64 outputs
    const output = {
      stdout: result.stdout ? atob(result.stdout) : null,
      stderr: result.stderr ? atob(result.stderr) : null,
      compile_output: result.compile_output ? atob(result.compile_output) : null,
      status: result.status,
      time: result.time,
      memory: result.memory,
    };

    console.log('Execution result:', output);

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in execute-code function:', error);
    return new Response(JSON.stringify({ 
      error: msg,
      stderr: msg 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});