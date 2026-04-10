import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Dart implementation of client-side Brute Force protection for critical flows.
/// (Server-side middleware handles ultimate authority, but this prevents spam clicks).
class RateLimiter {
  static const FlutterSecureStorage _secureStore = FlutterSecureStorage();
  
  static const int maxAttempts = 5; // Stricter limit on mobile
  static const int timeoutMiliseconds = 15 * 60 * 1000; // 15 mins
  
  static Future<bool> canProceedToLogin() async {
    final strAttempts = await _secureStore.read(key: 'auth_attempt_count');
    final strFirstAttemptTime = await _secureStore.read(key: 'auth_attempt_time');
    
    int count = strAttempts != null ? int.parse(strAttempts) : 0;
    int firstAttemptTime = strFirstAttemptTime != null ? int.parse(strFirstAttemptTime) : 0;
    
    final int now = DateTime.now().millisecondsSinceEpoch;
    
    if (count >= maxAttempts) {
      if (now - firstAttemptTime < timeoutMiliseconds) {
        return false; // Still blocked
      } else {
        // Block expired, reset storage
        await resetLimiter();
        return true;
      }
    }
    
    return true; // Not blocked yet
  }
  
  static Future<void> registerFailedAttempt() async {
    final strAttempts = await _secureStore.read(key: 'auth_attempt_count');
    int count = strAttempts != null ? int.parse(strAttempts) : 0;
    
    if (count == 0) {
      // First strike, establish timestamp
      await _secureStore.write(
        key: 'auth_attempt_time',
        value: DateTime.now().millisecondsSinceEpoch.toString(),
      );
    }
    
    count++;
    await _secureStore.write(key: 'auth_attempt_count', value: count.toString());
  }
  
  static Future<void> resetLimiter() async {
    await _secureStore.delete(key: 'auth_attempt_count');
    await _secureStore.delete(key: 'auth_attempt_time');
  }

  /// Extremely safe signOut operation resolving residual tokens.
  static Future<void> secureSignOut() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (_) {}
    
    // Wipe local traces
    await _secureStore.deleteAll();
  }
}
