import React from 'react';
import LegalPage from '../components/ui/LegalPage';
import { CONTACT } from '../constants/urls';

const SECTIONS = [
  {
    title: 'Use of the Website',
    body: [
      'By accessing the Paavan Setu website, you agree to use it only for lawful purposes and in accordance with these Terms of Service. You may not use this site in any way that could damage, disable, or impair the website or interfere with any other user\u2019s access.',
    ],
  },
  {
    title: 'Book Orders and Payments',
    body: [
      'When you place an order for a book, you agree to provide accurate and complete information. All payments are processed securely through Razorpay.',
      'We reserve the right to cancel or refuse any order if we suspect fraudulent activity or if the requested item is no longer available.',
    ],
  },
  {
    title: 'Refunds and Cancellations',
    body: [
      'Due to the digital nature of some of our products, we encourage you to review the book details carefully before purchase. Physical book orders that have not been shipped may be cancelled for a full refund within 24 hours of purchase.',
      'For any issues with your order, please contact us and we will work to resolve the matter promptly.',
    ],
  },
  {
    title: 'Intellectual Property',
    body: [
      'All content on this website, including books, text, graphics, logos, and images, is the intellectual property of Paavan Setu unless otherwise stated. You may not reproduce, distribute, or create derivative works from this content without our express written permission.',
    ],
  },
  {
    title: 'Limitation of Liability',
    body: [
      'Paavan Setu provides this website and its content on an "as is" basis. While we strive to ensure accuracy, we do not warrant that the website will be error-free or uninterrupted.',
      'To the fullest extent permitted by law, Paavan Setu shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website.',
    ],
  },
  {
    title: 'Contact Us',
    body: [
      `If you have any questions about these Terms of Service, please contact us at ${CONTACT.email} or ${CONTACT.phone}.`,
    ],
  },
];

export default function Terms() {
  return <LegalPage title="Terms of Service" sections={SECTIONS} />;
}
