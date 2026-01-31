import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PlayerSelectSport: React.FC = () => {
  const navigate = useNavigate();
  const { setSport } = useAuth();

  const sports = [
    { id: 'football', name: 'Football', icon: '🏈', color: 'from-orange-600 to-orange-500' },
    { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'from-orange-600 to-yellow-500' },
    { id: 'cricket', name: 'Cricket', icon: '🏏', color: 'from-green-600 to-green-500' },
    { id: 'baseball', name: 'Baseball', icon: '⚾', color: 'from-red-600 to-red-500' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐', color: 'from-yellow-600 to-yellow-500' },
  ];

  const handleSportSelect = (sport: string) => {
    setSport(sport);
    navigate('/player/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 text-gray-900 dark:text-slate-100 p-8">
      {/* Background Blobs */}
      <div className="fixed inset-0 opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Select Your Sport
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-lg">Choose the sport you want to participate in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSportSelect(sport.id)}
              className={`group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-105 active:scale-95`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${sport.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
              
              <div className="relative text-center">
                <div className="text-6xl mb-4">{sport.icon}</div>
                <h3 className="text-2xl font-bold text-white">{sport.name}</h3>
              </div>
              
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-2xl transition-all"></div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectSport;
