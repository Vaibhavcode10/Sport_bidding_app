import express from 'express';
import { fileStore } from '../fileStore.js';

const router = express.Router();

// Helper function to get auctions file path
const getAuctionsFilePath = (sport) => `data/${sport}/auctions.json`;

// Helper function to log history
const logHistoryAction = async (action, details) => {
  try {
    const historyFilePath = 'data/history.json';
    let history = [];
    
    try {
      history = await fileStore.readJSON(historyFilePath);
    } catch (err) {
      history = [];
    }
    
    const historyEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      ...details
    };
    
    history.unshift(historyEntry);
    await fileStore.writeJSON(historyFilePath, history);
    console.log('✅ History action logged:', action);
  } catch (err) {
    console.error('❌ Error logging history action:', err);
  }
};

// GET all auctions across all sports (for admin dashboard) - MUST BE BEFORE /:sport
router.get('/all/sports', async (req, res) => {
  try {
    const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    let allAuctions = [];
    
    for (const sport of sports) {
      try {
        const auctions = await fileStore.readJSON(getAuctionsFilePath(sport));
        allAuctions = [...allAuctions, ...auctions];
      } catch (err) {
        // Skip if no auctions file for this sport
      }
    }
    
    // Sort by createdAt (newest first)
    allAuctions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      auctions: allAuctions
    });
  } catch (err) {
    console.error('Get all auctions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all auctioneers for admin (to invite) - MUST BE BEFORE /:sport
router.get('/auctioneers/all/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can view auctioneers list' });
    }
    
    // Get auctioneers from franchises
    const franchisesFilePath = `data/${sport}/franchises.json`;
    let franchises = [];
    try {
      franchises = await fileStore.readJSON(franchisesFilePath);
    } catch (err) {
      franchises = [];
    }
    
    // Get auctioneers info
    const auctioneersFilePath = `data/${sport}/auctioneers.json`;
    let auctioneers = [];
    try {
      auctioneers = await fileStore.readJSON(auctioneersFilePath);
    } catch (err) {
      auctioneers = [];
    }
    
    // Combine data
    const auctioneersList = auctioneers.map(auctioneer => {
      const franchise = franchises.find(f => f.auctioneerId === auctioneer.id);
      return {
        id: auctioneer.id,
        username: auctioneer.username,
        name: auctioneer.name || auctioneer.username,
        franchiseName: franchise?.name || 'No Franchise',
        franchiseId: franchise?.id || null
      };
    });
    
    res.json({
      success: true,
      auctioneers: auctioneersList
    });
  } catch (err) {
    console.error('Get auctioneers error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all auctions for a sport (anyone can view) - Generic route LAST
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const auctionsFilePath = getAuctionsFilePath(sport);
    
    let auctions = [];
    try {
      auctions = await fileStore.readJSON(auctionsFilePath);
    } catch (err) {
      // No auctions file exists
      auctions = [];
    }
    
    res.json({
      success: true,
      auctions
    });
  } catch (err) {
    console.error('Get auctions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single auction
router.get('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const auctionsFilePath = getAuctionsFilePath(sport);
    
    const auctions = await fileStore.readJSON(auctionsFilePath);
    const auction = auctions.find(a => a.id === auctionId);
    
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    res.json({
      success: true,
      auction
    });
  } catch (err) {
    console.error('Get auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE auction (admin only)
router.post('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { name, description, startDate, endDate, settings, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can create auctions' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    
    let auctions = [];
    try {
      auctions = await fileStore.readJSON(auctionsFilePath);
    } catch (err) {
      auctions = [];
    }
    
    const newAuction = {
      id: `auction_${sport.substring(0, 2)}_${Date.now()}`,
      name,
      sport,
      description: description || '',
      startDate,
      endDate,
      status: 'SCHEDULED',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      invitedAuctioneers: [],
      acceptedAuctioneers: [],
      registeredPlayers: [],
      settings: settings || {
        minBidIncrement: 100000,
        maxPlayersPerTeam: 15,
        bidTimeLimit: 30
      }
    };
    
    auctions.push(newAuction);
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTION_CREATED', {
      sport,
      auctionId: newAuction.id,
      auctionName: newAuction.name,
      createdBy: userId
    });
    
    res.json({
      success: true,
      message: 'Auction created successfully',
      auction: newAuction
    });
  } catch (err) {
    console.error('Create auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE auction (admin only)
router.put('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { name, description, startDate, endDate, status, settings, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can update auctions' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Update fields
    if (name) auctions[auctionIndex].name = name;
    if (description !== undefined) auctions[auctionIndex].description = description;
    if (startDate) auctions[auctionIndex].startDate = startDate;
    if (endDate) auctions[auctionIndex].endDate = endDate;
    if (status) auctions[auctionIndex].status = status;
    if (settings) auctions[auctionIndex].settings = { ...auctions[auctionIndex].settings, ...settings };
    auctions[auctionIndex].updatedAt = new Date().toISOString();
    auctions[auctionIndex].updatedBy = userId;
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTION_UPDATED', {
      sport,
      auctionId,
      auctionName: auctions[auctionIndex].name,
      updatedBy: userId,
      changes: { name, description, startDate, endDate, status }
    });
    
    res.json({
      success: true,
      message: 'Auction updated successfully',
      auction: auctions[auctionIndex]
    });
  } catch (err) {
    console.error('Update auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE auction (admin only)
router.delete('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userRole, userId } = req.query;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can delete auctions' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionToDelete = auctions.find(a => a.id === auctionId);
    if (!auctionToDelete) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    auctions = auctions.filter(a => a.id !== auctionId);
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTION_DELETED', {
      sport,
      auctionId,
      auctionName: auctionToDelete.name,
      deletedBy: userId
    });
    
    res.json({
      success: true,
      message: 'Auction deleted successfully'
    });
  } catch (err) {
    console.error('Delete auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// INVITE auctioneer to auction (admin only)
router.post('/:sport/:auctionId/invite', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { auctioneerId, auctioneerName, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can invite auctioneers' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Check if already invited
    if (auctions[auctionIndex].invitedAuctioneers.some(inv => inv.id === auctioneerId)) {
      return res.status(400).json({ success: false, error: 'Auctioneer already invited' });
    }
    
    // Add invitation
    auctions[auctionIndex].invitedAuctioneers.push({
      id: auctioneerId,
      name: auctioneerName,
      invitedAt: new Date().toISOString(),
      invitedBy: userId,
      status: 'PENDING'
    });
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTIONEER_INVITED', {
      sport,
      auctionId,
      auctionName: auctions[auctionIndex].name,
      auctioneerId,
      auctioneerName,
      invitedBy: userId
    });
    
    res.json({
      success: true,
      message: `${auctioneerName} invited to auction successfully`
    });
  } catch (err) {
    console.error('Invite auctioneer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ACCEPT invitation (auctioneer)
router.post('/:sport/:auctionId/accept', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userId, userName, userRole } = req.body;
    
    if (userRole !== 'auctioneer') {
      return res.status(403).json({ success: false, error: 'Only auctioneers can accept invitations' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Find and update invitation
    const invitationIndex = auctions[auctionIndex].invitedAuctioneers.findIndex(inv => inv.id === userId);
    if (invitationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    auctions[auctionIndex].invitedAuctioneers[invitationIndex].status = 'ACCEPTED';
    auctions[auctionIndex].invitedAuctioneers[invitationIndex].acceptedAt = new Date().toISOString();
    
    // Add to accepted auctioneers
    if (!auctions[auctionIndex].acceptedAuctioneers.some(a => a.id === userId)) {
      auctions[auctionIndex].acceptedAuctioneers.push({
        id: userId,
        name: userName,
        acceptedAt: new Date().toISOString()
      });
    }
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTIONEER_ACCEPTED', {
      sport,
      auctionId,
      auctionName: auctions[auctionIndex].name,
      auctioneerId: userId,
      auctioneerName: userName
    });
    
    res.json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (err) {
    console.error('Accept invitation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DECLINE invitation (auctioneer)
router.post('/:sport/:auctionId/decline', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userId, userRole } = req.body;
    
    if (userRole !== 'auctioneer') {
      return res.status(403).json({ success: false, error: 'Only auctioneers can decline invitations' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Find and update invitation
    const invitationIndex = auctions[auctionIndex].invitedAuctioneers.findIndex(inv => inv.id === userId);
    if (invitationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    auctions[auctionIndex].invitedAuctioneers[invitationIndex].status = 'DECLINED';
    auctions[auctionIndex].invitedAuctioneers[invitationIndex].declinedAt = new Date().toISOString();
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (err) {
    console.error('Decline invitation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REGISTER player for auction
router.post('/:sport/:auctionId/register-player', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userId, userName, userRole } = req.body;
    
    if (userRole !== 'player') {
      return res.status(403).json({ success: false, error: 'Only players can register for auctions' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Check if already registered
    if (auctions[auctionIndex].registeredPlayers.some(p => p.id === userId)) {
      return res.status(400).json({ success: false, error: 'Already registered for this auction' });
    }
    
    // Add player
    auctions[auctionIndex].registeredPlayers.push({
      id: userId,
      name: userName,
      registeredAt: new Date().toISOString()
    });
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    res.json({
      success: true,
      message: 'Registered for auction successfully'
    });
  } catch (err) {
    console.error('Register player error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET auctions for auctioneer (invitations)
router.get('/auctioneer/:userId/invitations', async (req, res) => {
  try {
    const { userId } = req.params;
    const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    let invitations = [];
    
    for (const sport of sports) {
      try {
        const auctions = await fileStore.readJSON(getAuctionsFilePath(sport));
        for (const auction of auctions) {
          const invitation = auction.invitedAuctioneers.find(inv => inv.id === userId);
          if (invitation) {
            invitations.push({
              ...auction,
              invitationStatus: invitation.status,
              invitedAt: invitation.invitedAt
            });
          }
        }
      } catch (err) {
        // Skip if no auctions file
      }
    }
    
    res.json({
      success: true,
      invitations
    });
  } catch (err) {
    console.error('Get auctioneer invitations error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;