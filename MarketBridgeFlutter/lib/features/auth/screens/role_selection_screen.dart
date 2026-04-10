import 'package:flutter/material.dart';
import 'admin_login_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: -150,
            left: MediaQuery.of(context).size.width / 2 - 300,
            child: Container(
              width: 600,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).primaryColor.withOpacity(0.15),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).primaryColor.withOpacity(0.1),
                    blurRadius: 150,
                    spreadRadius: 80,
                  )
                ],
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 600),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(48),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.5),
                        blurRadius: 80,
                        spreadRadius: 10,
                      )
                    ],
                  ),
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 42,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            letterSpacing: -1.5,
                          ),
                          children: [
                            const TextSpan(text: 'MARKET', style: TextStyle(color: Colors.white)),
                            TextSpan(text: 'BRIDGE', style: TextStyle(color: Theme.of(context).primaryColor)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'SELECT CLEARANCE AUTHORIZATION LEVEL',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      ),
                      const SizedBox(height: 48),
                      
                      // Role Grid
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 1.0,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildRoleButton(
                            context,
                            title: 'BUYER',
                            subtitle: 'SHOP',
                            icon: Icons.person_outline,
                            onTap: () {
                              // Navigate to Public Login later
                            },
                          ),
                          _buildRoleButton(
                            context,
                            title: 'SELLER',
                            subtitle: 'MERCHANT',
                            icon: Icons.storefront_outlined,
                            onTap: () {
                              // Navigate to Seller Login
                            },
                          ),
                          _buildRoleButton(
                            context,
                            title: 'ADMIN',
                            subtitle: 'OPS',
                            icon: Icons.security_outlined,
                            onTap: () {
                              // Navigator.push handles "proper back button" stack
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const AdminLoginScreen(roleName: "Admin"),
                                ),
                              );
                            },
                          ),
                          _buildRoleButton(
                            context,
                            title: 'CEO',
                            subtitle: 'GROWTH',
                            icon: Icons.key,
                            isPremium: true,
                            onTap: () {
                              // Navigator.push handles "proper back button" stack
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const AdminLoginScreen(roleName: "CEO"),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleButton(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    bool isPremium = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        splashColor: Theme.of(context).primaryColor.withOpacity(0.2),
        highlightColor: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: isPremium 
                ? Theme.of(context).primaryColor.withOpacity(0.05) 
                : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isPremium 
                  ? Theme.of(context).primaryColor.withOpacity(0.2) 
                  : Colors.white.withOpacity(0.1),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: isPremium ? Theme.of(context).primaryColor : Colors.white54,
                  size: 24,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: isPremium ? Theme.of(context).primaryColor : Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 8,
                  letterSpacing: 1.5,
                  color: Colors.white.withOpacity(0.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
