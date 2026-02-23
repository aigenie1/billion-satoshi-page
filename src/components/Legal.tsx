import React from 'react';
import { Shield, Scale, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'motion/react';

const legalSections = [
  {
    icon: <Shield className="w-5 h-5 text-blue-600" />,
    title: "Terms of Service",
    content: [
      "By purchasing pixels, you agree that your content will be scanned by AI for safety.",
      "We reserve the right to remove any content that bypasses our filters and contains illegal material.",
      "Purchases are final and non-refundable due to the immutable nature of the grid.",
      "You are responsible for the legality of the links and images you provide."
    ]
  },
  {
    icon: <Lock className="w-5 h-5 text-green-600" />,
    title: "Privacy Policy",
    content: [
      "We do not collect personal data beyond your wallet address and provided ad content.",
      "Images are processed by Google Gemini AI for safety scanning purposes only.",
      "No tracking cookies are used on this platform.",
      "Your wallet address is public on the blockchain as part of the transaction."
    ]
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    title: "Disclaimer",
    content: [
      "This is a decentralized experiment. Use at your own risk.",
      "We are not responsible for the content of external links provided by users.",
      "Cryptocurrency values are volatile; prices are pegged to USDT for stability.",
      "The simulation mode is for demonstration purposes only."
    ]
  }
];

export default function Legal() {
  return (
    <section id="legal" className="py-16 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Legal Information</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transparency and safety are our top priorities. Please review our policies before participating.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {legalSections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {section.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-gray-300 mt-1.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Pixel Crypto Ads. All rights reserved.</p>
          <p className="mt-2 italic">Built with integrity on the decentralized web.</p>
        </div>
      </div>
    </section>
  );
}
