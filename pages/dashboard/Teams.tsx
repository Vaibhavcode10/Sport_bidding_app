
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Team {
  id: string;
  name: string;
  sport: string;
  owner: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  playerCount: number;
  wins: number;
  losses: number;
  city?: string;
  stadium?: string;
  capacity?: number;
  founded?: string;
  auctioneerId?: string;
  auctioneerName?: string;
  description?: string;
  createdAt?: string;
}

const Teams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    totalPurse: 10000000,
  });

  // Use user's selected sport
  const sport = user?.sport || 'football';

  useEffect(() => {
    console.log('Teams dashboard: sport changed to', user?.sport);
    fetchTeams();
    const interval = setInterval(fetchTeams, 3000);
    return () => clearInterval(interval);
  }, [user?.sport, sport]);

  const fetchTeams = async () => {
    const data = await api.getEntity<Team>('teams', sport);
    setTeams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateEntity('teams', editingId, { ...formData, purseRemaining: formData.totalPurse }, sport);
    } else {
      await api.createEntity('teams', { ...formData, purseRemaining: formData.totalPurse }, sport);
    }
    setFormData({ name: '', owner: '', totalPurse: 10000000 });
    setEditingId(null);
    setShowForm(false);
    fetchTeams();
  };

  const handleEdit = (team: Team) => {
    setFormData({ name: team.name, owner: team.owner, totalPurse: team.totalPurse });
    setEditingId(team.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this team?')) {
      await api.deleteEntity('teams', id, sport);
      fetchTeams();
    }
  };

  const getSportColor = (s: string) => {
    const colors: { [key: string]: string } = {
      football: 'from-blue-500 to-cyan-500',
      cricket: 'from-orange-500 to-red-500',
      volleyball: 'from-yellow-500 to-amber-500',
      baseball: 'from-red-500 to-pink-500',
      basketball: 'from-purple-500 to-indigo-500',
    };
    return colors[s] || 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {sport.charAt(0).toUpperCase() + sport.slice(1)} Teams
          </h2>
          <p className="text-slate-400 text-sm">Create and manage teams bidding for players</p>
        </div>
      </div>

      {/* Add Team Button - Only for admins and auctioneers */}
      {(user?.role === 'admin' || user?.role === 'auctioneer') && (
        <div className="flex justify-between items-center">
          <p className="text-slate-400 font-semibold">{teams.length} Teams Registered</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
              showForm
                ? 'bg-slate-700 text-slate-300'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-amber-500/50'
            }`}
          >
            {showForm ? '✕ Cancel' : '+ Create Team'}
          </button>
        </div>
      )}

      {/* Create Team Form - Only for admins and auctioneers */}
      {(user?.role === 'admin' || user?.role === 'auctioneer') && showForm && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-2xl p-8 animate-in fade-in slide-in-from-top">
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            {editingId ? '✏️ Edit Team' : '🏆 Create New Team'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
              <input
                type="text"
                placeholder="Owner Name"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
              <input
                type="number"
                placeholder="Total Purse"
                value={formData.totalPurse}
                onChange={(e) => setFormData({ ...formData, totalPurse: Number(e.target.value) })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-amber-500/50 transition-all transform hover:scale-105"
            >
              ✓ {editingId ? 'Update' : 'Create'} Team
            </button>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => {
            const spentBudget = team.totalPurse - team.purseRemaining;
            const spentPercentage = (spentBudget / team.totalPurse) * 100;

            return (
              <div
                key={team.id}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-800 hover:to-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-orange-400 group-hover:bg-clip-text transition-all mb-2">
                      {team.name}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">
                        <span className="text-amber-400 font-semibold">Owner:</span> {team.owner}
                      </p>
                      {user?.role === 'admin' && team.city && (
                        <p className="text-xs text-slate-500">
                          <span className="text-purple-400 font-semibold">City:</span> {team.city}
                        </p>
                      )}
                      {user?.role === 'admin' && team.auctioneerName && (
                        <p className="text-xs text-slate-500">
                          <span className="text-blue-400 font-semibold">Auctioneer:</span> {team.auctioneerName}
                        </p>
                      )}
                      {user?.role === 'admin' && team.founded && (
                        <p className="text-xs text-slate-500">
                          <span className="text-green-400 font-semibold">Founded:</span> {team.founded}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getSportColor(sport)} flex items-center justify-center text-xl font-bold transform group-hover:scale-110 transition-transform`}>
                    🏆
                  </div>
                </div>

                {/* Stadium Info (Admin Only) */}
                {user?.role === 'admin' && (team.stadium || team.capacity || team.description) && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                    <h4 className="text-sm font-bold text-cyan-400 mb-2">🏟️ Facility Details</h4>
                    {team.stadium && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Stadium:</span>
                        <span className="text-white text-xs font-semibold">{team.stadium}</span>
                      </div>
                    )}
                    {team.capacity && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Capacity:</span>
                        <span className="text-white text-xs font-semibold">{team.capacity.toLocaleString()}</span>
                      </div>
                    )}
                    {team.description && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 leading-relaxed">{team.description}</p>
                      </div>
                    )}
                    {team.createdAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Established:</span>
                        <span className="text-white text-xs font-semibold">{team.createdAt}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Budget Info */}
                <div className="space-y-3 mb-4 pb-4 border-b border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Purse</span>
                    <span className="text-xl font-black text-emerald-400">${(team.totalPurse / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Spent</span>
                    <span className="text-lg font-bold text-red-400">${(spentBudget / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Remaining</span>
                    <span className="text-lg font-bold text-amber-400">${(team.purseRemaining / 1000000).toFixed(1)}M</span>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-slate-600">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all"
                      style={{ width: `${spentPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
                  <div className="bg-blue-600/20 rounded-lg p-3 text-center border border-blue-500/30">
                    <p className="text-2xl font-black text-blue-400">{team.playerCount}</p>
                    <p className="text-xs text-slate-400 mt-1">Squad Size</p>
                  </div>
                  <div className="bg-purple-600/20 rounded-lg p-3 text-center border border-purple-500/30">
                    <p className="text-2xl font-black text-purple-400">{team.wins}W</p>
                    <p className="text-xs text-slate-400 mt-1">Record</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* Edit button - Only for auctioneers */}
                  {user?.role === 'auctioneer' && (
                    <button
                      onClick={() => handleEdit(team)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg text-xs font-bold transition-all transform hover:scale-105"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  
                  {/* Delete button - Only for admins */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(team.id)}
                      className={`px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-xs font-bold transition-all transform hover:scale-105 ${
                        user?.role === 'admin' ? 'flex-1' : 'flex-1'
                      }`}
                    >
                      🗑️ Delete
                    </button>
                  )}
                  
                  {/* View button for other roles or when no actions available */}
                  {(user?.role !== 'admin' && user?.role !== 'auctioneer') && (
                    <button
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-500 text-slate-300 rounded-lg text-xs font-bold cursor-not-allowed"
                      disabled
                    >
                      👁️ View Only
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
          <div className="text-6xl mb-4">🏟️</div>
          <p className="text-slate-400 text-lg font-semibold">No teams found</p>
          <p className="text-slate-500 text-sm mt-2">Create teams to start the auction for {sport}</p>
        </div>
      )}

      <style>{`
        @keyframes in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Teams;
