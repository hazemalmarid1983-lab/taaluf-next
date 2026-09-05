import PlatformEnvironmentBanner from '@/components/layout/PlatformEnvironmentBanner';
import {
  platformTier,
  showEnvironmentBanner,
} from '@/lib/platformEnvironment';

export default function PlatformEnvironmentBannerGate() {
  if (!showEnvironmentBanner()) return null;
  return <PlatformEnvironmentBanner tier={platformTier()} />;
}
