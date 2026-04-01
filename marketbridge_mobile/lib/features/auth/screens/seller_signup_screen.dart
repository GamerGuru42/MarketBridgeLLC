import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';

class SellerSignupScreen extends StatefulWidget {
  const SellerSignupScreen({super.key});

  @override
  State<SellerSignupScreen> createState() => _SellerSignupScreenState();
}

class _SellerSignupScreenState extends State<SellerSignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _matricController = TextEditingController();
  final _otherUniController = TextEditingController();

  String? _selectedUniversity;
  bool _isLoading = false;

  final List<String> _universities = [
    'Baze University',
    'Nile University of Nigeria',
    'Veritas University',
    'Other Abuja Private University',
  ];

  Future<void> _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedUniversity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your campus.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Simulate magic link sending logic
    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isLoading = false);

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('Initialization Key Sent', style: TextStyle(fontWeight: FontWeight.w900)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.mark_email_read_outlined, size: 48, color: AppTheme.primarySecondary),
              const SizedBox(height: 16),
              const Text(
                'A secure verification node has been dispatched to your email. It expires in 30 minutes.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Fallback: If delivery fails, you hold 48-hour temporary merchant access pending Admin manual review.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
              ),
            ],
          ),
          actionsAlignment: MainAxisAlignment.center,
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                // context.go('/dashboard/seller'); // proceed
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primarySecondary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Acknowledge', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MERCHANT NODE'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                Text(
                  'Merchant Protocol',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: Colors.black87,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Authorize your identity for escrow clearance.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 32),

                TextFormField(
                  controller: _nameController,
                  decoration: _inputDeco('Full Registered Name', Icons.person_outline),
                  validator: (val) => val == null || val.isEmpty ? 'Required field' : null,
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _inputDeco('Primary Email', Icons.email_outlined),
                  validator: (val) => val == null || !val.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: _inputDeco('Contact Number', Icons.phone_outlined),
                  validator: (val) => val == null || val.isEmpty ? 'Required for operations' : null,
                ),
                const SizedBox(height: 16),

                DropdownButtonFormField<String>(
                  decoration: _inputDeco('Select Campus Region', Icons.account_balance_outlined),
                  value: _selectedUniversity,
                  items: _universities.map((uni) {
                    return DropdownMenuItem(value: uni, child: Text(uni, style: const TextStyle(fontSize: 14)));
                  }).toList(),
                  onChanged: (val) => setState(() => _selectedUniversity = val),
                ),
                
                if (_selectedUniversity == 'Other Abuja Private University') ...[
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _otherUniController,
                    decoration: _inputDeco('Enter Institution Name', Icons.domain),
                    validator: (val) => val == null || val.isEmpty ? 'Please specify' : null,
                  ),
                ],

                const SizedBox(height: 16),
                TextFormField(
                  controller: _matricController,
                  decoration: _inputDeco('Matriculation Node (Optional)', Icons.badge_outlined),
                ),

                const SizedBox(height: 48),

                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSignup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black87,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                      : const Text(
                          'REQUEST MERCHANT BINDING',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2.0, color: Colors.white),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      prefixIcon: Icon(icon),
    );
  }
}
