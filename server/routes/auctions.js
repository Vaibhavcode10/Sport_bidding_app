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

// GET all auctioneers for admin (to assign to auctions) - MUST BE BEFORE /:sport
// NOTE: Auctioneers are NEUTRAL - they don't own or represent any team/franchise
router.get('/auctioneers/all/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can view auctioneers list' });
    }
    
    // Get auctioneers (neutral people who conduct auctions)
    const auctioneersFilePath = `data/${sport}/auctioneers.json`;
    let auctioneers = [];
    try {
      auctioneers = await fileStore.readJSON(auctioneersFilePath);
    } catch (err) {
      auctioneers = [];
    }
    
    // Return auctioneers - they are neutral, no franchise association
    const auctioneersList = auctioneers.map(auctioneer => ({
      id: auctioneer.id,
      username: auctioneer.username,
      name: auctioneer.name || auctioneer.username,
      sport: sport,
      // Auctioneers are neutral - they don't have franchises
      role: 'neutral_auctioneer'
    }));
    
    res.json({
      success: true,
      auctioneers: auctioneersList
    });
  } catch (err) {
    console.error('Get auctioneers error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET auctions assigned to auctioneer (Auctioneer only) - MUST BE BEFORE /:sport
router.get('/assigned/:auctioneerId', async (req, res) => {
  try {
    const { auctioneerId } = req.params;
    const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    let assignedAuctions = [];
    
    for (const sport of sports) {
      try {
        const auctions = await fileStore.readJSON(getAuctionsFilePath(sport));
        for (const auction of auctions) {
          // Check direct assignment
          if (auction.assignedAuctioneer?.id === auctioneerId) {
            assignedAuctions.push({
              ...auction,
              assignmentType: 'DIRECT'
            });
          }
        }
      } catch (err) {
        // Skip if no auctions file
      }
    }
    
    // Sort: READY first (can start), then CREATED, then others
    const statusOrder = { 'READY': 0, 'CREATED': 1, 'LIVE': 2, 'PAUSED': 3, 'COMPLETED': 4 };
    assignedAuctions.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    
    res.json({
      success: true,
      auctions: assignedAuctions
    });
  } catch (err) {
    console.error('Get assigned auctions error:', err);
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

// CREATE auction (admin only) - Full configuration including auctioneer assignment
router.post('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      name, 
      description,
      logoUrl,
      startDate, 
      endDate, 
      settings, 
      userRole, 
      userId,
      // New fields for full auction configuration
      assignedAuctioneerId,
      assignedAuctioneerName,
      teamIds,
      playerPool,
      bidSlabs,
      timerDuration
    } = req.body;
    
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
    
    // Default bid slabs if not provided
    const defaultBidSlabs = [
      { maxPrice: 10.0, increment: 0.25 },
      { maxPrice: 20.0, increment: 0.50 },
      { maxPrice: Infinity, increment: 1.0 }
    ];
    
    const newAuction = {
      id: `auction_${sport.substring(0, 2)}_${Date.now()}`,
      name,
      sport,
      description: description || '',
      logoUrl: logoUrl || '',
      startDate,
      endDate,
      // New status model: CREATED -> READY (when fully configured) -> LIVE -> COMPLETED
      status: 'CREATED',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      
      // Legacy fields for invitations (backward compatibility)
      invitedAuctioneers: [],
      acceptedAuctioneers: [],
      registeredPlayers: [],
      
      // NEW: Direct auctioneer assignment (Admin assigns ONE auctioneer)
      assignedAuctioneer: assignedAuctioneerId ? {
        id: assignedAuctioneerId,
        name: assignedAuctioneerName || 'Unknown',
        assignedAt: new Date().toISOString(),
        assignedBy: userId
      } : null,
      
      // NEW: Participating teams (replaces teamIds for better structure)
      participatingTeams: req.body.participatingTeams || [],
      
      // NEW: Full auction configuration by admin
      teamIds: (req.body.participatingTeams || []).map(team => team.id),
      playerPool: playerPool || [],
      completedPlayerIds: [],
      bidSlabs: bidSlabs || defaultBidSlabs,
      timerDuration: timerDuration || 20,
      
      settings: settings || {
        minBidIncrement: 100000,
        maxPlayersPerTeam: 15,
        bidTimeLimit: 30
      }
    };
    
    // If fully configured (has auctioneer, teams, players), mark as READY
    if (newAuction.assignedAuctioneer && 
        newAuction.teamIds.length > 0 && 
        newAuction.playerPool.length > 0) {
      newAuction.status = 'READY';
    }
    
    auctions.push(newAuction);
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTION_CREATED', {
      sport,
      auctionId: newAuction.id,
      auctionName: newAuction.name,
      createdBy: userId,
      status: newAuction.status,
      assignedAuctioneerId: newAuction.assignedAuctioneer?.id
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

// UPDATE team purses during live auction (Auctioneer)
router.put('/:sport/:auctionId/teams', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { participatingTeams, userRole, userId } = req.body;
    
    // Auctioneer or admin only
    if (userRole !== 'auctioneer' && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only auctioneer can update team purses during live auction' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Update participating teams (purse changes)
    if (participatingTeams) {
      auctions[auctionIndex].participatingTeams = participatingTeams;
    }
    auctions[auctionIndex].updatedAt = new Date().toISOString();
    
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    res.json({
      success: true,
      message: 'Team purses updated',
      auction: auctions[auctionIndex]
    });
  } catch (err) {
    console.error('Update team purses error:', err);
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

// ============================================
// NEW ENDPOINTS: Admin assigns auctioneer, configures auction
// ============================================

// ASSIGN auctioneer to auction (Admin only) - Direct assignment, no invitation flow
router.post('/:sport/:auctionId/assign-auctioneer', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { auctioneerId, auctioneerName, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can assign auctioneers' });
    }
    
    if (!auctioneerId || !auctioneerName) {
      return res.status(400).json({ success: false, error: 'Auctioneer ID and name are required' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Cannot reassign if auction is already LIVE or COMPLETED
    if (['LIVE', 'COMPLETED'].includes(auctions[auctionIndex].status)) {
      return res.status(400).json({ success: false, error: 'Cannot reassign auctioneer for live or completed auction' });
    }
    
    // Assign auctioneer
    auctions[auctionIndex].assignedAuctioneer = {
      id: auctioneerId,
      name: auctioneerName,
      assignedAt: new Date().toISOString(),
      assignedBy: userId
    };
    
    // Check if auction is now fully configured (has teams and players too)
    const auction = auctions[auctionIndex];
    if (auction.teamIds?.length > 0 && auction.playerPool?.length > 0) {
      auction.status = 'READY';
    }
    
    auctions[auctionIndex].updatedAt = new Date().toISOString();
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTIONEER_ASSIGNED', {
      sport,
      auctionId,
      auctionName: auctions[auctionIndex].name,
      auctioneerId,
      auctioneerName,
      assignedBy: userId
    });
    
    res.json({
      success: true,
      message: `${auctioneerName} assigned to auction successfully`,
      auction: auctions[auctionIndex]
    });
  } catch (err) {
    console.error('Assign auctioneer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CONFIGURE auction (Admin only) - Set teams, players, bid slabs, timer
router.post('/:sport/:auctionId/configure', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { teamIds, playerPool, bidSlabs, timerDuration, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can configure auctions' });
    }
    
    const auctionsFilePath = getAuctionsFilePath(sport);
    let auctions = await fileStore.readJSON(auctionsFilePath);
    
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    if (auctionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Cannot configure if auction is already LIVE or COMPLETED
    if (['LIVE', 'COMPLETED'].includes(auctions[auctionIndex].status)) {
      return res.status(400).json({ success: false, error: 'Cannot configure live or completed auction' });
    }
    
    // Update configuration
    if (teamIds) auctions[auctionIndex].teamIds = teamIds;
    if (playerPool) auctions[auctionIndex].playerPool = playerPool;
    if (bidSlabs) auctions[auctionIndex].bidSlabs = bidSlabs;
    if (timerDuration !== undefined) auctions[auctionIndex].timerDuration = timerDuration;
    
    // Check if auction is now fully configured
    const auction = auctions[auctionIndex];
    if (auction.assignedAuctioneer && 
        auction.teamIds?.length > 0 && 
        auction.playerPool?.length > 0) {
      auction.status = 'READY';
    }
    
    auctions[auctionIndex].updatedAt = new Date().toISOString();
    await fileStore.writeJSON(auctionsFilePath, auctions);
    
    // Log history
    await logHistoryAction('AUCTION_CONFIGURED', {
      sport,
      auctionId,
      auctionName: auctions[auctionIndex].name,
      configuredBy: userId,
      teamCount: auction.teamIds?.length,
      playerCount: auction.playerPool?.length
    });
    
    res.json({
      success: true,
      message: 'Auction configured successfully',
      auction: auctions[auctionIndex]
    });
  } catch (err) {
    console.error('Configure auction error:', err);
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

export default router;