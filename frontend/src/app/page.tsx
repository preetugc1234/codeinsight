'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Handle auth token in URL hash (after Supabase redirect)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');

    if (accessToken) {
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      // Redirect to dashboard (user will be set by auth listener)
      router.push('/dashboard');
    } else if (user) {
      // If user is already logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Code Insight
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              AI-Powered Code Review{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                That Actually Works
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get instant, intelligent code reviews powered by Claude Sonnet 4.5.
              Find bugs, improve performance, and ship better code faster.
            </p>
            <div className="flex gap-4 justify-center mb-12">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </button>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition font-semibold text-lg"
              >
                View Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              No credit card required • Free tier available • 2 minutes setup
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for better code
            </h2>
            <p className="text-xl text-gray-600">
              Powered by Claude Sonnet 4.5 for unmatched accuracy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-xl transition bg-gradient-to-br from-blue-50 to-white">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Code Review</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant AI-powered code reviews with actionable feedback.
                Detect bugs, security issues, and performance bottlenecks before they reach production.
              </p>
            </div>

            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-xl transition bg-gradient-to-br from-purple-50 to-white">
              <div className="text-4xl mb-4">🐛</div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Debug Doctor</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically detect and fix bugs with intelligent suggestions.
                Get root cause analysis and production-ready patches in seconds.
              </p>
            </div>

            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-xl transition bg-gradient-to-br from-pink-50 to-white">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Architecture</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate scalable architecture designs for your projects.
                Get best practices for microservices, databases, and infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 border border-gray-200 rounded-xl bg-white">
              <h3 className="text-xl font-bold mb-2">Lite</h3>
              <p className="text-3xl font-bold mb-4">$15<span className="text-lg text-gray-500">/mo</span></p>
              <ul className="space-y-3 mb-6 text-gray-600">
                <li>✓ 200K tokens/month</li>
                <li>✓ Code review</li>
                <li>✓ Basic debugging</li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Get Started
              </button>
            </div>

            <div className="p-8 border-2 border-blue-600 rounded-xl bg-white shadow-xl scale-105">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">$30<span className="text-lg text-gray-500">/mo</span></p>
              <ul className="space-y-3 mb-6 text-gray-600">
                <li>✓ 500K tokens/month</li>
                <li>✓ Advanced code review</li>
                <li>✓ Debug Doctor</li>
                <li>✓ Architecture advice</li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Get Started
              </button>
            </div>

            <div className="p-8 border border-gray-200 rounded-xl bg-white">
              <h3 className="text-xl font-bold mb-2">Business</h3>
              <p className="text-3xl font-bold mb-4">$200<span className="text-lg text-gray-500">/mo</span></p>
              <ul className="space-y-3 mb-6 text-gray-600">
                <li>✓ 4M tokens/month</li>
                <li>✓ Everything in Pro</li>
                <li>✓ Priority support</li>
                <li>✓ Custom integration</li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to ship better code?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers using Code Insight to write better code faster.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
          >
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">
              © 2025 Code Insight. Powered by Claude Sonnet 4.5.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
