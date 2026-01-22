import React, { createContext, useContext, useState } from 'react';
import { BiddingRequest, BiddingRequestStatus } from '../types';

interface BiddingRequestContextType {
  requests: BiddingRequest[];
  addRequest: (request: Omit<BiddingRequest, 'id' | 'requestedAt'>) => void;
  approveRequest: (requestId: string, approvedBy: string) => void;
  rejectRequest: (requestId: string, rejectionReason: string) => void;
  getRequestsByStatus: (status: BiddingRequestStatus) => BiddingRequest[];
  getPlayerRequest: (playerId: string) => BiddingRequest | undefined;
  addPlayerToAuction: (requestId: string, auctionId: string) => void;
}

const BiddingRequestContext = createContext<BiddingRequestContextType | undefined>(undefined);

// Mock initial data
const INITIAL_REQUESTS: BiddingRequest[] = [];

export const BiddingRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<BiddingRequest[]>(INITIAL_REQUESTS);

  const addRequest = (request: Omit<BiddingRequest, 'id' | 'requestedAt'>) => {
    const newRequest: BiddingRequest = {
      ...request,
      id: `req_${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: BiddingRequestStatus.PENDING,
    };
    setRequests([...requests, newRequest]);
  };

  const approveRequest = (requestId: string, approvedBy: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: BiddingRequestStatus.APPROVED,
              approvedAt: new Date().toISOString(),
              approvedBy,
            }
          : req
      )
    );
  };

  const rejectRequest = (requestId: string, rejectionReason: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: BiddingRequestStatus.REJECTED,
              rejectionReason,
            }
          : req
      )
    );
  };

  const getRequestsByStatus = (status: BiddingRequestStatus) => {
    return requests.filter((req) => req.status === status);
  };

  const getPlayerRequest = (playerId: string) => {
    return requests.find((req) => req.playerId === playerId);
  };

  const addPlayerToAuction = (requestId: string, auctionId: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: BiddingRequestStatus.ADDED_TO_AUCTION,
              auctionId,
            }
          : req
      )
    );
  };

  return (
    <BiddingRequestContext.Provider
      value={{
        requests,
        addRequest,
        approveRequest,
        rejectRequest,
        getRequestsByStatus,
        getPlayerRequest,
        addPlayerToAuction,
      }}
    >
      {children}
    </BiddingRequestContext.Provider>
  );
};

export const useBiddingRequest = () => {
  const context = useContext(BiddingRequestContext);
  if (!context) {
    throw new Error('useBiddingRequest must be used within BiddingRequestProvider');
  }
  return context;
};
