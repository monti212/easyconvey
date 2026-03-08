import React, { useEffect, useRef } from 'react';
import { ArrowRight, Shield, FileCheck, Lock, Award, Scale, Users, Zap, LogIn } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elements = ref.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  const scrollRef = useScrollAnimation();

  return (
    <div ref={scrollRef} className="space-y-0 pb-0">

      {/* ── Hero Section ── */}
      <section className="relative bg-primary rounded-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left Content — 3/5 */}
            <div className="lg:col-span-3 animate-fade-in-up">
              <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-secondary mb-6">
                Property Conveyancing, Simplified
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Move property.<br />
                <span className="text-secondary">Not paperwork.</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-lg mt-6 leading-relaxed">
                We handle the legal complexity of buying and selling property, so you can focus on what matters. Digital-first conveyancing for a new generation.
              </p>
              <button
                onClick={onStart}
                className="btn-shine inline-flex items-center gap-2 bg-secondary text-primary font-semibold px-8 py-4 rounded-lg hover:bg-secondary-dark transition-colors duration-300 mt-8 text-base"
              >
                <LogIn className="h-5 w-5" />
                Sign Up / Log In
              </button>
              <div className="flex items-center gap-5 mt-8 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  256-bit Encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  POPIA Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  Law Society Approved
                </span>
              </div>
            </div>

            {/* Right Decorative — 2/5 */}
            <div className="lg:col-span-2 hidden lg:flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="relative w-72 h-80">
                {/* Outer rotated frame */}
                <div className="absolute inset-0 border-2 border-secondary/20 rounded-2xl transform rotate-3" />
                {/* Inner card */}
                <div className="absolute inset-4 bg-primary-light/40 rounded-xl flex flex-col items-center justify-center gap-6 p-8">
                  <Scale className="h-16 w-16 text-secondary/30" />
                  <div className="space-y-3 w-full">
                    <div className="h-0.5 bg-secondary/20 rounded w-4/5 mx-auto" />
                    <div className="h-0.5 bg-secondary/15 rounded w-3/5 mx-auto" />
                    <div className="h-0.5 bg-secondary/10 rounded w-2/5 mx-auto" />
                  </div>
                </div>
                {/* Floating accent dot */}
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-secondary/40" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-secondary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="animate-on-scroll animate-fade-in bg-white border-y border-border py-6 mt-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Users className="h-4 w-4 text-secondary" />
              Trusted by 50+ law firms
            </span>
            <span className="hidden sm:block w-px h-4 bg-border" />
            <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Shield className="h-4 w-4 text-secondary" />
              Regulated & compliant
            </span>
            <span className="hidden sm:block w-px h-4 bg-border" />
            <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Zap className="h-4 w-4 text-secondary" />
              Digital-first process
            </span>
          </div>
        </div>
      </section>

      {/* ── What We Do ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left — Sticky heading */}
            <div className="lg:col-span-2 animate-on-scroll animate-fade-in-left">
              <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-secondary mb-4">
                What We Do
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary leading-tight heading-accent">
                Conveyancing that<br />makes sense.
              </h2>
              <p className="text-gray-600 mt-8 leading-relaxed max-w-sm">
                Every property transaction is different. We use smart technology to handle the repetitive work, so your conveyancer can focus on the parts that actually need human expertise.
              </p>
            </div>

            {/* Right — Feature cards */}
            <div className="lg:col-span-3 space-y-5">
              <div className="animate-on-scroll animate-fade-in-right stagger-1 flex items-start gap-5 p-6 rounded-lg hover-lift bg-white shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Smart Document Review</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Upload your title deed and supporting documents. We verify, extract, and organise everything automatically.
                  </p>
                </div>
              </div>

              <div className="animate-on-scroll animate-fade-in-right stagger-2 flex items-start gap-5 p-6 rounded-lg hover-lift bg-white shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Built-in Compliance</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    KYC checks, FICA verification, and regulatory requirements handled seamlessly within the platform.
                  </p>
                </div>
              </div>

              <div className="animate-on-scroll animate-fade-in-right stagger-3 flex items-start gap-5 p-6 rounded-lg hover-lift bg-white shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Secure & Confidential</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Bank-grade encryption protects every document and data point. Full audit trail for complete transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="animate-on-scroll animate-fade-in-up mb-12 md:mb-16">
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-secondary mb-4">
              Process
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary leading-tight heading-accent">
              Three steps.<br />That's it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20" />

            <div className="animate-on-scroll animate-fade-in-up stagger-1 relative">
              <span className="font-serif text-6xl font-bold text-secondary/15 leading-none">01</span>
              <h3 className="text-xl font-semibold text-primary mt-3">Upload your documents</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs">
                Select your transaction type, upload your title deed, and add property details. Takes about five minutes.
              </p>
            </div>

            <div className="animate-on-scroll animate-fade-in-up stagger-2 relative">
              <span className="font-serif text-6xl font-bold text-secondary/15 leading-none">02</span>
              <h3 className="text-xl font-semibold text-primary mt-3">We handle the compliance</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs">
                Our platform runs verification checks, identifies required documents, and keeps everything on track.
              </p>
            </div>

            <div className="animate-on-scroll animate-fade-in-up stagger-3 relative">
              <span className="font-serif text-6xl font-bold text-secondary/15 leading-none">03</span>
              <h3 className="text-xl font-semibold text-primary mt-3">Complete your transfer</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs">
                Your conveyancer reviews, you sign digitally, and the transfer is registered. Done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Credentials ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="animate-on-scroll animate-fade-in-up text-center mb-12 md:mb-16">
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-secondary mb-4">
              Why Trust Us
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary heading-accent heading-accent-center">
              Built for the legal standard.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="animate-on-scroll animate-scale-in stagger-1 border border-border rounded-lg p-8 text-center hover-lift">
              <Shield className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-primary text-lg">Regulatory Compliant</h3>
              <p className="text-gray-500 text-sm mt-2">Meets all POPIA, FICA, and Law Society requirements.</p>
            </div>

            <div className="animate-on-scroll animate-scale-in stagger-2 border border-border rounded-lg p-8 text-center hover-lift">
              <Lock className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-primary text-lg">256-bit Encryption</h3>
              <p className="text-gray-500 text-sm mt-2">Your documents are protected with bank-grade security.</p>
            </div>

            <div className="animate-on-scroll animate-scale-in stagger-3 border border-border rounded-lg p-8 text-center hover-lift">
              <Award className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-primary text-lg">Law Society Approved</h3>
              <p className="text-gray-500 text-sm mt-2">Platform built in partnership with practicing conveyancers.</p>
            </div>

            <div className="animate-on-scroll animate-scale-in stagger-4 border border-border rounded-lg p-8 text-center hover-lift">
              <Scale className="h-10 w-10 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-primary text-lg">Full Audit Trail</h3>
              <p className="text-gray-500 text-sm mt-2">Every action is logged and traceable for legal accountability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="pb-12 md:pb-16">
        <div className="animate-on-scroll animate-fade-in-up bg-primary rounded-2xl py-16 md:py-20 px-8 text-center max-w-7xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="text-gray-300 text-lg mt-4">
            Sign up or log in to manage your property transactions.
          </p>
          <button
            onClick={onStart}
            className="btn-shine inline-flex items-center gap-2 bg-secondary text-primary font-semibold px-8 py-4 rounded-lg hover:bg-secondary-dark transition-colors duration-300 mt-8 text-base"
          >
            <LogIn className="h-5 w-5" />
            Sign Up / Log In
          </button>
          <p className="text-xs text-gray-400 mt-4">For conveyancers, estate agents &amp; financial institutions</p>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
