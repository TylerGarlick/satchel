'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import type { NotificationPreferences, PrivacySettings, UserPreferences } from '@/types/user';
import { WalletSelectorModal } from '@/components/WalletSelectorModal';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatAddress(addr: string) {
  if (!addr || addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

function ThemeSelector({
  value,
  onChange,
}: {
  value: UserPreferences['theme'];
  onChange: (theme: UserPreferences['theme']) => void;
}) {
  const themes: { value: UserPreferences['theme']; label: string; description: string }[] = [
    { value: 'skeleton', label: 'Skeleton', description: 'Clean, minimal with subtle accents' },
    { value: 'modern', label: 'Modern', description: 'Bold gradients and rounded corners' },
    { value: 'classic', label: 'Classic', description: 'Traditional card-based design' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => onChange(theme.value)}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            value === theme.value
              ? 'border-cyan-500 bg-cyan-900/20'
              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
          }`}
        >
          <div className="font-semibold text-white mb-1">{theme.label}</div>
          <div className="text-sm text-gray-400">{theme.description}</div>
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="font-medium text-white">{label}</div>
        {description && <div className="text-sm text-gray-400">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
          enabled ? 'bg-cyan-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function DigestSelector({
  value,
  onChange,
}: {
  value: NotificationPreferences['digestFrequency'];
  onChange: (freq: NotificationPreferences['digestFrequency']) => void;
}) {
  const options: { value: NotificationPreferences['digestFrequency']; label: string }[] = [
    { value: 'none', label: 'No digest' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function WalletCard({
  wallet,
  isPrimary,
  onSetPrimary,
  onDisconnect,
  isCurrentConnected,
}: {
  wallet: { address: string; walletType: string; connectedAt: string; lastUsed: string };
  isPrimary: boolean;
  onSetPrimary: () => void;
  onDisconnect: () => void;
  isCurrentConnected: boolean;
}) {
  const walletTypeLabels: Record<string, string> = {
    pera: 'Pera Wallet',
    myalgo: 'MyAlgo Wallet',
    walletconnect: 'WalletConnect',
  };

  return (
    <div className={`p-4 rounded-lg border ${
      isPrimary ? 'border-cyan-500 bg-cyan-900/10' : 'border-gray-700 bg-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-medium text-white truncate">
              {formatAddress(wallet.address)}
            </span>
            {isPrimary && (
              <span className="px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full">
                Primary
              </span>
            )}
            {isCurrentConnected && (
              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600">
                Connected
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {walletTypeLabels[wallet.walletType] || wallet.walletType}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Connected {formatDate(wallet.connectedAt)}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {!isPrimary && (
            <button
              onClick={onSetPrimary}
              className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              Set Primary
            </button>
          )}
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 text-xs font-medium bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { address: connectedAddress, disconnect: disconnectWallet, isConnected } = useWallet();
  const {
    settings,
    connectedWallets,
    isLoading,
    isSaving,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    updatePreferences,
    removeWallet,
    setPrimaryWallet,
  } = useUserSettings();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'wallets' | 'preferences'>('profile');
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localAvatar, setLocalAvatar] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Initialize local state from settings
  React.useEffect(() => {
    if (settings?.profile) {
      setLocalDisplayName(settings.profile.displayName || '');
      setLocalAvatar(settings.profile.avatar || '');
    }
  }, [settings?.profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        displayName: localDisplayName || undefined,
        avatar: localAvatar || undefined,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean | string) => {
    try {
      await updateNotifications({ [key]: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handlePrivacyChange = async (key: keyof PrivacySettings, value: boolean) => {
    try {
      await updatePrivacy({ [key]: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean | string) => {
    try {
      await updatePreferences({ [key]: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleSetPrimary = async (address: string) => {
    try {
      await setPrimaryWallet(address);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleRemoveWallet = async (address: string) => {
    if (connectedWallets.length <= 1) {
      alert('You must have at least one connected wallet.');
      return;
    }
    
    const isConnected = address === connectedAddress;
    if (isConnected && isConnected) {
      disconnectWallet();
    }
    
    try {
      await removeWallet(address);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'wallets', label: 'Wallets', icon: '👛' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ] as const;

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4" />
          <div className="h-64 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!settings || !isConnected) {
    return (
      <div className="py-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold mb-2">Connect Wallet to Access Settings</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Please connect your Algorand wallet to view and manage your profile settings.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p className="text-gray-400 text-sm">
            Manage your profile, notifications, and connected wallets
          </p>
        </div>
        
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error saving
          </div>
        )}
        {isSaving && (
          <div className="flex items-center gap-2 text-cyan-400 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              {/* Avatar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {localAvatar ? (
                      <img
                        src={localAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={localAvatar}
                    onChange={(e) => setLocalAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={localDisplayName}
                  onChange={(e) => setLocalDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Wallet Address (read-only) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address
                </label>
                <div className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 font-mono text-sm">
                  {settings.profile.address}
                </div>
              </div>

              {/* Joined Date (read-only) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Joined
                </label>
                <div className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 text-sm">
                  {formatDate(settings.profile.joinedAt)}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
              <div className="divide-y divide-gray-700">
                <ToggleSwitch
                  label="Badge Updates"
                  description="Get notified when your badges are updated or modified"
                  enabled={settings.notifications.emailBadgeUpdates}
                  onChange={(v) => handleNotificationChange('emailBadgeUpdates', v)}
                />
                <ToggleSwitch
                  label="Webhook Alerts"
                  description="Receive alerts about webhook triggers and failures"
                  enabled={settings.notifications.emailWebhookAlerts}
                  onChange={(v) => handleNotificationChange('emailWebhookAlerts', v)}
                />
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Email Digest Frequency
                </label>
                <DigestSelector
                  value={settings.notifications.digestFrequency}
                  onChange={(v) => handleNotificationChange('digestFrequency', v)}
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
              <div className="divide-y divide-gray-700">
                <ToggleSwitch
                  label="Badge Earnings"
                  description="Get notified when you receive a new badge"
                  enabled={settings.notifications.pushBadgeEarnings}
                  onChange={(v) => handleNotificationChange('pushBadgeEarnings', v)}
                />
                <ToggleSwitch
                  label="New Followers"
                  description="Get notified when someone follows your profile"
                  enabled={settings.notifications.pushNewFollowers}
                  onChange={(v) => handleNotificationChange('pushNewFollowers', v)}
                />
                <ToggleSwitch
                  label="System Announcements"
                  description="Receive important system updates and announcements"
                  enabled={settings.notifications.pushSystemAnnouncements}
                  onChange={(v) => handleNotificationChange('pushSystemAnnouncements', v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
              <p className="text-gray-400 text-sm mb-6">
                Control what information is visible to others and how your data is used.
              </p>
              <div className="divide-y divide-gray-700">
                <ToggleSwitch
                  label="Show Badges Publicly"
                  description="Allow others to see your badge collection"
                  enabled={settings.privacy.showBadgesPublicly}
                  onChange={(v) => handlePrivacyChange('showBadgesPublicly', v)}
                />
                <ToggleSwitch
                  label="Show Wallet Address"
                  description="Display your Algorand wallet address on your profile"
                  enabled={settings.privacy.showWalletAddress}
                  onChange={(v) => handlePrivacyChange('showWalletAddress', v)}
                />
                <ToggleSwitch
                  label="Show Activity Status"
                  description="Let others see when you were last active"
                  enabled={settings.privacy.showActivityStatus}
                  onChange={(v) => handlePrivacyChange('showActivityStatus', v)}
                />
                <ToggleSwitch
                  label="Allow Analytics"
                  description="Help improve Satchel by sharing anonymous usage data"
                  enabled={settings.privacy.allowAnalytics}
                  onChange={(v) => handlePrivacyChange('allowAnalytics', v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Connected Wallets</h2>
                  <p className="text-gray-400 text-sm">
                    Manage your connected Algorand wallets
                  </p>
                </div>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  + Connect Wallet
                </button>
              </div>

              {connectedWallets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-3">👛</div>
                  <p>No wallets connected</p>
                  <button
                    onClick={() => setShowWalletModal(true)}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Connect your first wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedWallets.map((wallet) => (
                    <WalletCard
                      key={wallet.address}
                      wallet={wallet}
                      isPrimary={wallet.isPrimary}
                      onSetPrimary={() => handleSetPrimary(wallet.address)}
                      onDisconnect={() => handleRemoveWallet(wallet.address)}
                      isCurrentConnected={wallet.address === connectedAddress}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-sm">
                  <p className="font-medium text-amber-200 mb-1">Security Notice</p>
                  <p className="text-amber-300/70">
                    Disconnecting a wallet will remove it from this device. You can reconnect
                    anytime using your wallet extension. Badge ownership is stored on-chain
                    and cannot be affected by this action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Theme</h2>
              <p className="text-gray-400 text-sm mb-4">
                Choose your preferred visual style for Satchel
              </p>
              <ThemeSelector
                value={settings.preferences.theme}
                onChange={(v) => handlePreferenceChange('theme', v)}
              />
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Display Options</h2>
              <div className="divide-y divide-gray-700">
                <ToggleSwitch
                  label="Reduced Motion"
                  description="Minimize animations and transitions throughout the app"
                  enabled={settings.preferences.reducedMotion}
                  onChange={(v) => handlePreferenceChange('reducedMotion', v)}
                />
                <ToggleSwitch
                  label="Compact View"
                  description="Use denser layouts with more content visible at once"
                  enabled={settings.preferences.compactView}
                  onChange={(v) => handlePreferenceChange('compactView', v)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <WalletSelectorModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}
