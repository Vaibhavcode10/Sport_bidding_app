import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface AssignedAuction {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  teamIds?: string[];
  playerPool?: string[];
  assignedAuctioneer?: {
    id: string;
    name: string;
    assignedAt: string;
  };
}

interface AuctionStats {
  totalAssigned: number;
  readyToStart: number;
  completed: number;
  live: number;
}

const AuctioneerOverview: React.FC = () => {
  const { user } = useAuth();
  const [assignedAuctions, setAssignedAuctions] = useState<AssignedAuction[]>([]);
  const [stats, setStats] = useState<AuctionStats>({ totalAssigned: 0, readyToStart: 0, completed: 0, live: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedAuctions = async () => {
      if (!user?.id) return;
      
      try {
        const response = await api.get(`/auctions/assigned/${user.id}`);
        if (response.data.success) {
          const auctions = response.data.auctions;
          setAssignedAuctions(auctions);
          
          // Calculate stats
          setStats({
            totalAssigned: auctions.length,
            readyToStart: auctions.filter((a: AssignedAuction) => a.status === 'READY').length,
            completed: auctions.filter((a: AssignedAuction) => a.status === 'COMPLETED').length,
            live: auctions.filter((a: AssignedAuction) => a.status === 'LIVE').length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch assigned auctions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignedAuctions();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'READY': 'bg-green-500/20 text-green-300 border-green-500/50',
      'LIVE': 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse',
      'CREATED': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      'COMPLETED': 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">🎙️</div>
          <div>
            <h1 className="text-3xl font-black text-white">Welcome, {user?.username}!</h1>
            <p className="text-slate-400 text-lg">Neutral Auctioneer • {user?.sport?.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-blue-300 font-semibold mb-2">ℹ️ Your Role</h3>
          <p className="text-gray-400 text-sm">
            As a <strong className="text-white">neutral auctioneer</strong>, you conduct live auctions fairly and impartially. 
            You don't own or represent any team - your job is to facilitate the bidding process, 
            confirm bids, and mark players as SOLD or UNSOLD.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-600/20 rounded-xl p-6">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-slate-400 text-sm">Assigned Auctions</p>
          <p className="text-3xl font-bold text-blue-400">{stats.totalAssigned}</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-600/10 to-green-600/5 border border-green-600/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🟢</div>
          <p className="text-slate-400 text-sm">Ready to Start</p>
          <p className="text-3xl font-bold text-green-400">{stats.readyToStart}</p>
        </div>
        
        <div className="bg-gradient-to-r from-red-600/10 to-red-600/5 border border-red-600/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🔴</div>
          <p className="text-slate-400 text-sm">Currently Live</p>
          <p className="text-3xl font-bold text-red-400">{stats.live}</p>
        </div>
        
        <div className="bg-gradient-to-r from-gray-600/10 to-gray-600/5 border border-gray-600/20 rounded-xl p-6">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-slate-400 text-sm">Completed</p>
          <p className="text-3xl font-bold text-gray-400">{stats.completed}</p>
        </div>
      </div>

      {/* Quick Actions */}
      {stats.readyToStart > 0 && (
        <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">🚀 Ready to Start</h3>
              <p className="text-gray-400">You have {stats.readyToStart} auction(s) ready to begin!</p>
            </div>
            <Link
              to="/auctioneer/live"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Go to Live Auction →
            </Link>
          </div>
        </div>
      )}

      {/* Assigned Auctions List */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-6">Your Assigned Auctions</h2>
        
        {assignedAuctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400 text-lg">No auctions assigned yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Admin will create auctions and assign them to you
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedAuctions.map(auction => (
              <div
                key={auction.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{auction.name}</h3>
                    <p className="text-gray-400 capitalize">{auction.sport}</p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(auction.startDate).toLocaleDateString()}</span>
                      <span>👥 {auction.teamIds?.length || 0} Teams</span>
                      <span>🏃 {auction.playerPool?.length || 0} Players</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(auction.status)}`}>
                      {auction.status}
                    </span>
                    {auction.status === 'READY' && (
                      <Link
                        to="/auctioneer/live"
                        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all"
                      >
                        Start →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-4">How Live Auctions Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">1️⃣</div>
            <h3 className="text-white font-semibold mb-2">Admin Creates Auction</h3>
            <p className="text-gray-400 text-sm">Admin selects players, teams, and bidding rules, then assigns you as auctioneer</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">2️⃣</div>
            <h3 className="text-white font-semibold mb-2">You Start the Auction</h3>
            <p className="text-gray-400 text-sm">When ready, start the live auction and select players one by one</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">3️⃣</div>
            <h3 className="text-white font-semibold mb-2">Conduct Fair Bidding</h3>
            <p className="text-gray-400 text-sm">Confirm bids from teams, manage jump bids, and mark players SOLD or UNSOLD</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerOverview;
