import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLiveAuction } from '../../context/LiveAuctionContext';
import { api } from '../../services/api';

interface AvailablePlayer {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  imageUrl?: string;
  verified?: boolean;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
}

interface AssignedAuction {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  teamIds: string[];
  playerPool: string[];
  bidSlabs: { maxPrice: number; increment: number }[];
  timerDuration: number;
  assignedAuctioneer: {
    id: string;
    name: string;
    assignedAt: string;
  };
  createdAt: string;
}

// Team colors for visual appeal
const TEAM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'KKR': { bg: 'from-purple-900 to-yellow-600', border: 'border-purple-500', text: 'text-yellow-400' },
  'MI': { bg: 'from-blue-900 to-blue-600', border: 'border-blue-400', text: 'text-blue-300' },
  'CSK': { bg: 'from-yellow-700 to-yellow-500', border: 'border-yellow-400', text: 'text-yellow-200' },
  'RCB': { bg: 'from-red-900 to-red-600', border: 'border-red-500', text: 'text-red-300' },
  'DC': { bg: 'from-blue-800 to-red-600', border: 'border-blue-400', text: 'text-blue-200' },
  'SRH': { bg: 'from-orange-800 to-orange-500', border: 'border-orange-400', text: 'text-orange-200' },
  'PBKS': { bg: 'from-red-700 to-red-500', border: 'border-red-400', text: 'text-red-200' },
  'RR': { bg: 'from-pink-800 to-pink-500', border: 'border-pink-400', text: 'text-pink-200' },
  'GT': { bg: 'from-cyan-800 to-cyan-500', border: 'border-cyan-400', text: 'text-cyan-200' },
  'LSG': { bg: 'from-teal-800 to-teal-500', border: 'border-teal-400', text: 'text-teal-200' },
};

const getTeamColors = (teamName: string) => {
  const abbr = teamName.toUpperCase().split(' ').map(w => w[0]).join('');
  if (TEAM_COLORS[abbr]) return TEAM_COLORS[abbr];
  for (const [key, colors] of Object.entries(TEAM_COLORS)) {
    if (teamName.toUpperCase().includes(key)) return colors;
  }
  return { bg: 'from-slate-800 to-slate-600', border: 'border-slate-500', text: 'text-slate-300' };
};

