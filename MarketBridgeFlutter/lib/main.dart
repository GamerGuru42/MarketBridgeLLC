import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';

import 'features/auth/screens/role_selection_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // IMPORTANT: Replace with actual Supabase keys from the Web .env file
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );

  runApp(
    MultiProvider(
      providers: [
        // Inject auth state, rate limiter services, etc. here later
        Provider(create: (_) => 'SecurityProviderBase'),
      ],
      child: const MarketBridgeApp(),
    ),
  );
}

class MarketBridgeApp extends StatelessWidget {
  const MarketBridgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MarketBridge',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF000000), // Hyper-Premium Black base
        primaryColor: const Color(0xFFFF6200), // Brand Orange
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF6200),
          surface: Color(0xFF111111), // Card color
        ),
        fontFamily: 'Inter', // Represents the modern sans-serif utilized in the web build
      ),
      home: const RoleSelectionScreen(),
    );
  }
}
