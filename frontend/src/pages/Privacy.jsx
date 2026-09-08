import React from 'react';
import LegalPage from '../components/ui/LegalPage';
import { CONTACT } from '../constants/urls';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: [
      'Paavan Setu collects personal information that you voluntarily provide when using our website, including your name, email address, phone number, and any details you submit through our contact forms, booking forms, or when making a purchase.',
      'We also collect non-personal data such as browser type, device information, and pages visited to help us understand how visitors use our site and improve our services.',
    ],
  },
  {
    title: 'How We Use Your Information',
    body: [
      'The information we collect is used to respond to your enquiries, process your bookings and book orders, send you updates about your purchases, and improve the overall quality of our services.',
      'We do not sell, rent, or trade your personal information to any third parties. Your data is used solely for the purposes you intended when providing it.',
    ],
  },
  {
    title: 'Payment Security',
    body: [
      'All online payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We do not store your credit card, debit card, or bank account details on our servers.',
      'Payment transactions are encrypted and securely transmitted directly between you and the payment provider.',
    ],
  },
  {
    title: 'Data Retention',
    body: [
      'We retain your personal information only for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, and resolve disputes.',
      'You may request that we delete your personal data at any time by contacting us using the details below.',
    ],
  },
  {
    title: 'Your Rights',
    body: [
      'You have the right to access, correct, or delete the personal information we hold about you. You may also withdraw consent for us to process your data at any time.',
      'To exercise any of these rights, please reach out to us and we will respond within a reasonable timeframe.',
    ],
  },
  {
    title: 'Contact Us',
    body: [
      `If you have any questions about this Privacy Policy or how your data is handled, please contact us at ${CONTACT.email} or call us at ${CONTACT.phone}.`,
    ],
  },
];

export default function Privacy() {
  return <LegalPage title="Privacy Policy" sections={SECTIONS} />;
}
