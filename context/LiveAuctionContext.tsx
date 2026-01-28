import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import type { 
  TempAuctionLedger, 
  LiveAuctionSession, 
  Team, 
  Player,
  LiveAuctionState,
  BidEntry
} from '../types';

interface LiveAuctionContextType {
  // State
  session: LiveAuctionSession | null;
  ledger: TempAuctionLedger | null;
  teams: Team[];
  currentPlayer: Player | null;
  hasActiveAuction: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Timer
  timeRemaining: number;
  isTimerRunning: boolean;
  
  // Computed values
  nextValidBid: number | null;
  currentIncrement: number | null;
  
  // Auctioneer Actions
  startSession: (config: StartSessionConfig) => Promise<boolean>;
  selectPlayer: (playerId: string, playerName: string, basePrice: number) => Promise<boolean>;
  startBidding: () => Promise<boolean>;
  confirmBid: (teamId: string, teamName: string) => Promise<boolean>;
  submitJumpBid: (teamId: string, teamName: string, amount: number) => Promise<boolean>;
  pauseBidding: () => Promise<boolean>;
  resumeBidding: () => Promise<boolean>;
  markSold: () => Promise<boolean>;
  markUnsold: () => Promise<boolean>;
  endSession: () => Promise<boolean>;
  
  // Read Actions
  refreshState: () => Promise<void>;
  getPlayerHistory: (playerId: string) => Promise<BidEntry[]>;
}

interface StartSessionConfig {
  auctionId: string;
  sport: string;
  name: string;
  auctioneerName: string;
  teamIds: string[];
  playerPool: string[];
  bidSlabs?: Array<{ maxPrice: number; increment: number }>;
  timerDuration?: number;
}

const LiveAuctionContext = createContext<LiveAuctionContextType | undefined>(undefined);

// Polling interval for state updates (1 second for live updates)
const POLL_INTERVAL = 1000;

export const LiveAuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Core state
  const [session, setSession] = useState<LiveAuctionSession | null>(null);
  const [ledger, setLedger] = useState<TempAuctionLedger | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate next valid bid based on current state
  const nextValidBid = ledger ? calculateNextBid(ledger.currentBid, ledger.bidSlabs) : null;
  const currentIncrement = ledger ? getIncrementForPrice(ledger.currentBid, ledger.bidSlabs) : null;

  // Refresh state from server
  const refreshState = useCallback(async () => {
    try {
      const response = await api.get('/live-auction/state');
      
      if (response.data.success) {
        setSession(response.data.session);
        setLedger(response.data.ledger);
        setTeams(response.data.teams || []);
        setCurrentPlayer(response.data.currentPlayer);
        setHasActiveAuction(response.data.hasActiveAuction);
        setError(null);
        
        // Update timer
        if (response.data.ledger && response.data.ledger.state === 'LIVE' && response.data.ledger.timerStartedAt) {
          const elapsed = (Date.now() - new Date(response.data.ledger.timerStartedAt).getTime()) / 1000;
          const remaining = Math.max(0, response.data.ledger.timerDuration - elapsed);
          setTimeRemaining(Math.ceil(remaining));
          setIsTimerRunning(true);
        } else {
          setIsTimerRunning(false);
        }
      }
    } catch (err) {
      console.error('Failed to refresh auction state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining]);

  // Polling for live updates
  useEffect(() => {
    refreshState();
    
    const pollInterval = setInterval(refreshState, POLL_INTERVAL);
    
    return () => clearInterval(pollInterval);
  }, [refreshState]);

  // ============================================
  // AUCTIONEER ACTIONS
  // ============================================

  const startSession = async (config: StartSessionConfig): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can start sessions');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/start', {
        ...config,
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to start session');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      return false;
    }
  };

  const selectPlayer = async (playerId: string, playerName: string, basePrice: number): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can select players');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/select-player', {
        playerId,
        playerName,
        basePrice,
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to select player');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select player');
      return false;
    }
  };

  const startBidding = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can start bidding');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/start-bidding', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to start bidding');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start bidding');
      return false;
    }
  };

  const confirmBid = async (teamId: string, teamName: string): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can confirm bids');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/bid', {
        teamId,
        teamName,
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to confirm bid');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm bid');
      return false;
    }
  };

  const submitJumpBid = async (teamId: string, teamName: string, amount: number): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can submit jump bids');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/jump-bid', {
        teamId,
        teamName,
        jumpAmount: amount,
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to submit jump bid');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit jump bid');
      return false;
    }
  };

  const pauseBidding = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can pause bidding');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/pause', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to pause bidding');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to pause bidding');
      return false;
    }
  };

  const resumeBidding = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can resume bidding');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/resume', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to resume bidding');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resume bidding');
      return false;
    }
  };

  const markSold = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can mark as sold');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/sold', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to mark as sold');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark as sold');
      return false;
    }
  };

  const markUnsold = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can mark as unsold');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/unsold', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to mark as unsold');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark as unsold');
      return false;
    }
  };

  const endSession = async (): Promise<boolean> => {
    if (user?.role !== 'auctioneer') {
      setError('Only auctioneers can end sessions');
      return false;
    }
    
    try {
      const response = await api.post('/live-auction/end', {
        userRole: 'auctioneer',
        auctioneerId: user.id
      });
      
      if (response.data.success) {
        await refreshState();
        return true;
      } else {
        setError(response.data.error || 'Failed to end session');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
      return false;
    }
  };

  // ============================================
  // READ ACTIONS
  // ============================================

  const getPlayerHistory = async (playerId: string): Promise<BidEntry[]> => {
    try {
      const response = await api.get(`/live-auction/history/${playerId}`);
      if (response.data.success) {
        return response.data.history || [];
      }
      return [];
    } catch (err) {
      console.error('Failed to get player history:', err);
      return [];
    }
  };

  const value: LiveAuctionContextType = {
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
    submitJumpBid,
    pauseBidding,
    resumeBidding,
    markSold,
    markUnsold,
    endSession,
    refreshState,
    getPlayerHistory
  };

  return (
    <LiveAuctionContext.Provider value={value}>
      {children}
    </LiveAuctionContext.Provider>
  );
};

export const useLiveAuction = () => {
  const context = useContext(LiveAuctionContext);
  if (context === undefined) {
    throw new Error('useLiveAuction must be used within a LiveAuctionProvider');
  }
  return context;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getIncrementForPrice(price: number, slabs: Array<{ maxPrice: number; increment: number }>): number {
  for (const slab of slabs) {
    if (price <= slab.maxPrice) {
      return slab.increment;
    }
  }
  return slabs[slabs.length - 1].increment;
}

function calculateNextBid(currentBid: number, slabs: Array<{ maxPrice: number; increment: number }>): number {
  const increment = getIncrementForPrice(currentBid, slabs);
  return parseFloat((currentBid + increment).toFixed(2));
}

export default LiveAuctionContext;
