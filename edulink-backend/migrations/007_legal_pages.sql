-- Legal pages (Privacy Policy, Terms & Conditions)
CREATE TABLE IF NOT EXISTS legal_pages (
  key TEXT PRIMARY KEY,           -- 'privacy', 'terms'
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default content
INSERT OR IGNORE INTO legal_pages (key, title, content) VALUES ('privacy', 'Privacy Policy',
'# Privacy Policy

**Last Updated: May 2026**

## 1. Information We Collect

We collect information you provide directly to us, including:
- Name, email address, and profile information
- Learning preferences and interests
- Communication records with tutors
- Device information for app functionality

## 2. How We Use Your Information

We use your information to:
- Connect you with qualified tutors
- Personalize your learning experience
- Process bookings and payments
- Send relevant notifications about your classes
- Improve our platform and services

## 3. Data Sharing

We do not sell your personal data. We share data only:
- With tutors you book sessions with
- With service providers who help operate our platform
- When required by law

## 4. Data Security

We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.

## 5. Your Rights

You can:
- Access and update your personal data through your account settings
- Request deletion of your account and associated data
- Opt out of marketing communications

## 6. Contact Us

For privacy-related questions, contact us at privacy@edulink.app');

INSERT OR IGNORE INTO legal_pages (key, title, content) VALUES ('terms', 'Terms & Conditions',
'# Terms & Conditions

**Last Updated: May 2026**

## 1. Acceptance of Terms

By using EduLink, you agree to these terms. If you do not agree, do not use the platform.

## 2. User Accounts

- You must provide accurate information when creating an account
- You are responsible for maintaining the confidentiality of your account
- You must be at least 13 years old to use the platform

## 3. Tutor-Student Relationship

- EduLink connects students with independent tutors
- Tutors are not employees of EduLink
- We facilitate bookings but are not responsible for the quality of tutoring sessions
- Disputes between students and tutors should be resolved between the parties

## 4. Payments & Subscriptions

- Payment is required before sessions begin
- Subscription plans auto-renew unless cancelled
- Refund requests are handled on a case-by-case basis
- Refer to our Refund Policy for details

## 5. Code of Conduct

Users agree to:
- Treat others with respect
- Not share inappropriate content
- Not use the platform for illegal purposes
- Respect intellectual property rights

## 6. Limitation of Liability

EduLink is provided "as is" without warranties. We are not liable for damages arising from use of the platform.

## 7. Changes to Terms

We may update these terms at any time. Continued use after changes constitutes acceptance.

## 8. Contact

For questions about these terms, contact legal@edulink.app');
