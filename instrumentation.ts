export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logPlatformEnvironmentOnBoot } = await import(
      '@/lib/validatePlatformEnvironment'
    );
    logPlatformEnvironmentOnBoot();
  }
}
