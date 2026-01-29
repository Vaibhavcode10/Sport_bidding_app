import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AuctionHistory from './AuctionHistory';
import { Navigate } from 'react-router-dom';

interface Props {
  userRole: 'admin' | 'auctioneer';
}

const AuctionHistoryWrapper: React.FC<Props> = ({ userRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Access control
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role validation
  if (user.role !== userRole) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AuctionHistory 
      userRole={user.role as 'admin' | 'auctioneer'} 
      userId={user.id} 
      sport={user.sport}
    />
  );
};

export default AuctionHistoryWrapper;