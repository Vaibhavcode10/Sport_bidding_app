import express from 'express';
import { fileStore } from '../fileStore.js';

const router = express.Router();

// History logging helper function
const logHistoryAction = async (action, details) => {
  try {
    const historyFilePath = 'data/history.json';
    let history = [];
    
    try {
      history = await fileStore.readJSON(historyFilePath);
    } catch (err) {
      // History file doesn't exist, start with empty array
      history = [];
    }
    
    const historyEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      ...details
    };
    
    history.unshift(historyEntry); // Add to beginning of array
    await fileStore.writeJSON(historyFilePath, history);
    console.log('✅ History action logged:', action, details);
  } catch (err) {
    console.error('❌ Error logging history action:', err);
  }
};

// Get all verification requests for admin
router.get('/verification-requests/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;

    // Only admin can view verification requests
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can view verification requests' 
      });
    }

    const playersFilePath = `data/${sport}/players.json`;
    const players = await fileStore.readJSON(playersFilePath);
    
    // Return unverified players as verification requests
    const unverifiedPlayers = players.filter(player => !player.verified);
    
    res.json({
      success: true,
      requests: unverifiedPlayers
    });
  } catch (err) {
    console.error('Get verification requests error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Submit verification request (for players to request verification)
router.post('/verification-request/:sport/:playerId', async (req, res) => {
  try {
    const { sport, playerId } = req.params;
    const { userId, userRole } = req.body;

    // Only players can request verification for themselves or admin can request for any player
    if (userRole === 'player' && userId !== playerId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only request verification for yourself' 
      });
    }

    const playersFilePath = `data/${sport}/players.json`;
    let players = await fileStore.readJSON(playersFilePath);
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    // Update player with verification request timestamp
    players[playerIndex].verificationRequestedAt = new Date().toISOString();
    
    await fileStore.writeJSON(playersFilePath, players);
    
    res.json({
      success: true,
      message: 'Verification request submitted successfully'
    });
  } catch (err) {
    console.error('Submit verification request error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Approve/Verify a player (admin only)
router.post('/verify-player/:sport/:playerId', async (req, res) => {
  try {
    const { sport, playerId } = req.params;
    const { userId, userRole } = req.body;

    // Only admin can verify players
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can verify players' 
      });
    }

    const playersFilePath = `data/${sport}/players.json`;
    let players = await fileStore.readJSON(playersFilePath);
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    const player = players[playerIndex];
    const previousStatus = player.verified;
    
    // Update player verification status
    players[playerIndex].verified = true;
    players[playerIndex].verifiedAt = new Date().toISOString();
    players[playerIndex].verifiedBy = userId;
    
    // Log history action
    await logHistoryAction('PLAYER_VERIFICATION', {
      sport,
      playerId,
      playerName: player.name,
      adminUserId: userId,
      previousStatus: previousStatus ? 'VERIFIED' : 'UNVERIFIED',
      newStatus: 'VERIFIED',
      role: player.role,
      basePrice: player.basePrice
    });
    
    await fileStore.writeJSON(playersFilePath, players);
    
    res.json({
      success: true,
      message: `Player ${players[playerIndex].name} verified successfully`,
      player: players[playerIndex]
    });
  } catch (err) {
    console.error('Verify player error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get eligible (verified) players for auction
router.get('/eligible-players/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;

    // Only admin and auctioneer can view eligible players
    if (userRole !== 'admin' && userRole !== 'auctioneer') {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions to view eligible players' 
      });
    }

    const playersFilePath = `data/${sport}/players.json`;
    const players = await fileStore.readJSON(playersFilePath);
    
    // Return only verified players
    const eligiblePlayers = players.filter(player => player.verified === true);
    
    res.json({
      success: true,
      players: eligiblePlayers
    });
  } catch (err) {
    console.error('Get eligible players error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get history (admin only)
router.get('/history', async (req, res) => {
  try {
    const { userRole } = req.query;

    // Only admin can view history
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can view history' 
      });
    }

    const historyFilePath = 'data/history.json';
    let history = [];
    
    try {
      history = await fileStore.readJSON(historyFilePath);
    } catch (err) {
      // History file doesn't exist, return empty array
      history = [];
    }
    
    console.log('📚 History request - found', history.length, 'entries');
    
    res.json({
      success: true,
      history
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Test endpoint to manually add history (for debugging)
router.post('/test-history', async (req, res) => {
  try {
    await logHistoryAction('TEST_ACTION', {
      testData: 'This is a test history entry',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Test history entry added'
    });
  } catch (err) {
    console.error('Test history error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;