import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = '.env.e2e';
dotenv.config({ path: path.join(__dirname, `../${envFile}`), quiet: true });
