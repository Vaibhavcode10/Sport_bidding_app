import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface Auction {
  id: string;
  name: string;
  sport: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  registeredPlayers: Array<{
    id: string;
    name: string;
    registeredAt: string;
  }>;
  acceptedAuctioneers: Array<{
    id: string;
    name: string;
  }>;
  settings: {
    minBidIncrement: number;
    maxPlayersPerTeam: number;
    bidTimeLimit: number;
  };
}

export const PlayerAuctions: React.FC = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    fetchAuctions();
  }, [user?.sport]);

  const fetchAuctions = async () => {
    if (!user?.sport) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${user.sport}`);
      if (response.data.success) {
        // Only show scheduled and live auctions
        setAuctions(response.data.auctions.filter(
          (a: Auction) => a.status === 'SCHEDULED' || a.status === 'LIVE'
        ));
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (auction: Auction) => {
    setRegisteringId(auction.id);
    try {
      const response = await api.post(`/auctions/${auction.sport}/${auction.id}/register-player`, {
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role
      });

      if (response.data.success) {
        alert('Successfully registered for the auction!');
        fetchAuctions();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to register');
    } finally {
      setRegisteringId(null);
    }
  };

  const isRegistered = (auction: Auction) => {
    return auction.registeredPlayers.some(p => p.id === user?.id);
  };

  const getSportEmoji = (sport: string) => {
    const emojis: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏',
      basketball: '🏀',
      baseball: '⚾',
      volleyball: '🏐'
    };
    return emojis[sport] || '🏆';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'LIVE': return 'bg-green-500/20 text-green-300 border-green-500/50 animate-pulse';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-1">🏆 Available Auctions</h2>
        <p className="text-slate-400 text-sm">View and register for upcoming auctions in {user?.sport}</p>
      </div>

      {auctions.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-slate-400 text-lg font-semibold">No upcoming auctions</p>
          <p className="text-slate-500 text-sm mt-2">Check back later for new auction announcements</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {auctions.map(auction => (
            <div
              key={auction.id}
              className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 border rounded-xl p-5 transition-all ${
                isRegistered(auction) ? 'border-green-500/50' : 'border-slate-700 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getSportEmoji(auction.sport)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{auction.name}</h3>
                    <p className="text-slate-400 text-sm capitalize">{auction.sport}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </span>
              </div>

              <p className="text-slate-400 text-sm mb-4">{auction.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Start</p>
                  <p className="text-white font-semibold">{formatDate(auction.startDate)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">End</p>
                  <p className="text-white font-semibold">{formatDate(auction.endDate)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Teams Participating</p>
                  <p className="text-orange-400 font-semibold">{auction.acceptedAuctioneers.length}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Players Registered</p>
                  <p className="text-blue-400 font-semibold">{auction.registeredPlayers.length}</p>
                </div>
              </div>

              {isRegistered(auction) ? (
                <div className="p-3 bg-green-600/10 border border-green-600/30 rounded-lg text-center">
                  <p className="text-green-300 font-semibold">✅ You're registered for this auction!</p>
                </div>
              ) : (
                <button
                  onClick={() => handleRegister(auction)}
                  disabled={registeringId === auction.id}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {registeringId === auction.id ? '⏳ Registering...' : '🎯 Register for Auction'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerAuctions;