export const AuctioneerLiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    session,
    ledger,
    teams,
    currentPlayer,
    hasActiveAuction,
    isLoading,
    error,
    timeRemaining,
    isTimerRunning,
    nextValidBid,
    currentIncrement,
    startSession,
    selectPlayer,
    startBidding,
    confirmBid,
    pauseBidding,
    resumeBidding,
    markSold,
    markUnsold,
    endSession
  } = useLiveAuction();

  // Local state
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignedAuctions, setAssignedAuctions] = useState<AssignedAuction[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AssignedAuction | null>(null);

  // Fetch assigned auctions
  useEffect(() => {
    const fetchAssignedAuctions = async () => {
      if (!user?.id) return;
      
      setLoadingAuctions(true);
      try {
        const response = await api.get(`/auctions/assigned/${user.id}`);
        if (response.data?.success) {
          setAssignedAuctions(response.data.auctions || []);
        } else if (response.success) {
          setAssignedAuctions(response.auctions || []);
        }
      } catch (err) {
        console.error('Failed to fetch assigned auctions:', err);
      } finally {
        setLoadingAuctions(false);
      }
    };
    
    fetchAssignedAuctions();
  }, [user?.id]);

  // Fetch available players (only verified players in pool)
  useEffect(() => {
    const fetchPlayers = async () => {
      const sport = session?.sport || selectedAuction?.sport;
      if (!sport) return;
      
      try {
        const response = await api.get(`/players/${sport}?verified=true`);
        const players = response.data || response.players || response || [];
        setAvailablePlayers(Array.isArray(players) ? players : []);
      } catch (err) {
        console.error('Failed to fetch verified players:', err);
      }
    };
    fetchPlayers();
  }, [session?.sport, selectedAuction?.sport]);

  // Players remaining in pool
  const playersInPool = useMemo(() => {
    if (!session) return [];
    return availablePlayers.filter(p => session.playerPool.includes(p.id));
  }, [session, availablePlayers]);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1 && amount < 100) {
      return `₹${amount.toFixed(2)} Cr`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // Handle starting a pre-created auction
  const handleStartAssignedAuction = async (auction: AssignedAuction) => {
    if (auction.status !== 'READY') {
      alert(`Cannot start auction. Status is ${auction.status}. Admin must configure it first.`);
      return;
    }

    setActionLoading(true);
    const success = await startSession({
      auctionId: auction.id,
      sport: auction.sport,
      name: auction.name,
      auctioneerName: user?.name || user?.username || '',
      teamIds: auction.teamIds,
      playerPool: auction.playerPool,
      bidSlabs: auction.bidSlabs,
      timerDuration: auction.timerDuration || 20
    });

    if (success) {
      setSelectedAuction(auction);
    }
    setActionLoading(false);
  };

  // Handle selecting a player
  const handleSelectPlayer = async (player: AvailablePlayer) => {
    setActionLoading(true);
    await selectPlayer(player.id, player.name, player.basePrice);
    setActionLoading(false);
  };

  // Handle starting bidding
  const handleStartBidding = async () => {
    setActionLoading(true);
    await startBidding();
    setActionLoading(false);
  };

  // Handle team paddle raise (assign bid to team)
  const handleRaisePaddle = async (team: Team) => {
    setActionLoading(true);
    await confirmBid(team.id, team.name);
    setActionLoading(false);
  };

  // Handle pause/resume
  const handlePauseResume = async () => {
    setActionLoading(true);
    if (ledger?.state === 'LIVE') {
      await pauseBidding();
    } else {
      await resumeBidding();
    }
    setActionLoading(false);
  };

  // Handle sold - SELL button
  const handleSell = async () => {
    if (!ledger?.highestBidder) {
      alert('No bids placed yet!');
      return;
    }
    setActionLoading(true);
    await markSold();
    setActionLoading(false);
  };

  // Handle unsold
  const handleUnsold = async () => {
    setActionLoading(true);
    await markUnsold();
    setActionLoading(false);
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!confirm('End this auction session?')) return;
    setActionLoading(true);
    await endSession();
    setSelectedAuction(null);
    setActionLoading(false);
  };

  // Loading state
  if (isLoading || loadingAuctions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NO ACTIVE SESSION - Show assigned auctions from Admin
  // =====================================================
  if (!hasActiveAuction && !session) {
    const readyAuctions = assignedAuctions.filter(a => a.status === 'READY');
    const otherAuctions = assignedAuctions.filter(a => a.status !== 'READY');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-4">
              <span className="text-5xl">🎙️</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Auctioneer Console</h1>
            <p className="text-gray-400">Welcome, {user?.name || user?.username}</p>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {assignedAuctions.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
              <div className="text-7xl mb-6">📋</div>
              <h2 className="text-2xl font-bold text-white mb-4">No Auctions Assigned</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Admin has not assigned any auctions to you yet.
                Please wait for Admin to create and assign an auction.
              </p>
              <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                <strong>Your Role:</strong> Conduct live bidding when Admin assigns an auction to you
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Ready to Start */}
              {readyAuctions.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    Ready to Start
                  </h2>
                  <div className="space-y-4">
                    {readyAuctions.map(auction => (
                      <div
                        key={auction.id}
                        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white">{auction.name}</h3>
                            <p className="text-gray-400 capitalize text-lg">{auction.sport}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-300">
                              <span className="flex items-center gap-1">👥 {auction.teamIds?.length || 0} Teams</span>
                              <span className="flex items-center gap-1">🏃 {auction.playerPool?.length || 0} Players</span>
                              <span className="flex items-center gap-1">⏱️ {auction.timerDuration || 20}s Timer</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartAssignedAuction(auction)}
                            disabled={actionLoading}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 text-lg shadow-lg shadow-green-500/25"
                          >
                            {actionLoading ? 'Starting...' : '🚀 START AUCTION'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other auctions */}
              {otherAuctions.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-500 mb-3">Other Assigned Auctions</h2>
                  <div className="space-y-3">
                    {otherAuctions.map(auction => (
                      <div key={auction.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{auction.name}</h3>
                            <p className="text-gray-500 capitalize">{auction.sport}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            auction.status === 'CREATED' ? 'bg-yellow-500/20 text-yellow-300' :
                            auction.status === 'LIVE' ? 'bg-blue-500/20 text-blue-300' :
                            auction.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {auction.status === 'CREATED' ? '⏳ Pending Config' : auction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // PLAYER SELECTION - Before bidding starts
  // =====================================================
  if (!ledger) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">{session?.name}</h1>
              <p className="text-gray-400">{playersInPool.length} players remaining</p>
            </div>
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-600/30"
            >
              End Session
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Player for Auction</h2>

          {playersInPool.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-white mb-2">All Players Auctioned!</h3>
              <p className="text-gray-400 mb-6">No more players in the pool</p>
              <button
                onClick={handleEndSession}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                End Auction Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playersInPool.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  disabled={actionLoading}
                  className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-2xl text-left transition-all"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <h3 className="font-bold text-white text-center text-lg">{player.name}</h3>
                  <p className="text-gray-400 text-center text-sm">{player.role}</p>
                  <div className="mt-3 text-center">
                    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                      Base: {formatCurrency(player.basePrice)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // LIVE BIDDING INTERFACE - Teams with Paddle Buttons
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar - Current Player & Timer */}
      <div className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                {currentPlayer?.imageUrl ? (
                  <img src={currentPlayer.imageUrl} alt={ledger.playerName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{ledger.playerName}</h1>
                <p className="text-gray-400">{currentPlayer?.role} • Base: {formatCurrency(ledger.basePrice)}</p>
              </div>
            </div>

            {/* Timer */}
            <div className={`px-8 py-4 rounded-2xl ${
              ledger.state === 'PAUSED' 
                ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                : timeRemaining <= 5 && isTimerRunning 
                  ? 'bg-red-500/30 border-2 border-red-500 animate-pulse' 
                  : 'bg-white/10 border-2 border-white/20'
            }`}>
              <div className="text-5xl font-mono font-black text-white text-center">
                {ledger.state === 'PAUSED' ? 'PAUSED' : ledger.state === 'READY' ? 'READY' : `${timeRemaining}s`}
              </div>
            </div>

            {/* End Button */}
            <button
              onClick={handleEndSession}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="End Session"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Current Bid Display */}
        <div className="text-center mb-8">
          <div className="text-gray-400 text-lg mb-2">CURRENT BID</div>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
            {formatCurrency(ledger.currentBid)}
          </div>
          {ledger.highestBidder && (
            <div className="mt-4 inline-block px-6 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
              <span className="text-yellow-400 font-bold text-xl">
                👑 Leading: {ledger.highestBidder.teamName}
              </span>
            </div>
          )}
          {nextValidBid && ledger.state === 'LIVE' && (
            <div className="mt-2 text-gray-400">
              Next bid: {formatCurrency(nextValidBid)} (+{formatCurrency(currentIncrement || 0)})
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {ledger.state === 'READY' && (
            <button
              onClick={handleStartBidding}
              disabled={actionLoading}
              className="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-2xl rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-green-500/30"
            >
              🚀 START BIDDING
            </button>
          )}

          {ledger.state === 'LIVE' && (
            <>
              <button
                onClick={handlePauseResume}
                disabled={actionLoading}
                className="px-8 py-4 bg-yellow-500 text-black font-bold text-lg rounded-xl hover:bg-yellow-400 transition-all"
              >
                ⏸️ PAUSE
              </button>
              <button
                onClick={handleSell}
                disabled={actionLoading || !ledger.highestBidder}
                className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-black text-2xl rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-green-500/30"
              >
                ✅ SELL
              </button>
              <button
                onClick={handleUnsold}
                disabled={actionLoading}
                className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition-all"
              >
                ❌ UNSOLD
              </button>
            </>
          )}

          {ledger.state === 'PAUSED' && (
            <>
              <button
                onClick={handlePauseResume}
                disabled={actionLoading}
                className="px-8 py-4 bg-blue-500 text-white font-bold text-lg rounded-xl hover:bg-blue-600 transition-all"
              >
                ▶️ RESUME
              </button>
              <button
                onClick={handleSell}
                disabled={actionLoading || !ledger.highestBidder}
                className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-black text-2xl rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-green-500/30"
              >
                ✅ SELL
              </button>
              <button
                onClick={handleUnsold}
                disabled={actionLoading}
                className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition-all"
              >
                ❌ UNSOLD
              </button>
            </>
          )}
        </div>

        {/* Teams Grid - Display only, no bidding functionality */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            {ledger.state === 'LIVE' ? '🏏 Click team to assign bid when they raise paddle' : 'Participating Teams'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teams.map(team => {
              const isHighestBidder = ledger.highestBidder?.teamId === team.id;
              const teamColors = getTeamColors(team.name);
              const canAfford = team.purseRemaining >= (nextValidBid || ledger.currentBid);

              return (
                <div
                  key={team.id}
                  className={`relative rounded-2xl overflow-hidden transition-all ${
                    isHighestBidder 
                      ? 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/30 scale-105' 
                      : ''
                  }`}
                >
                  <div className={`bg-gradient-to-br ${teamColors.bg} p-5`}>
                    {isHighestBidder && (
                      <div className="absolute -top-2 -right-2 text-4xl animate-bounce">👑</div>
                    )}
                    
                    <div className="text-center mb-3">
                      <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" />
                        ) : (
                          <span className="text-3xl font-black text-white">
                            {team.name.split(' ').map(w => w[0]).join('').substring(0, 3)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">{team.name}</h3>
                    </div>

                    <div className="text-center mb-3">
                      <div className="text-xs text-white/60">Remaining Purse</div>
                      <div className={`text-lg font-bold ${canAfford ? 'text-green-300' : 'text-red-300'}`}>
                        {formatCurrency(team.purseRemaining)}
                      </div>
                    </div>

                    {/* Bid Assignment Button - Only for auctioneer to assign bids */}
                    <button
                      onClick={() => handleRaisePaddle(team)}
                      disabled={actionLoading || ledger.state !== 'LIVE' || !canAfford}
                      className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                        ledger.state !== 'LIVE' 
                          ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                          : !canAfford
                            ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-900 hover:bg-yellow-400 hover:scale-105 active:scale-95 shadow-lg'
                      }`}
                    >
                      {ledger.state !== 'LIVE' 
                        ? 'WAITING' 
                        : !canAfford 
                          ? 'LOW PURSE' 
                          : '⚡ ASSIGN BID'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bid History */}
        {ledger.bidHistory.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-3">Bid History</h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {[...ledger.bidHistory].reverse().map((bid, index) => (
                <div
                  key={bid.id}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    index === 0 
                      ? 'bg-yellow-500/30 border border-yellow-500/50' 
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="font-semibold text-white">{bid.teamName}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-green-400 font-bold">{formatCurrency(bid.bidAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctioneerLiveDashboard;
