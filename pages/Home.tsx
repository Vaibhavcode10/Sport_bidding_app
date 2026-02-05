import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-all duration-500">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-60 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header with theme toggle */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <div className="glass-card p-2">
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Company/System Badge */}
          <div className="inline-block px-8 py-3 mb-8 text-sm font-medium tracking-wider text-primary-600 dark:text-primary-400 uppercase glass-card hover-lift glow">
            Sports Auction Management Platform
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight animate-scale-in">
            Professional Sports
            <span className="block bg-gradient-to-r from-primary-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent gradient-animate">
              Auction System
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-300 text-xl mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in">
            Experience the future of sports auctions with our cutting-edge platform featuring 
            real-time bidding, advanced analytics, and seamless team management.
          </p>
          
          {/* CTA Section */}
          <div className="flex flex-col items-center gap-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <button 
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-4 px-12 py-5 btn-modern text-white font-semibold rounded-2xl text-lg transition-all duration-300 focus-modern hover-lift shadow-2xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Access Dashboard
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
            </button>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300 glass-card px-6 py-3">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-sm font-medium uppercase tracking-wider">System Online & Ready</span>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
            <div className="glass-card p-8 hover-lift group animate-fade-in">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Team Management</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">AI-powered tools for optimizing team composition, budget allocation, and strategic planning.</p>
            </div>

            <div className="glass-card p-8 hover-lift group animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Live Auction Engine</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Real-time bidding system with instant notifications and advanced analytics dashboard.</p>
            </div>

            <div className="glass-card p-8 hover-lift group animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Deep insights with predictive modeling, performance metrics, and market trend analysis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;