import React from 'react';
import { ArrowRight, CheckCircle, BarChart2, Shield, Clock, Cpu, Zap, Database } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  return (
    <div className="space-y-8 md:space-y-16 pb-6 md:pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-primary-dark">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-secondary opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-secondary opacity-10 blur-3xl"></div>
        
        <div className="relative px-4 sm:px-8 py-10 md:py-16 lg:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight">
            The <span className="text-secondary">Future</span> of Property Transactions
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto mb-6 md:mb-10">
            EasyConvey leverages cutting-edge AI to streamline conveyancing, automate KYC verification, 
            and ensure seamless compliance—all in one digital platform.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3.5 text-sm md:text-base font-medium rounded-lg shadow-soft-md text-primary bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 ease-in-out"
          >
            Begin Your Process
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-soft p-5 md:p-8 text-center hover:shadow-soft-md transition-shadow">
          <p className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">93%</p>
          <p className="text-sm md:text-base text-gray-600">Reduction in processing time</p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-5 md:p-8 text-center hover:shadow-soft-md transition-shadow">
          <p className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">99.8%</p>
          <p className="text-sm md:text-base text-gray-600">Compliance accuracy rate</p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-5 md:p-8 text-center hover:shadow-soft-md transition-shadow">
          <p className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">10,000+</p>
          <p className="text-sm md:text-base text-gray-600">Successful transactions</p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4">Powered by Advanced Technology</h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform integrates cutting-edge AI, blockchain verification, and automated compliance 
            to deliver a seamless property transaction experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="p-5 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-5">
                <Cpu className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">AI-Powered Document Analysis</h3>
              <p className="text-sm md:text-base text-gray-600">
                Intelligent document verification that validates property deeds, identifies risks, and ensures 
                legal compliance in seconds, not days.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="p-5 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-5">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">Automated KYC Compliance</h3>
              <p className="text-sm md:text-base text-gray-600">
                Advanced identity verification that meets global regulatory standards while 
                streamlining the user experience.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="p-5 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-5">
                <Database className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">Secure Digital Vault</h3>
              <p className="text-sm md:text-base text-gray-600">
                Bank-level encryption protecting all your sensitive documents and transaction data 
                with immutable audit trails.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4">How EasyConvey Works</h2>
            <p className="text-sm md:text-lg text-gray-600 max-w-3xl mx-auto">
              Our streamlined process makes property transactions faster, safer, and more transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-y-12 md:gap-x-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center mb-4 md:mb-6 relative">
                <span className="text-lg md:text-xl font-bold text-white">1</span>
                <div className="absolute top-1/2 left-full h-0.5 w-full bg-secondary/40 hidden md:block"></div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">Begin Your Transaction</h3>
              <p className="text-sm md:text-base text-gray-600">
                Select whether you're buying or selling property and upload your documents. Our AI instantly validates everything.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center mb-4 md:mb-6 relative">
                <span className="text-lg md:text-xl font-bold text-white">2</span>
                <div className="absolute top-1/2 left-full h-0.5 w-full bg-secondary/40 hidden md:block"></div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">Review & Compliance</h3>
              <p className="text-sm md:text-base text-gray-600">
                Our system automatically identifies required documents based on your situation and guides you through the process.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center mb-4 md:mb-6">
                <span className="text-lg md:text-xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">Complete Your Transfer</h3>
              <p className="text-sm md:text-base text-gray-600">
                Receive automated guidance on final steps like tax clearance and compliance certificates to finalize your transaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4">Trusted by Professionals</h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-3xl mx-auto">
            EasyConvey is the platform of choice for property professionals and agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="bg-white rounded-lg p-5 md:p-8 shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="h-10 h-10 md:h-12 md:w-12 rounded-full bg-secondary/20 mr-3 md:mr-4"></div>
              <div>
                <h4 className="font-semibold text-primary text-base md:text-lg">Sarah Johnson</h4>
                <p className="text-gray-500 text-xs md:text-sm">Real Estate Attorney</p>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              "EasyConvey has revolutionized our property practice. What used to take weeks now happens in days, with better compliance and transparency for our clients."
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-5 md:p-8 shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="h-10 h-10 md:h-12 md:w-12 rounded-full bg-secondary/20 mr-3 md:mr-4"></div>
              <div>
                <h4 className="font-semibold text-primary text-base md:text-lg">Michael Chen</h4>
                <p className="text-gray-500 text-xs md:text-sm">Property Developer</p>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              "The AI-powered document verification alone has saved us countless hours. EasyConvey helps us close deals faster while maintaining the highest standards of due diligence."
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary-dark">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute -bottom-8 -right-8 h-64 w-64 rounded-full bg-secondary opacity-20 blur-3xl"></div>
        
        <div className="relative px-4 sm:px-8 py-8 md:py-16 text-center">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Ready to Transform Your Property Transactions?</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto mb-6 md:mb-10">
            Join thousands of professionals using EasyConvey to streamline their property transactions.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 border-2 border-secondary text-base md:text-lg font-medium rounded-lg text-secondary bg-transparent hover:bg-secondary hover:text-primary transition-colors duration-300"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;