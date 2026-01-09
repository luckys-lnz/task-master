/**
 * Diagnostic script to check Vercel configuration
 * Run this in your Vercel deployment to verify environment variables
 */

console.log('🔍 Vercel Configuration Check\n');
console.log('================================\n');

// Check NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (!nextAuthUrl) {
  console.error('❌ NEXTAUTH_URL is NOT set!');
  console.error('   This will cause email verification links to use preview URLs.');
  console.error('   Solution: Set NEXTAUTH_URL=https://task-master-quick.vercel.app in Vercel environment variables.\n');
} else {
  console.log('✅ NEXTAUTH_URL is set:', nextAuthUrl);
  
  // Check if it's a preview URL
  if (nextAuthUrl.match(/-[a-z0-9]{7,}-[a-z0-9-]+\.vercel\.app/i)) {
    console.error('❌ NEXTAUTH_URL is a preview URL!');
    console.error('   Preview URLs require Vercel authentication and cannot be used for email verification.');
    console.error('   Solution: Set NEXTAUTH_URL to your production domain: https://task-master-quick.vercel.app\n');
  } else if (nextAuthUrl.includes('localhost')) {
    console.error('❌ NEXTAUTH_URL is set to localhost!');
    console.error('   This is invalid for production.');
    console.error('   Solution: Set NEXTAUTH_URL=https://task-master-quick.vercel.app in Vercel environment variables.\n');
  } else {
    console.log('✅ NEXTAUTH_URL is a valid production URL\n');
  }
}

// Check VERCEL_URL
const vercelUrl = process.env.VERCEL_URL;
if (vercelUrl) {
  console.log('📋 VERCEL_URL:', vercelUrl);
  if (vercelUrl.match(/-[a-z0-9]{7,}-[a-z0-9-]+\.vercel\.app/i)) {
    console.warn('⚠️  VERCEL_URL is a preview URL (this is normal for preview deployments)');
  } else {
    console.log('✅ VERCEL_URL is a production URL');
  }
  console.log('');
}

// Check VERCEL_ENV
const vercelEnv = process.env.VERCEL_ENV;
console.log('📋 VERCEL_ENV:', vercelEnv || 'not set');
if (vercelEnv === 'production') {
  console.log('✅ Running in production environment\n');
} else if (vercelEnv === 'preview') {
  console.warn('⚠️  Running in preview environment');
  console.warn('   Email verification links should use production domain, not preview URLs\n');
} else {
  console.log('ℹ️  Environment:', vercelEnv || 'development\n');
}

// Summary
console.log('================================');
if (!nextAuthUrl || nextAuthUrl.match(/-[a-z0-9]{7,}-[a-z0-9-]+\.vercel\.app/i) || nextAuthUrl.includes('localhost')) {
  console.error('\n❌ CONFIGURATION ISSUE DETECTED');
  console.error('\nTo fix email verification issues:');
  console.error('1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
  console.error('2. Add NEXTAUTH_URL with value: https://task-master-quick.vercel.app');
  console.error('3. Make sure it\'s set for "Production" environment');
  console.error('4. Redeploy your application\n');
  process.exit(1);
} else {
  console.log('\n✅ Configuration looks good!\n');
  process.exit(0);
}

