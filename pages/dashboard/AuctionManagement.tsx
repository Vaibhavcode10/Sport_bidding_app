import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface Auction {
  id: string;
  name: string;
  sport: string;
  description: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'CREATED' | 'READY';
  createdBy: string;
  createdAt: string;
  registeredPlayers: Array<{
    id: string;
    name: string;
    registeredAt: string;
  }>;
  assignedAuctioneer?: {
    id: string;
    name: string;
    assignedAt: string;
  };
  participatingTeams: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    purseRemaining: number;
    totalPurse: number;
  }>;
  playerPool?: string[];
  settings: {
    minBidIncrement: number;
    maxPlayersPerTeam: number;
    bidTimeLimit: number;
  };
}

interface Team {
  id: string;
  name: string;
  sport: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  logoUrl?: string;
}

interface Auctioneer {
  id: string;
  username: string;
  name: string;
  // Auctioneers are neutral - they don't have franchises
  sport?: string;
}

export const AuctionManagement: React.FC = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('football');
  const [activeTab, setActiveTab] = useState<'auctions' | 'create'>('auctions');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating/editing auction
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    startDate: '',
    endDate: '',
    minBidIncrement: 100000,
    maxPlayersPerTeam: 15,
    bidTimeLimit: 30,
    selectedTeams: [] as string[], // Team IDs
    selectedPlayers: [] as string[], // Player IDs (verified players)
    assignedAuctioneerId: '' // Auctioneer ID
  });

  // Verified players for selection
  const [verifiedPlayers, setVerifiedPlayers] = useState<Array<{
    id: string;
    name: string;
    role: string;
    basePrice: number;
    imageUrl?: string;
  }>>([]);

  const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];

  useEffect(() => {
    fetchAuctions();
    fetchAuctioneers();
    fetchTeams();
    fetchVerifiedPlayers();
  }, [selectedSport]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${selectedSport}`);
      if (response.data.success) {
        setAuctions(response.data.auctions);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get(`/teams/${selectedSport}`);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchVerifiedPlayers = async () => {
    try {
      const response = await api.get(`/players/${selectedSport}?verified=true`);
      // Filter to only available players (not already sold)
      const availablePlayers = (response.data || []).filter(
        (p: any) => p.status === 'AVAILABLE' || !p.status
      );
      setVerifiedPlayers(availablePlayers);
    } catch (error) {
      console.error('Error fetching verified players:', error);
    }
  };

  const fetchAuctioneers = async () => {
    try {
      const response = await api.get(`/auctions/auctioneers/all/${selectedSport}`, {
        params: { userRole: user?.role }
      });
      if (response.data.success) {
        setAuctioneers(response.data.auctioneers);
      }
    } catch (error) {
      console.error('Error fetching auctioneers:', error);
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate team selection (at least 2 teams)
    if (formData.selectedTeams.length < 2) {
      alert('Please select at least 2 teams for the auction.');
      return;
    }
    
    // Validate auctioneer assignment
    if (!formData.assignedAuctioneerId) {
      alert('Please assign an auctioneer to the auction.');
      return;
    }
    
    // Validate player selection (at least 1 player)
    if (formData.selectedPlayers.length === 0) {
      alert('Please select at least 1 verified player for the auction.');
      return;
    }

    try {
      const selectedTeamsData = teams.filter(team => formData.selectedTeams.includes(team.id));
      const assignedAuctioneer = auctioneers.find(a => a.id === formData.assignedAuctioneerId);
      
      const response = await api.post(`/auctions/${selectedSport}`, {
        name: formData.name,
        description: formData.description,
        logoUrl: formData.logoUrl,
        startDate: formData.startDate,
        endDate: formData.endDate,
        participatingTeams: selectedTeamsData.map(team => ({
          id: team.id,
          name: team.name,
          logoUrl: team.logoUrl,
          purseRemaining: team.purseRemaining,
          totalPurse: team.totalPurse
        })),
        playerPool: formData.selectedPlayers,
        assignedAuctioneerId: formData.assignedAuctioneerId,
        assignedAuctioneerName: assignedAuctioneer?.name,
        settings: {
          minBidIncrement: formData.minBidIncrement,
          maxPlayersPerTeam: formData.maxPlayersPerTeam,
          bidTimeLimit: formData.bidTimeLimit
        },
        userRole: user?.role,
        userId: user?.id
      });

      if (response.data.success) {
        alert('Auction created successfully!');
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          logoUrl: '',
          startDate: '',
          endDate: '',
          minBidIncrement: 100000,
          maxPlayersPerTeam: 15,
          bidTimeLimit: 30,
          selectedTeams: [],
          selectedPlayers: [],
          assignedAuctioneerId: ''
        });
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Failed to create auction');
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) return;

    try {
      const response = await api.delete(`/auctions/${selectedSport}/${auctionId}`, {
        params: { userRole: user?.role, userId: user?.id }
      });

      if (response.data.success) {
        alert('Auction deleted successfully!');
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error deleting auction:', error);
      alert('Failed to delete auction');
    }
  };

  const handleUpdateStatus = async (auctionId: string, status: string) => {
    try {
      const response = await api.put(`/auctions/${selectedSport}/${auctionId}`, {
        status,
        userRole: user?.role,
        userId: user?.id
      });

      if (response.data.success) {
        alert('Auction status updated!');
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error updating auction:', error);
      alert('Failed to update auction');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'READY': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'LIVE': return 'bg-green-500/20 text-green-300 border-green-500/50 animate-pulse';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-slate-400 text-lg font-semibold">Access Denied</p>
        <p className="text-slate-500 text-sm mt-2">Only admins can manage auctions</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Auction Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage auctions</p>
      </div>

      {/* Sport Selector */}
      <div className="flex flex-wrap gap-2">
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedSport === sport
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {getSportEmoji(sport)} {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </button>
        ))}
      </div>



      {/* Create Auction Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
      >
        ➕ Create New Auction for {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
      </button>

      {/* Auctions Tab */}
      {activeTab === 'auctions' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No auctions yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Create your first auction for {selectedSport}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {auctions.map(auction => (
                <div
                  key={auction.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-primary-500 dark:hover:border-primary-400 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {auction.logoUrl && (
                        <img 
                          src={auction.logoUrl} 
                          alt={auction.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{auction.name}</h3>
                        <p className="text-slate-400 text-sm">{auction.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                      {auction.status}
                    </span>
                  </div>

                  {/* Assigned Auctioneer & Teams & Player Pool */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Assigned Auctioneer */}
                    {auction.assignedAuctioneer && (
                      <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Assigned Auctioneer</p>
                        <p className="text-blue-300 font-semibold">{auction.assignedAuctioneer.name}</p>
                        <p className="text-slate-500 text-xs">Assigned {formatDate(auction.assignedAuctioneer.assignedAt)}</p>
                      </div>
                    )}
                    
                    {/* Participating Teams */}
                    {auction.participatingTeams && auction.participatingTeams.length > 0 && (
                      <div className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                        <p className="text-slate-400 text-xs mb-2">Participating Teams ({auction.participatingTeams.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {auction.participatingTeams.slice(0, 3).map(team => (
                            <div key={team.id} className="flex items-center space-x-1 bg-slate-700/50 px-2 py-1 rounded text-xs">
                              {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="w-4 h-4 rounded" />}
                              <span className="text-green-300">{team.name}</span>
                            </div>
                          ))}
                          {auction.participatingTeams.length > 3 && (
                            <span className="text-slate-500 text-xs">+{auction.participatingTeams.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Player Pool */}
                    {auction.playerPool && auction.playerPool.length > 0 && (
                      <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Player Pool</p>
                        <p className="text-purple-300 font-semibold text-lg">{auction.playerPool.length} Players</p>
                        <p className="text-slate-500 text-xs">Verified & ready for auction</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs">Start Date</p>
                      <p className="text-white font-semibold">{formatDate(auction.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">End Date</p>
                      <p className="text-white font-semibold">{formatDate(auction.endDate)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {auction.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleUpdateStatus(auction.id, 'LIVE')}
                        className="px-4 py-2 bg-green-600/20 text-green-300 rounded-lg text-sm font-semibold hover:bg-green-600/30 transition-all"
                      >
                        🚀 Start Auction
                      </button>
                    )}
                    {auction.status === 'LIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(auction.id, 'COMPLETED')}
                        className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-600/30 transition-all"
                      >
                        ✅ End Auction
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAuction(auction.id)}
                      className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-600/30 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Auction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Auction</h2>
            
            <form onSubmit={handleCreateAuction} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Auction Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Auction Logo URL (optional)</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                />
                {formData.logoUrl && (
                  <div className="mt-2 flex items-center space-x-2">
                    <img 
                      src={formData.logoUrl} 
                      alt="Auction logo preview" 
                      className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Preview</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Min Bid Increment</label>
                  <input
                    type="number"
                    value={formData.minBidIncrement}
                    onChange={e => setFormData({...formData, minBidIncrement: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Max Players/Team</label>
                  <input
                    type="number"
                    value={formData.maxPlayersPerTeam}
                    onChange={e => setFormData({...formData, maxPlayersPerTeam: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Bid Time (sec)</label>
                  <input
                    type="number"
                    value={formData.bidTimeLimit}
                    onChange={e => setFormData({...formData, bidTimeLimit: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">Select Teams (minimum 2 teams)</label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`team-${team.id}`}
                        checked={formData.selectedTeams.includes(team.id)}
                        onChange={e => {
                          const updatedTeams = e.target.checked 
                            ? [...formData.selectedTeams, team.id]
                            : formData.selectedTeams.filter(id => id !== team.id);
                          setFormData({...formData, selectedTeams: updatedTeams});
                        }}
                        className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                      />
                      <label htmlFor={`team-${team.id}`} className="flex items-center space-x-2 cursor-pointer">
                        {team.logoUrl && (
                          <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded" />
                        )}
                        <span className="text-gray-900 dark:text-white">{team.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected: {formData.selectedTeams.length} team(s)
                </p>
              </div>

              {/* Verified Players Selection */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Select Verified Players for Auction Pool
                  <span className="text-green-500 dark:text-green-400 ml-2">({verifiedPlayers.length} available)</span>
                </label>
                {verifiedPlayers.length === 0 ? (
                  <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg text-center">
                    <p className="text-yellow-600 dark:text-yellow-300 text-sm">⚠️ No verified players available for {selectedSport}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Verify players first in Player Verification</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, selectedPlayers: verifiedPlayers.map(p => p.id)})}
                        className="px-3 py-1 bg-green-600/20 text-green-600 dark:text-green-300 text-xs rounded hover:bg-green-600/30"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, selectedPlayers: []})}
                        className="px-3 py-1 bg-red-600/20 text-red-600 dark:text-red-300 text-xs rounded hover:bg-red-600/30"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                      {verifiedPlayers.map(player => (
                        <div key={player.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                          <input
                            type="checkbox"
                            id={`player-${player.id}`}
                            checked={formData.selectedPlayers.includes(player.id)}
                            onChange={e => {
                              const updatedPlayers = e.target.checked 
                                ? [...formData.selectedPlayers, player.id]
                                : formData.selectedPlayers.filter(id => id !== player.id);
                              setFormData({...formData, selectedPlayers: updatedPlayers});
                            }}
                            className="w-4 h-4 text-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                          />
                          <label htmlFor={`player-${player.id}`} className="flex items-center space-x-3 cursor-pointer flex-1">
                            {player.imageUrl && (
                              <img src={player.imageUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <div className="flex-1">
                              <span className="text-gray-900 dark:text-white font-medium">{player.name}</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs ml-2">({player.role})</span>
                            </div>
                            <span className="text-green-600 dark:text-green-400 text-sm font-semibold">₹{(player.basePrice / 10000000).toFixed(2)} Cr</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Selected: {formData.selectedPlayers.length} of {verifiedPlayers.length} players
                    </p>
                  </>
                )}
              </div>

              {/* Auctioneer Assignment */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">Assign Auctioneer</label>
                <select
                  value={formData.assignedAuctioneerId}
                  onChange={e => setFormData({...formData, assignedAuctioneerId: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Select an auctioneer...</option>
                  {auctioneers.map(auctioneer => (
                    <option key={auctioneer.id} value={auctioneer.id}>
                      {auctioneer.name} (@{auctioneer.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-500 hover:to-primary-600 transition-all"
                >
                  Create Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
