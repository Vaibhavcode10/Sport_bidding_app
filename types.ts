export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  UP_NEXT = 'UP_NEXT'
}

export enum AuctionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED'
}

export interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice: number;
  currentBid: number;
  soldPrice?: number;
  status: PlayerStatus;
  teamId?: string;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  logoUrl?: string;
}

export interface AuctionSession {
  id: string;
  sport: string;
  name: string;
  date: string;
  status: AuctionStatus;
  activePlayerId?: string;
  bidIncrement: number;
  teamIds: string[];
}

export type EntityType = 'players' | 'teams' | 'auction';

export enum BiddingRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADDED_TO_AUCTION = 'ADDED_TO_AUCTION'
}

export interface BiddingRequest {
  id: string;
  playerId: string;
  playerName: string;
  sport: string;
  role: string;
  basePrice: number;
  status: BiddingRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  auctionId?: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  name: string;
  sport: string;
  role: string;
  jersey?: number;
  height?: string;
  weight?: string;
  age?: number;
  basePrice: number;
  bio?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  biddingRequestStatus?: BiddingRequestStatus;
}

export interface BidEvent {
  id: string;
  sport: string;
  name: string;
  date: string;
  status: AuctionStatus;
  teams: Team[];
  currentPlayer?: Player;
  bidIncrement: number;
}