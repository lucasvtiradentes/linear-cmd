import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables based on test type
const envFile = process.env.NODE_ENV === 'e2e' ? '.env.e2e' : '.env.test';
dotenv.config({ path: path.join(__dirname, `../${envFile}`), quiet: true });
