import { retry } from '../src/retryit';

describe('retry', () => {
 let consoleSpy:any;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should succeed if the task succeeds on the first attempt', async () => {
    const mockTask = jest.fn(async () => 'Success');
    const result = await retry(mockTask, { retries: 3, delay: 100 });
    expect(result).toBe('Success');
    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it('should retry the task until it succeeds', async () => {
    let attempt = 0;
    const mockTask = jest.fn(async () => {
      attempt++;
      if (attempt < 3) throw new Error('Transient error');
      return 'Success';
    });

    const result = await retry(mockTask, { retries: 5, delay: 100 });
    expect(result).toBe('Success');
    expect(mockTask).toHaveBeenCalledTimes(3);
  });

  it('should fail if the task exceeds the maximum retries', async () => {
    const mockTask = jest.fn(async () => {
      throw new Error('Persistent error');
    });

    await expect(retry(mockTask, { retries: 3, delay: 100 })).rejects.toThrow('Persistent error');
    expect(mockTask).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('should call onRetry callback after each failed attempt', async () => {
    const mockTask = jest.fn(async () => {
      throw new Error('Transient error');
    });
    const onRetry = jest.fn();

    await expect(
      retry(mockTask, { retries: 3, delay: 100, onRetry })
    ).rejects.toThrow('Transient error');

    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error));
  });

  it('should apply exponential backoff correctly', async () => {
    const delays: number[] = [];
    const startTimes: number[] = [];
  
    const mockTask = jest.fn(async () => {
      const now = Date.now();
      if (startTimes.length > 0) {
        delays.push(now - startTimes[startTimes.length - 1]); // Calculate delay from last retry
      }
      startTimes.push(now);
  
      throw new Error('Transient error'); // Always fail
    });
  
    await retry(mockTask, {
      retries: 3,
      delay: 100,
      exponentialBackoff: true,
      onRetry: (retryAttempt) => {
        console.log(`Retry Attempt: ${retryAttempt}`);
      },
    }).catch(() => {});
  
    console.log('Delays:', delays);
  
    // Verify the delays with exponential backoff
    expect(delays.length).toBe(3); // Should retry 3 times
    expect(delays[0]).toBeGreaterThanOrEqual(100); // First retry delay
    expect(delays[1]).toBeGreaterThanOrEqual(200); // Second retry delay
    expect(delays[2]).toBeGreaterThanOrEqual(400); // Third retry delay
  });
  it('should respect the retryCondition and abort retries when condition fails', async () => {
    const mockTask = jest.fn(async () => {
      throw new Error('Non-retriable error');
    });
    const retryCondition = jest.fn((error) => error.message === 'Retriable error');

    await expect(
      retry(mockTask, { retries: 3, delay: 100, retryCondition })
    ).rejects.toThrow('Non-retriable error');

    expect(retryCondition).toHaveBeenCalledTimes(1);
    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it('should timeout if the task execution exceeds the specified timeout', async () => {
    const mockTask = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    await expect(
      retry(mockTask, { retries: 3, delay: 100, timeout: 150 })
    ).rejects.toThrow('Retry timeout exceeded');

    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it('should apply jitter to the backoff delay', async () => {
    const delays: number[] = [];
    const startTimes: number[] = [];
    const mockTask = jest.fn(async () => {
      const now = Date.now();
      if (startTimes.length > 0) {
        delays.push(now - startTimes[startTimes.length - 1]);
      }
      startTimes.push(now);
      throw new Error('Transient error');
    });

    await retry(mockTask, {
      retries: 3,
      delay: 100,
      exponentialBackoff: true,
    }).catch(() => {});

    expect(delays.length).toBe(3);
    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[1]).toBeGreaterThanOrEqual(200);
    expect(delays[2]).toBeGreaterThanOrEqual(400);
    expect(delays[0]).toBeLessThan(200);
    expect(delays[1]).toBeLessThan(400);
    expect(delays[2]).toBeLessThan(800);
  });
  it('should log each retry attempt', async () => {
    const mockTask = jest.fn(async () => {
      throw new Error('Transient error');
    });

    await expect(
      retry(mockTask, { retries: 2, delay: 100 })
    ).rejects.toThrow('Transient error');

    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 1: Trying task');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 1: Task failed. Error: Transient error');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 1: Waiting for 100ms before retry.');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 2: Trying task');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 2: Task failed. Error: Transient error');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 2: Waiting for 100ms before retry.');
    expect(consoleSpy).toHaveBeenCalledWith('[RETRY] Attempt 3: Trying task');
  });
});
