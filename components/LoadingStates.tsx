import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';

interface LoadingStateProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryText?: string;
  style?: any;
}

interface OfflineStateProps {
  onRetry?: () => void;
  style?: any;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

// Loading spinner with optional text
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  size = 'large', 
  color = '#3B82F6', 
  text,
  style 
}) => {
  return (
    <View style={[styles.centerContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

// Error state with retry button
export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  retryText = 'Try Again',
  style 
}) => {
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={styles.errorIconContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Offline state
export const OfflineState: React.FC<OfflineStateProps> = ({ 
  onRetry,
  style 
}) => {
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={styles.offlineIconContainer}>
        <IconSymbol name="wifi.slash" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.offlineTitle}>You're offline</Text>
      <Text style={styles.offlineText}>
        Check your internet connection and try again
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Check Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Empty state with customizable content
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  subtitle, 
  actionText, 
  onAction,
  style 
}) => {
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={styles.emptyIconContainer}>
        <IconSymbol name={icon} size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Inline loading for small components
export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color="#3B82F6" />
      {text && <Text style={styles.inlineText}>{text}</Text>}
    </View>
  );
};

// Loading overlay that covers the entire screen
export const LoadingOverlay: React.FC<{ visible: boolean; text?: string }> = ({ 
  visible, 
  text = 'Loading...' 
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.overlayText}>{text}</Text>
      </View>
    </View>
  );
};

// Connection status banner
export const ConnectionBanner: React.FC<{ 
  isOnline: boolean; 
  hasError: boolean;
  onRetry?: () => void;
}> = ({ isOnline, hasError, onRetry }) => {
  if (isOnline && !hasError) return null;

  return (
    <View style={[
      styles.banner, 
      hasError ? styles.errorBanner : styles.offlineBanner
    ]}>
      <IconSymbol 
        name={hasError ? "exclamationmark.triangle" : "wifi.slash"} 
        size={16} 
        color="#FFFFFF" 
      />
      <Text style={styles.bannerText}>
        {hasError ? 'Connection error' : 'No internet connection'}
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offlineIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
  },
  offlineBanner: {
    backgroundColor: '#9CA3AF',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bannerButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});