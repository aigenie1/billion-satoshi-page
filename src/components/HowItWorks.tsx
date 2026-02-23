import React from 'react';
import { MousePointer2, ShieldCheck, Wallet, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const steps = [
  {
    icon: <MousePointer2 className="w-6 h-6" />,
    title: "1. Select Your Space",
    description: "Click and drag on the grid to select the exact pixels you want to own. Each block is 10x10 pixels."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "2. AI Security Scan",
    description: "Upload your image. Our Gemini AI automatically scans for safety, ensuring a clean environment for everyone."
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "3. Connect & Pay",
    description: "Connect your favorite wallet (MetaMask, Phantom, Sui) and pay with USDT or native tokens."
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "4. Go Live",
    description: "Once confirmed, your ad appears instantly on the grid with your custom link and hover title."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">How it Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join the decentralized advertising revolution. Own a piece of internet history in just four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors group"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 text-gray-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              !
            </div>
            <div>
              <h4 className="font-bold text-orange-900">Ready to start?</h4>
              <p className="text-sm text-orange-700">Select an area on the grid above to begin your purchase.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Current Price</p>
            <p className="text-2xl font-mono font-bold text-orange-900">$0.01 USDT / Pixel</p>
          </div>
        </div>
      </div>
    </section>
  );
}
