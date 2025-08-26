import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="mb-8">
            <CardContent className="pt-6 prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials and profile information</li>
                <li>Payment and billing information</li>
                <li>Interview recordings and practice sessions (with your consent)</li>
                <li>Resume and career-related documents you upload</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3">Usage Data</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect information about your use of MockInvi, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Pages visited and features used</li>
                <li>Time and duration of sessions</li>
                <li>Performance analytics and error logs</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Provide and improve our interview preparation services</li>
                <li>Personalize your learning experience</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates and notifications</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to enhance our platform</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">3. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell or rent your personal information. We may share information in these situations:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>With service providers who help us operate MockInvi</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                <li>With your explicit consent</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">4. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Employee training on data protection practices</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">5. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Restrict processing of your information</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Improve platform performance</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                You can control cookie settings through your browser preferences.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">7. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                MockInvi integrates with third-party services including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Payment processors (Razorpay)</li>
                <li>AI services for interview analysis</li>
                <li>Cloud storage providers</li>
                <li>Analytics services</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                These services have their own privacy policies, which we encourage you to review.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">8. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as necessary to provide our services or as required by law. 
                You can request deletion of your account and data at any time.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">9. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for such transfers.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy periodically. We will notify you of material changes 
                via email or platform notification.
              </p>

              <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8">11. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none mb-4 text-muted-foreground">
                <li>Email: privacy@mockinvi.com</li>
                <li>Address: 123 Innovation Drive, Tech Park, CA 94107</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicyPage;