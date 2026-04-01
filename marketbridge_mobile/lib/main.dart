import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/theme.dart';
import 'features/auth/screens/role_selection_screen.dart';
import 'features/auth/screens/buyer_signup_screen.dart';
import 'features/auth/screens/seller_signup_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TODO: Configure your Supabase instance 
  // await Supabase.initialize(
  //   url: 'YOUR_SUPABASE_URL',
  //   anonKey: 'YOUR_SUPABASE_ANON_KEY',
  // );

  runApp(
    const ProviderScope(
      child: MarketBridgeApp(),
    ),
  );
}

// Router configuration
final GoRouter _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const RoleSelectionScreen(),
    ),
    GoRoute(
      path: '/signup/buyer',
      builder: (context, state) => const BuyerSignupScreen(),
    ),
    GoRoute(
      path: '/signup/seller',
      builder: (context, state) => const SellerSignupScreen(),
    ),
  ],
);

class MarketBridgeApp extends ConsumerWidget {
  const MarketBridgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'MarketBridge',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
