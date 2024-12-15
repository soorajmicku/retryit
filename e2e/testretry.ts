import { retry } from '../src/retryit';

async function fetchData(): Promise<string> {
  try {
    const response = await fetch('https://httpstat.us/503'); // Simulates a 503 Service Unavailable error
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

async function fallback(): Promise<{ data: string }> {
  console.log('Executing fallback function');
  return { data: 'Fallback data' };
}

const options = {
  retries: 3,
  delay: 1000,
  exponentialBackoff: true,
  onRetry: (attempt: number, error: any) => {
    console.log(`Retry attempt ${attempt} failed with error: ${error.message}`);
  },
  retryCondition: (error: any) => {
    // Retry only for 5xx server errors
    return error.message.includes('HTTP request failed: 5');
  },
  timeout: 10000, // 10 seconds
  fallback,
};

(async () => {
  try {
    const data = await retry(fetchData, options);
    console.log('Data fetched successfully:', data);
  } catch (error) {
    console.error('Final error after retries:', error.message);
  }
})();
