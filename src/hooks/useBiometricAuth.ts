/**
 * useBiometricAuth - Biometric Authentication Hook
 * Spec: mobile-native-app-layout
 * Phase 4: Biometric Integration (Face ID / Fingerprint)
 *
 * Provides Web Authentication API (WebAuthn) integration
 * for biometric authentication on mobile devices
 *
 * iOS: Face ID, Touch ID
 * Android: Fingerprint, Face Recognition
 *
 * Requirements: AC-7.1 (iOS Face ID), AC-7.2 (Android Fingerprint)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlatform, useIOSVersion, useAndroidDeviceInfo } from './usePlatform';

export interface BiometricCapabilities {
  isAvailable: boolean;
  type: 'face' | 'fingerprint' | 'none';
  platform: 'ios' | 'android' | 'web';
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credential?: PublicKeyCredential;
}

/**
 * Hook to check biometric authentication availability
 */
export function useBiometricAuth() {
  const platform = usePlatform();
  const iosVersion = useIOSVersion();
  const androidInfo = useAndroidDeviceInfo();

  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    type: 'none',
    platform: 'web'
  });

  useEffect(() => {
    checkBiometricCapabilities();
  }, [platform, iosVersion, androidInfo.androidVersion]);

  const checkBiometricCapabilities = async () => {
    // Check if WebAuthn is available
    if (!window.PublicKeyCredential) {
      setCapabilities({
        isAvailable: false,
        type: 'none',
        platform: platform
      });
      return;
    }

    try {
      // Check platform authenticator (biometric) availability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      if (!available) {
        setCapabilities({
          isAvailable: false,
          type: 'none',
          platform: platform
        });
        return;
      }

      // Determine biometric type based on platform
      let biometricType: 'face' | 'fingerprint' | 'none' = 'none';

      if (platform === 'ios') {
        // iOS 14+: Face ID on newer devices, Touch ID on older devices
        // Assume Face ID for iOS 14+ (most devices)
        if (iosVersion && iosVersion >= 14) {
          biometricType = 'face';
        }
      } else if (platform === 'android') {
        // Android 10+: Assume fingerprint (most common)
        // Face recognition is less standardized
        if (androidInfo.androidVersion && androidInfo.androidVersion >= 10) {
          biometricType = 'fingerprint';
        }
      }

      setCapabilities({
        isAvailable: true,
        type: biometricType,
        platform: platform
      });
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCapabilities({
        isAvailable: false,
        type: 'none',
        platform: platform
      });
    }
  };

  /**
   * Register biometric credential
   * This should be called after user logs in with password
   */
  const registerBiometric = useCallback(async (
    userId: string,
    username: string
  ): Promise<BiometricAuthResult> => {
    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available'
      };
    }

    try {
      // Generate challenge on server (this is a placeholder)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Create credential options
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Wasteland Tarot',
          id: window.location.hostname
        },
        user: {
          id: Uint8Array.from(userId, c => c.charCodeAt(0)),
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey
      }) as PublicKeyCredential;

      if (!credential) {
        return {
          success: false,
          error: 'Failed to create credential'
        };
      }

      // TODO: Send credential to server for registration
      // await registerCredentialOnServer(credential);

      return {
        success: true,
        credential
      };
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }, [capabilities]);

  /**
   * Authenticate using biometric
   * This should be called when user wants to log in with biometric
   */
  const authenticateBiometric = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available'
      };
    }

    try {
      // Generate challenge on server (this is a placeholder)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get credential options
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname
      };

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey
      }) as PublicKeyCredential;

      if (!credential) {
        return {
          success: false,
          error: 'Failed to authenticate'
        };
      }

      // TODO: Send credential to server for verification
      // const authResult = await verifyCredentialOnServer(credential);

      return {
        success: true,
        credential
      };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }, [capabilities]);

  return {
    capabilities,
    registerBiometric,
    authenticateBiometric,
    isAvailable: capabilities.isAvailable,
    biometricType: capabilities.type
  };
}

/**
 * Biometric authentication labels for UI
 */
export const BiometricLabels = {
  ios: {
    face: 'Face ID',
    fingerprint: 'Touch ID'
  },
  android: {
    face: '面部辨識',
    fingerprint: '指紋辨識'
  }
} as const;
