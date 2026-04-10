import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/security/rate_limiter.dart';

class AdminLoginScreen extends StatefulWidget {
  final String roleName;

  const AdminLoginScreen({super.key, required this.roleName});

  @override
  State<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends State<AdminLoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMsg;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    try {
      // 1. Check Rate Limiter
      final isAllowed = await RateLimiter.canProceedToLogin();
      if (!isAllowed) {
        throw 'Security Lock: Too many failed attempts. Try again in 15 minutes.';
      }

      final email = _emailController.text.trim();
      final password = _passwordController.text;

      if (email.isEmpty || password.isEmpty) {
        throw 'Missing cryptographic credentials.';
      }

      // 2. Authenticate against Supabase
      final response = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        await RateLimiter.registerFailedAttempt();
        throw 'Authorization failed.';
      }

      // 3. Verify Admin Role Server-Side Payload
      final String? assignedRole = response.user!.userMetadata?['role']?.toString() 
          ?? (await Supabase.instance.client.from('users').select('role').eq('id', response.user!.id).single())['role'];

      final adminRoles = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'];
      
      if (!adminRoles.contains(assignedRole)) {
        await RateLimiter.registerFailedAttempt();
        // Force security logout immediately
        await RateLimiter.secureSignOut();
        throw 'Access Denied: Administrative privileges missing.';
      }

      // Ensure CEO only logs into CEO
      if (widget.roleName == "CEO" && assignedRole != 'ceo' && assignedRole != 'cofounder') {
        throw 'Access Denied: Executive clearance required.';
      }

      // 4. Success Reset & Route
      await RateLimiter.resetLimiter();
      
      if (!mounted) return;
      
      // Push replacement handles clearing the auth stack
      // In a full app, this routes to /admin/ceo or /admin
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Access Granted. Entering Secure Terminal.')),
      );
      
      // Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => VisionCommandDashboard()));
      
    } catch (e) {
      setState(() {
        _errorMsg = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Extreme contrast
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 16),
          onPressed: () {
            // PROPER NAVIGATION: Always pops to previous stack item correctly
            Navigator.of(context).pop();
          },
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    height: 80,
                    width: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).primaryColor.withOpacity(0.3)),
                      color: Colors.black,
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(context).primaryColor.withOpacity(0.1),
                          blurRadius: 30,
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.shield_outlined,
                      size: 40,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    '${widget.roleName} PORTAL',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4.0,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'SECURE IDENTIFICATION PROTOCOL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                      color: Colors.white.withOpacity(0.4),
                    ),
                  ),
                  const SizedBox(height: 48),

                  if (_errorMsg != null)
                    Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _errorMsg!,
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Email Input
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _emailController,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: "admin@marketbridge.io",
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
                        prefixIcon: Icon(Icons.email_outlined, color: Colors.white.withOpacity(0.2)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Password Input
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                      decoration: InputDecoration(
                        hintText: "••••••••••••",
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
                        prefixIcon: Icon(Icons.lock_outline, color: Colors.white.withOpacity(0.2)),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off : Icons.visibility,
                            color: Colors.white.withOpacity(0.2),
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text(
                              'VERIFY ACCESS',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.0,
                                fontSize: 12,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
