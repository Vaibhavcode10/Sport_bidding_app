import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface AuctionInvitation {
  id: string;
  name: string;
  sport: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  invitationStatus: string;
  invitedAt: string;
  settings: {
    minBidIncrement: number;
    maxPlayersPerTeam: number;
    bidTimeLimit: number;
  };
}

export const AuctioneerInvitations: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<AuctionInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [user?.id]);

  const fetchInvitations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/auctions/auctioneer/${user.id}/invitations`);
      if (response.data.success) {
        setInvitations(response.data.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (auction: AuctionInvitation) => {
    setProcessingId(auction.id);
    try {
      const response = await api.post(`/auctions/${auction.sport}/${auction.id}/accept`, {
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role
      });

      if (response.data.success) {
        alert('Invitation accepted! You can now participate in this auction.');
        fetchInvitations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (auction: AuctionInvitation) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    
    setProcessingId(auction.id);
    try {
      const response = await api.post(`/auctions/${auction.sport}/${auction.id}/decline`, {
        userId: user?.id,
        userRole: user?.role
      });

      if (response.data.success) {
        alert('Invitation declined.');
        fetchInvitations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to decline invitation');
    } finally {
      setProcessingId(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'ACCEPTED': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'DECLINED': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading invitations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border border-orange-600/20 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-1">📨 Auction Invitations</h2>
        <p className="text-slate-400 text-sm">View and respond to auction invitations from admin</p>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-slate-400 text-lg font-semibold">No invitations yet</p>
          <p className="text-slate-500 text-sm mt-2">You'll see auction invitations here when admin invites you</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invitations.map(invitation => (
            <div
              key={invitation.id}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700 rounded-xl p-5 hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getSportEmoji(invitation.sport)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{invitation.name}</h3>
                    <p className="text-slate-400 text-sm capitalize">{invitation.sport}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(invitation.invitationStatus)}`}>
                  {invitation.invitationStatus}
                </span>
              </div>

              <p className="text-slate-400 text-sm mb-4">{invitation.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Start</p>
                  <p className="text-white font-semibold">{formatDate(invitation.startDate)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">End</p>
                  <p className="text-white font-semibold">{formatDate(invitation.endDate)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Min Bid Increment</p>
                  <p className="text-emerald-400 font-semibold">${(invitation.settings.minBidIncrement / 1000000).toFixed(1)}M</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2">
                  <p className="text-slate-500 text-xs">Auction Status</p>
                  <p className="text-blue-400 font-semibold">{invitation.status}</p>
                </div>
              </div>

              {invitation.invitationStatus === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(invitation)}
                    disabled={processingId === invitation.id}
                    className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {processingId === invitation.id ? '⏳ Processing...' : '✅ Accept Invitation'}
                  </button>
                  <button
                    onClick={() => handleDecline(invitation)}
                    disabled={processingId === invitation.id}
                    className="flex-1 py-2 bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    ❌ Decline
                  </button>
                </div>
              )}

              {invitation.invitationStatus === 'ACCEPTED' && (
                <div className="p-3 bg-green-600/10 border border-green-600/30 rounded-lg text-center">
                  <p className="text-green-300 font-semibold">🎉 You're participating in this auction!</p>
                </div>
              )}

              {invitation.invitationStatus === 'DECLINED' && (
                <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-lg text-center">
                  <p className="text-red-300 font-semibold">You declined this invitation</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctioneerInvitations;
