import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBiddingRequest } from '../../context/BiddingRequestContext';
import { PlayerProfile as PlayerProfileType, BiddingRequestStatus } from '../../types';

const PlayerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { addRequest, getPlayerRequest } = useBiddingRequest();
  const [isEditing, setIsEditing] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [profile, setProfile] = useState<PlayerProfileType>({
    id: '1',
    userId: user?.id || '',
    name: 'John Doe',
    sport: user?.sport || '',
    role: 'Batsman',
    jersey: 7,
    height: '6.0 ft',
    weight: '75 kg',
    age: 26,
    basePrice: 500000,
    bio: 'Professional cricket player with 5 years of experience',
    imageUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const playerRequest = getPlayerRequest(profile.id);
  const hasActiveRequest = playerRequest && playerRequest.status !== BiddingRequestStatus.REJECTED;

  const [formData, setFormData] = useState(profile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['jersey', 'age', 'basePrice'].includes(name) ? parseInt(value) : value,
    });
  };

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleRequestBid = () => {
    addRequest({
      playerId: profile.id,
      playerName: profile.name,
      sport: profile.sport,
      role: profile.role,
      basePrice: profile.basePrice,
      status: BiddingRequestStatus.PENDING,
    });
    setRequestSubmitted(true);
  };

  const roles = ['Batsman', 'Bowler', 'Fielder', 'Keeper', 'All-rounder'];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-6">
            <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-6xl font-bold">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">{profile.name}</h1>
              <p className="text-slate-400 text-lg mb-4">{profile.role} • {profile.sport.toUpperCase()}</p>
              <div className="space-y-1">
                <p className="text-sm text-slate-300"><span className="text-slate-500">Age:</span> {profile.age} years</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Height:</span> {profile.height}</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Weight:</span> {profile.weight}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (isEditing) handleCancel();
              else setIsEditing(true);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isEditing
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isEditing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-bold text-white">Edit Your Profile</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Jersey Number</label>
                  <input
                    type="number"
                    name="jersey"
                    value={formData.jersey}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Height</label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="e.g., 6.0 ft"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 75 kg"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Base Price</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  ✓ Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-6">About</h3>
                <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
                  <p className="text-slate-400 text-sm mb-2">Jersey Number</p>
                  <p className="text-3xl font-bold text-blue-400">{profile.jersey}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
                  <p className="text-slate-400 text-sm mb-2">Base Price</p>
                  <p className="text-3xl font-bold text-purple-400">₹{profile.basePrice.toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-6">
          {/* Bidding Request Status */}
          {playerRequest && (
            <div className={`rounded-2xl p-6 backdrop-blur-xl border ${
              playerRequest.status === BiddingRequestStatus.PENDING
                ? 'bg-yellow-600/10 border-yellow-600/20'
                : playerRequest.status === BiddingRequestStatus.APPROVED
                ? 'bg-green-600/10 border-green-600/20'
                : playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION
                ? 'bg-blue-600/10 border-blue-600/20'
                : 'bg-red-600/10 border-red-600/20'
            }`}>
              <h3 className="text-lg font-bold text-white mb-4">Bidding Request Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className={`font-semibold text-lg ${
                    playerRequest.status === BiddingRequestStatus.PENDING
                      ? 'text-yellow-400'
                      : playerRequest.status === BiddingRequestStatus.APPROVED
                      ? 'text-green-400'
                      : playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {playerRequest.status === BiddingRequestStatus.PENDING && '⏳ Pending Review'}
                    {playerRequest.status === BiddingRequestStatus.APPROVED && '✓ Approved by Admin'}
                    {playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION && '🎯 Added to Auction'}
                    {playerRequest.status === BiddingRequestStatus.REJECTED && '✗ Rejected'}
                  </p>
                </div>
                {playerRequest.approvedAt && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Approved on</p>
                    <p className="text-white font-semibold">{new Date(playerRequest.approvedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {playerRequest.rejectionReason && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Rejection Reason</p>
                    <p className="text-red-300 font-semibold">{playerRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasActiveRequest && !requestSubmitted && (
            <button
              onClick={handleRequestBid}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-600/20 active:scale-[0.98]"
            >
              🚀 Request to Join Auction
            </button>
          )}

          {requestSubmitted && !playerRequest && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-green-300 font-semibold">✓ Your request has been sent to the admin!</p>
              <p className="text-slate-400 text-sm mt-2">You'll be notified once the admin reviews your profile.</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Profile Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Sport</p>
                <p className="text-white font-semibold">{profile.sport.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Role</p>
                <p className="text-white font-semibold">{profile.role}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Experience</p>
                <p className="text-white font-semibold">Professional</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Account Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Member Since</p>
                <p className="text-white font-semibold">2024</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Status</p>
                <p className="text-green-400 font-semibold">✓ Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
