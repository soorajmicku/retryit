
# RetryIt

A robust and configurable library to retry asynchronous tasks or API calls. Built with **TypeScript**, RetryIt ensures better error handling, resilience, and flexibility in your applications.

---

## **Features**

- **Retry Logic**: Automatically retries failed tasks a specified number of times.
- **Custom Delay**: Add a delay between retry attempts, with optional exponential backoff.
- **Retry Conditions**: Define conditions to control retry logic and decide when retries should occur.
- **Timeout Handling**: Set a maximum time limit for retries to prevent indefinite retries.
- **Fallback Support**: Execute a fallback task if retries are exhausted.
- **Retry Callback**: Run custom logic after each retry attempt (e.g., logging or telemetry).
- **Lightweight and Easy-to-Use**: Minimal API for maximum flexibility, making it easy to integrate into any TypeScript or JavaScript project.

---

## **Installation**

Install the package via npm:

```bash
npm install retryit
```

If using TypeScript, the type definitions are included in the package.

---

## **Usage**

### Basic Example
```typescript
import { retry } from 'retryit';

async function fetchData() {
  return fetch('https://api.example.com/data'); // Example API call
}

const options = {
  retries: 3,        // Retry up to 3 times
  delay: 1000,       // Wait 1 second between retries
};

retry(fetchData, options)
  .then((data) => console.log('Data fetched successfully:', data))
  .catch((error) => console.error('Failed to fetch data:', error));
```

### Advanced Example with Exponential Backoff
```typescript
import { retry } from 'retryit';

const task = async () => {
  throw new Error('Simulated failure'); // Simulate a failing task
};

const options = {
  retries: 5,
  delay: 500,
  exponentialBackoff: true,
  onRetry: (attempt, error) => console.log(`Retry #${attempt}: ${error.message}`),
  retryCondition: (error) => error.message.includes('Simulated'),
  fallback: async () => 'Fallback result',
};

retry(task, options)
  .then((result) => console.log('Result:', result))
  .catch((error) => console.error('Final error:', error));
```

---

## **API Reference**

### **retry(task, options)**

Retries an asynchronous task with the given options.

#### Parameters
- **task** (Function): An asynchronous function to retry.
- **options** (Object): Configuration object with the following properties:
  - **retries** (Number): Maximum number of retries (required).
  - **delay** (Number): Delay in milliseconds between retries (required).
  - **exponentialBackoff** (Boolean): Enable exponential backoff (default: `false`).
  - **onRetry** (Function): Callback executed on each retry attempt.
  - **retryCondition** (Function): A function to determine if a retry should occur (default: always true).
  - **timeout** (Number): Maximum time in milliseconds for retries (default: no timeout).
  - **fallback** (Function): A fallback function if all retries fail.

#### Returns
- A promise that resolves to the task result or rejects with an error.

---

## **Testing**

### **Unit Tests**
Run unit tests with the following command:

```bash
npm run test
```

### **End-to-End (e2e) Tests**
To run e2e tests, execute the following command:

```bash
node e2e/testRetry.js
```

---

## **Project Structure**

```plaintext
retryit/
├── src/
│   └── retryit.ts        # Main library file
├── test/
│   └── retryit.test.ts   # Unit tests
├── e2e/
│   └── testRetry.js      # End-to-end tests
├── package.json          # NPM metadata
└── README.md             # Project documentation
```

---

## **Contributing**

Contributions are welcome! Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a Pull Request.

---

## **License**

This project is licensed under the ISC License. See the LICENSE file for details.

---

## **Contact**

Created by **Sooraj Vijayan**  
Email: [soorajmickub@gmail.com](mailto:soorajmickub@gmail.com)
