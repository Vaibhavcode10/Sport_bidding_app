import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../config/index.js';

interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice: number;
  verified?: boolean;
  verificationRequestedAt?: string;
  careerRecords?: any;
  username?: string;
}

export const PlayerVerification: React.FC = () => {
  const { user } = useAuth();
  const [unverifiedPlayers, setUnverifiedPlayers] = useState<Player[]>([]);
  const [eligiblePlayers, setEligiblePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'eligible'>('pending');

  const sport = user?.sport || 'football';

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchVerificationRequests();
      fetchEligiblePlayers();
    }
  }, [user, sport]);

  const fetchVerificationRequests = async () => {
    try {
      const response = await fetch(
        `${getApiBase()}/verification/verification-requests/${sport}?userRole=${user?.role}`,
        { method: 'GET' }
      );
      const data = await response.json();
      if (data.success) {
        setUnverifiedPlayers(data.requests);
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    }
  };

  const fetchEligiblePlayers = async () => {
    try {
      const response = await fetch(
        `${getApiBase()}/verification/eligible-players/${sport}?userRole=${user?.role}`,
        { method: 'GET' }
      );
      const data = await response.json();
      if (data.success) {
        setEligiblePlayers(data.players);
      }
    } catch (error) {
      console.error('Error fetching eligible players:', error);
    }
  };

  const handleVerifyPlayer = async (playerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/verification/verify-player/${sport}/${playerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            userRole: user?.role
          })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Refresh both lists
        fetchVerificationRequests();
        fetchEligiblePlayers();
        alert(`Player verified successfully!`);
      } else {
        alert(`Failed to verify player: ${data.error}`);
      }
    } catch (error) {
      console.error('Error verifying player:', error);
      alert('Error verifying player');
    }
    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-slate-400 text-lg font-semibold">Access Denied</p>
        <p className="text-slate-500 text-sm mt-2">Only admins can manage player verification</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-black text-white mb-2">Player Verification</h1>
        <p className="text-slate-400">Manage player verification requests and eligible players for auctions</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-300 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700/50'
          }`}
        >
          🕐 Pending Verification ({unverifiedPlayers.length})
        </button>
        <button
          onClick={() => setActiveTab('eligible')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'eligible'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700/50'
          }`}
        >
          ✅ Eligible for Auction ({eligiblePlayers.length})
        </button>
      </div>

      {/* Pending Verification Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Unverified Players</h2>
            <div className="text-sm text-slate-400">
              {unverifiedPlayers.length} players awaiting verification
            </div>
          </div>

          {unverifiedPlayers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-slate-400 text-lg font-semibold">All players verified!</p>
              <p className="text-slate-500 text-sm mt-2">No pending verification requests for {sport}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unverifiedPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-800 hover:to-slate-800 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl p-6 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 backdrop-blur-xl"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white mb-1">{player.name}</h3>
                      <p className="text-sm text-slate-400 mb-2">
                        <span className="px-3 py-1 bg-orange-600/20 text-orange-300 rounded-full text-xs font-semibold">
                          {player.role}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        <span className="text-purple-400 font-semibold">Username:</span> {player.username}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm font-bold">
                      ⚠️
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Base Price</span>
                      <span className="text-lg font-black text-emerald-400">${(player.basePrice / 1000000).toFixed(1)}M</span>
                    </div>
                    {player.verificationRequestedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Requested</span>
                        <span className="text-xs text-slate-300">{new Date(player.verificationRequestedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Career Records */}
                  {player.careerRecords && (
                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                      <h4 className="text-sm font-bold text-cyan-400 mb-2">📊 Career Statistics</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {Object.entries(player.careerRecords).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-white font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    onClick={() => handleVerifyPlayer(player.id)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '🔄 Verifying...' : '✅ Verify Player'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Eligible Players Tab */}
      {activeTab === 'eligible' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Eligible for Auction</h2>
            <div className="text-sm text-slate-400">
              {eligiblePlayers.length} players ready for bidding
            </div>
          </div>

          {eligiblePlayers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-400 text-lg font-semibold">No verified players yet</p>
              <p className="text-slate-500 text-sm mt-2">Verify players to make them eligible for auctions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligiblePlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-800 hover:to-slate-800 border border-green-500/30 hover:border-green-500/50 rounded-2xl p-6 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-xl"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white mb-1">{player.name}</h3>
                      <p className="text-sm text-slate-400 mb-2">
                        <span className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-xs font-semibold">
                          {player.role}
                        </span>
                      </p>
                      <p className="text-xs text-green-400 font-semibold">✅ VERIFIED</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Base Price</span>
                      <span className="text-lg font-black text-emerald-400">${(player.basePrice / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg text-center">
                    <span className="text-green-300 text-xs font-semibold">🎯 READY FOR AUCTION</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerVerification;