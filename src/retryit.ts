export interface RetryOptions {
    retries: number;
    delay: number;
    exponentialBackoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
    retryCondition?: (error: any) => boolean;
    timeout?: number;
    fallback?: () => Promise<any>;
  }
  
  export async function retry<T>(
    task: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const {
      retries,
      delay,
      exponentialBackoff = false,
      onRetry,
      retryCondition = () => true,
      timeout,
      fallback,
    } = options;
  
    let attempt = 0;
    let currentDelay = delay;
  
    const retryPromise = async (): Promise<T> => {
      while (attempt <= retries) {
        try {
          console.log(`[RETRY] Attempt ${attempt + 1}: Trying task`);
          return await task(); // Attempt the task
        } catch (error) {
          if (!retryCondition(error)) {
            console.error(`[RETRY] Condition failed, aborting retries`);
            throw error; // Abort retries if condition fails
          }
  
          attempt++;
          if (attempt > retries) {
            console.error(`[RETRY] Exceeded retries (${retries}).`);
            if (fallback) {
              console.log(`[RETRY] Executing fallback`);
              return await fallback();
            }
            throw error; // Throw error after max retries
          }
  
          console.log(`[RETRY] Attempt ${attempt}: Task failed. Error: ${(error as Error).message}`);
          if (onRetry) {
            onRetry(attempt, error);
          }
  
          console.log(`[RETRY] Attempt ${attempt}: Waiting for ${currentDelay}ms before retry.`);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
  
          if (exponentialBackoff) {
            currentDelay *= 2; // Exponential backoff
            currentDelay += Math.random() * 100; // Add jitter
          }
        }
      }
      throw new Error('Retry failed unexpectedly');
    };
  
    if (timeout) {
      const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Retry timeout exceeded')), timeout)
      );
      return Promise.race([retryPromise(), timeoutPromise]);
    }
  
    return retryPromise();
  }
  