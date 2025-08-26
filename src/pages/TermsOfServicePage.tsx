import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

const TermsOfServicePage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="mb-8">
            <CardContent className="pt-6 prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using MockInvi ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                MockInvi is an AI-powered interview preparation platform that provides:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Mock interview sessions with AI analysis</li>
                <li>Resume analysis and optimization tools</li>
                <li>Learning resources and interview guides</li>
                <li>Job search assistance</li>
                <li>Performance tracking and analytics</li>
                <li>Career development resources</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">3. User Accounts and Registration</h2>
              <p className="text-muted-foreground mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Update your information to keep it current</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">4. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload malicious content or viruses</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the system</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Share your account credentials with others</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">5. Subscription and Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Free Tier</h3>
              <p className="text-muted-foreground mb-4">
                MockInvi offers a free tier with limited features. Free accounts may be subject to usage limitations.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Paid Subscriptions</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Subscription fees are billed in advance on a monthly basis</li>
                <li>Payment is due immediately upon subscription</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change subscription prices with 30 days notice</li>
                <li>Subscriptions auto-renew unless cancelled</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3">Cancellation</h3>
              <p className="text-muted-foreground mb-4">
                You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">6. Intellectual Property Rights</h2>
              <p className="text-muted-foreground mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive 
                property of MockInvi and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">User Content</h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of content you submit to MockInvi. By submitting content, you grant us a 
                non-exclusive, worldwide, royalty-free license to use, reproduce, and analyze your content solely 
                to provide the Service.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">7. Privacy and Data Protection</h2>
              <p className="text-muted-foreground mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect 
                your information when you use our Service.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">8. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Service Availability</h3>
              <p className="text-muted-foreground mb-4">
                We strive to maintain high availability but do not guarantee uninterrupted service. 
                We may suspend service for maintenance or updates.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">AI Analysis Disclaimer</h3>
              <p className="text-muted-foreground mb-4">
                MockInvi uses AI technology to analyze interviews and provide feedback. While we strive for accuracy, 
                AI analysis should be used as a guide and not as absolute truth. Results may vary and should be 
                considered alongside other interview preparation methods.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">No Employment Guarantee</h3>
              <p className="text-muted-foreground mb-4">
                MockInvi is a preparation tool and does not guarantee job placement or interview success. 
                Career outcomes depend on many factors beyond our service.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, MockInvi shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">10. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend your account immediately if you breach these Terms. 
                You may terminate your account at any time by contacting support.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">11. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material 
                changes via email or platform notification. Continued use after changes constitutes acceptance.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">12. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be interpreted and governed by the laws of the State of California, 
                without regard to conflict of law provisions.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">13. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none mb-4 text-muted-foreground">
                <li>Email: legal@mockinvi.com</li>
                <li>Address: 123 Innovation Drive, Tech Park, CA 94107</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfServicePage;