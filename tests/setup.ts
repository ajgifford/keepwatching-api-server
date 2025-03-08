import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set a longer timeout for certain tests
jest.setTimeout(10000);
