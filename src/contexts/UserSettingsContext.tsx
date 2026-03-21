'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { UserSettings, ConnectedWallet, NotificationPreferences, PrivacySettings, UserPreferences } from '@/types/user';

const SETTINGS_KEY = 'satchel_user_settings';
const WALLETS_KEY = 'satchel_connected_wallets';

interface UserSettingsContextType {
  settings: UserSettings | null;
  connectedWallets: ConnectedWallet[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Profile actions
  updateProfile: (updates: Partial<UserSettings['profile']>) => Promise<void>;
  
  // Notification actions
  updateNotifications: (updates: Partial<NotificationPreferences>) => Promise<void>;
  
  // Privacy actions
  updatePrivacy: (updates: Partial<PrivacySettings>) => Promise<void>;
  
  // Preference actions
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Wallet actions
  addWallet: (wallet: ConnectedWallet) => Promise<void>;
  removeWallet: (address: string) => Promise<void>;
  setPrimaryWallet: (address: string) => Promise<void>;
  getPrimaryWallet: () => ConnectedWallet | null;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  // Return a safe default if used outside provider (during SSR or static generation)
  if (!context) {
    return {
      settings: null,
      connectedWallets: [],
      isLoading: false,
      isSaving: false,
      error: 'Provider not available',
      updateProfile: async () => {},
      updateNotifications: async () => {},
      updatePrivacy: async () => {},
      updatePreferences: async () => {},
      addWallet: async () => {},
      removeWallet: async () => {},
      setPrimaryWallet: async () => {},
      getPrimaryWallet: () => null,
    };
  }
  return context;
}

interface UserSettingsProviderProps {
  children: ReactNode;
  initialAddress?: string;
}

export function UserSettingsProvider({ children, initialAddress }: UserSettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      const savedWallets = localStorage.getItem(WALLETS_KEY);

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      if (savedWallets) {
        setConnectedWallets(JSON.parse(savedWallets));
      } else if (initialAddress) {
        // Create initial wallet entry if we have an address
        const initialWallet: ConnectedWallet = {
          address: initialAddress,
          walletType: 'pera', // Default, will be updated on actual connect
          isPrimary: true,
          connectedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        };
        setConnectedWallets([initialWallet]);
        localStorage.setItem(WALLETS_KEY, JSON.stringify([initialWallet]));
      }
    } catch (e) {
      console.error('Failed to load user settings:', e);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [initialAddress]);

  // Save settings helper
  const saveSettings = useCallback((newSettings: UserSettings) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  // Save wallets helper
  const saveWallets = useCallback((wallets: ConnectedWallet[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    setConnectedWallets(wallets);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserSettings['profile']>) => {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newSettings: UserSettings = {
        ...settings,
        profile: {
          ...settings.profile,
          ...updates,
        },
      };
      saveSettings(newSettings);
    } catch (e) {
      setError('Failed to update profile');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveSettings]);

  // Update notifications
  const updateNotifications = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newSettings: UserSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          ...updates,
        },
      };
      saveSettings(newSettings);
    } catch (e) {
      setError('Failed to update notifications');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveSettings]);

  // Update privacy
  const updatePrivacy = useCallback(async (updates: Partial<PrivacySettings>) => {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newSettings: UserSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          ...updates,
        },
      };
      saveSettings(newSettings);
    } catch (e) {
      setError('Failed to update privacy settings');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveSettings]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const newSettings: UserSettings = {
        ...settings,
        preferences: {
          ...settings.preferences,
          ...updates,
        },
      };
      saveSettings(newSettings);
    } catch (e) {
      setError('Failed to update preferences');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveSettings]);

  // Add wallet
  const addWallet = useCallback(async (wallet: ConnectedWallet) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const existing = connectedWallets.find(w => w.address === wallet.address);
      if (existing) {
        // Update last used
        const updated = connectedWallets.map(w =>
          w.address === wallet.address
            ? { ...w, lastUsed: new Date().toISOString() }
            : w
        );
        saveWallets(updated);
      } else {
        // Check if this should be primary
        let newWallets = [...connectedWallets];
        if (wallet.isPrimary) {
          // Remove primary from others
          newWallets = newWallets.map(w => ({ ...w, isPrimary: false }));
        }
        newWallets.push({
          ...wallet,
          lastUsed: new Date().toISOString(),
        });
        saveWallets(newWallets);
      }
    } catch (e) {
      setError('Failed to add wallet');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [connectedWallets, saveWallets]);

  // Remove wallet
  const removeWallet = useCallback(async (address: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const remaining = connectedWallets.filter(w => w.address !== address);
      
      // If we removed the primary, make another one primary
      if (remaining.length > 0 && !remaining.some(w => w.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      
      saveWallets(remaining);
    } catch (e) {
      setError('Failed to remove wallet');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [connectedWallets, saveWallets]);

  // Set primary wallet
  const setPrimaryWallet = useCallback(async (address: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const updated = connectedWallets.map(w => ({
        ...w,
        isPrimary: w.address === address,
      }));
      saveWallets(updated);
    } catch (e) {
      setError('Failed to set primary wallet');
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [connectedWallets, saveWallets]);

  // Get primary wallet
  const getPrimaryWallet = useCallback((): ConnectedWallet | null => {
    return connectedWallets.find(w => w.isPrimary) || null;
  }, [connectedWallets]);

  const value: UserSettingsContextType = {
    settings,
    connectedWallets,
    isLoading,
    isSaving,
    error,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    updatePreferences,
    addWallet,
    removeWallet,
    setPrimaryWallet,
    getPrimaryWallet,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}
