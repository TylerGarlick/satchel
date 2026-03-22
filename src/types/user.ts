// User types for Satchel profile and settings

export interface UserProfile {
  address: string;
  displayName?: string;
  avatar?: string;
  joinedAt: string;
  primaryWalletAddress?: string;
}

export interface NotificationPreferences {
  emailBadgeUpdates: boolean;
  emailWebhookAlerts: boolean;
  pushBadgeEarnings: boolean;
  pushNewFollowers: boolean;
  pushSystemAnnouncements: boolean;
  digestFrequency: 'none' | 'daily' | 'weekly';
}

export interface PrivacySettings {
  showBadgesPublicly: boolean;
  showWalletAddress: boolean;
  showActivityStatus: boolean;
  allowAnalytics: boolean;
}

export interface UserPreferences {
  theme: 'skeleton' | 'modern' | 'classic';
  reducedMotion: boolean;
  compactView: boolean;
}

export interface UserSettings {
  profile: UserProfile;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  preferences: UserPreferences;
}

export interface ConnectedWallet {
  address: string;
  walletType: 'pera' | 'myalgo' | 'walletconnect';
  isPrimary: boolean;
  connectedAt: string;
  lastUsed: string;
}

// Default settings factory
export function createDefaultSettings(address: string): UserSettings {
  return {
    profile: {
      address,
      displayName: undefined,
      avatar: undefined,
      joinedAt: new Date().toISOString(),
      primaryWalletAddress: address,
    },
    notifications: {
      emailBadgeUpdates: true,
      emailWebhookAlerts: true,
      pushBadgeEarnings: true,
      pushNewFollowers: false,
      pushSystemAnnouncements: true,
      digestFrequency: 'weekly',
    },
    privacy: {
      showBadgesPublicly: true,
      showWalletAddress: true,
      showActivityStatus: true,
      allowAnalytics: true,
    },
    preferences: {
      theme: 'skeleton',
      reducedMotion: false,
      compactView: false,
    },
  };
}
