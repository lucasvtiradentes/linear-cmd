import { execSync } from 'child_process';

export async function setup() {
  console.log('\n🔨 Building project for E2E tests...');
  
  try {
    // Run the build command
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

export async function teardown() {
  // No teardown needed for now
  console.log('\n🧹 E2E tests completed');
}