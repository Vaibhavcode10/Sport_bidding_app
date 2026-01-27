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
  createdBy: string;
  createdAt: string;
  invitedAuctioneers: Array<{
    id: string;
    name: string;
    invitedAt: string;
    status: string;
  }>;
  acceptedAuctioneers: Array<{
    id: string;
    name: string;
    acceptedAt: string;
  }>;
  registeredPlayers: Array<{
    id: string;
    name: string;
    registeredAt: string;
  }>;
  settings: {
    minBidIncrement: number;
    maxPlayersPerTeam: number;
    bidTimeLimit: number;
  };
}

interface Auctioneer {
  id: string;
  username: string;
  name: string;
  franchiseName: string;
  franchiseId: string | null;
}

export const AuctionManagement: React.FC = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('football');
  const [activeTab, setActiveTab] = useState<'auctions' | 'create' | 'auctioneers'>('auctions');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invitingAuctioneer, setInvitingAuctioneer] = useState<string | null>(null);

  // Form state for creating/editing auction
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    minBidIncrement: 100000,
    maxPlayersPerTeam: 15,
    bidTimeLimit: 30
  });

  const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];

  useEffect(() => {
    fetchAuctions();
    fetchAuctioneers();
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
    try {
      const response = await api.post(`/auctions/${selectedSport}`, {
        ...formData,
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
          startDate: '',
          endDate: '',
          minBidIncrement: 100000,
          maxPlayersPerTeam: 15,
          bidTimeLimit: 30
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

  const handleInviteAuctioneer = async (auctionId: string, auctioneer: Auctioneer) => {
    setInvitingAuctioneer(auctioneer.id);
    try {
      const response = await api.post(`/auctions/${selectedSport}/${auctionId}/invite`, {
        auctioneerId: auctioneer.id,
        auctioneerName: auctioneer.name || auctioneer.username,
        userRole: user?.role,
        userId: user?.id
      });

      if (response.data.success) {
        alert(`Invitation sent to ${auctioneer.name || auctioneer.username}!`);
        fetchAuctions();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInvitingAuctioneer(null);
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

  const isAuctioneerInvited = (auction: Auction, auctioneerId: string) => {
    return auction.invitedAuctioneers.some(inv => inv.id === auctioneerId);
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
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-black text-white mb-2">🏆 Auction Management</h1>
        <p className="text-slate-400">Create, manage auctions and invite auctioneers</p>
      </div>

      {/* Sport Selector */}
      <div className="flex flex-wrap gap-2">
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedSport === sport
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {getSportEmoji(sport)} {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'auctions'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          📋 Auctions ({auctions.length})
        </button>
        <button
          onClick={() => setActiveTab('auctioneers')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            activeTab === 'auctioneers'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          👔 Auctioneers ({auctioneers.length})
        </button>
      </div>

      {/* Create Auction Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105"
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
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-400 text-lg font-semibold">No auctions yet</p>
              <p className="text-slate-500 text-sm mt-2">Create your first auction for {selectedSport}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {auctions.map(auction => (
                <div
                  key={auction.id}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{auction.name}</h3>
                      <p className="text-slate-400 text-sm">{auction.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                      {auction.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs">Start Date</p>
                      <p className="text-white font-semibold">{formatDate(auction.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">End Date</p>
                      <p className="text-white font-semibold">{formatDate(auction.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Invited Auctioneers</p>
                      <p className="text-orange-400 font-semibold">{auction.invitedAuctioneers.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Accepted</p>
                      <p className="text-green-400 font-semibold">{auction.acceptedAuctioneers.length}</p>
                    </div>
                  </div>

                  {/* Invited Auctioneers List */}
                  {auction.invitedAuctioneers.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                      <p className="text-sm text-slate-400 mb-2">Invited Auctioneers:</p>
                      <div className="flex flex-wrap gap-2">
                        {auction.invitedAuctioneers.map(inv => (
                          <span
                            key={inv.id}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              inv.status === 'ACCEPTED' ? 'bg-green-600/30 text-green-300' :
                              inv.status === 'DECLINED' ? 'bg-red-600/30 text-red-300' :
                              'bg-orange-600/30 text-orange-300'
                            }`}
                          >
                            {inv.name} ({inv.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAuction(auction)}
                      className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-all"
                    >
                      👔 Invite Auctioneers
                    </button>
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

      {/* Auctioneers Tab */}
      {activeTab === 'auctioneers' && (
        <div className="space-y-6">
          {auctioneers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
              <div className="text-6xl mb-4">👔</div>
              <p className="text-slate-400 text-lg font-semibold">No auctioneers found</p>
              <p className="text-slate-500 text-sm mt-2">No auctioneers registered for {selectedSport}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auctioneers.map(auctioneer => (
                <div
                  key={auctioneer.id}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700 rounded-xl p-4 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                      {(auctioneer.name || auctioneer.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{auctioneer.name || auctioneer.username}</h4>
                      <p className="text-slate-400 text-sm">{auctioneer.franchiseName}</p>
                    </div>
                  </div>
                  
                  {selectedAuction && (
                    <button
                      onClick={() => handleInviteAuctioneer(selectedAuction.id, auctioneer)}
                      disabled={invitingAuctioneer === auctioneer.id || isAuctioneerInvited(selectedAuction, auctioneer.id)}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                        isAuctioneerInvited(selectedAuction, auctioneer.id)
                          ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                          : 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/30'
                      }`}
                    >
                      {invitingAuctioneer === auctioneer.id
                        ? '⏳ Sending...'
                        : isAuctioneerInvited(selectedAuction, auctioneer.id)
                          ? '✅ Already Invited'
                          : '📨 Invite to Auction'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedAuction && (
            <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
              <p className="text-blue-300 font-semibold">
                📋 Inviting to: {selectedAuction.name}
              </p>
              <button
                onClick={() => setSelectedAuction(null)}
                className="text-sm text-blue-400 hover:underline mt-1"
              >
                Cancel selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Auction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Auction</h2>
            
            <form onSubmit={handleCreateAuction} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Auction Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Min Bid Increment</label>
                  <input
                    type="number"
                    value={formData.minBidIncrement}
                    onChange={e => setFormData({...formData, minBidIncrement: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Max Players/Team</label>
                  <input
                    type="number"
                    value={formData.maxPlayersPerTeam}
                    onChange={e => setFormData({...formData, maxPlayersPerTeam: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Bid Time (sec)</label>
                  <input
                    type="number"
                    value={formData.bidTimeLimit}
                    onChange={e => setFormData({...formData, bidTimeLimit: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all"
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
