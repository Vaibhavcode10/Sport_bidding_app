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
    console.log('✅ History action logged:', action, details);
  } catch (err) {
    console.error('❌ Error logging history action:', err);
  }
};

const getFilePath = (sport) => `data/${sport}/players.json`;

// Get all players for a sport or current player only
router.get('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const players = await fileStore.readJSON(filePath);
    
    // Check if this is a player-only request (via query parameter or authorization)
    const { userId, userRole, verified } = req.query;
    
    if (userRole === 'player' && userId) {
      // Return only the logged-in player's data
      const playerData = players.find(p => p.id === userId);
      if (playerData) {
        res.json([playerData]);
      } else {
        res.json([]);
      }
    } else if (verified === 'true') {
      // Return only verified players (for auctions)
      const verifiedPlayers = players.filter(p => p.verified === true);
      res.json(verifiedPlayers);
    } else {
      // Return all players (for admin view)
      res.json(players);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new player to a sport
router.post('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const players = await fileStore.readJSON(filePath);
    const sportPrefix = req.params.sport.substring(0, 2).toLowerCase();
    const newPlayer = {
      ...req.body,
      id: `${sportPrefix}_p${Date.now()}`,
      sport: req.params.sport,
      currentBid: 0,
      status: 'AVAILABLE',
      auctionPrice: null,
      soldTo: null
    };
    players.push(newPlayer);
    await fileStore.writeJSON(filePath, players);
    res.status(201).json(newPlayer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update player
router.put('/:sport/:id', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    let players = await fileStore.readJSON(filePath);
    players = players.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
    await fileStore.writeJSON(filePath, players);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete player
router.delete('/:sport/:id', async (req, res) => {
  try {
    const { sport, id } = req.params;
    const { userId, userRole } = req.query;

    // Validate required parameters
    if (!userId || !userRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'User authentication required' 
      });
    }

    const playersFilePath = getFilePath(sport);
    const franchisesFilePath = `data/${sport}/franchises.json`;
    
    let players = await fileStore.readJSON(playersFilePath);
    let franchises = await fileStore.readJSON(franchisesFilePath);
    
    // Find the player to be deleted
    const playerToDelete = players.find(p => p.id === id);
    if (!playerToDelete) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    // If auctioneer, verify ownership
    if (userRole === 'auctioneer') {
      // Find auctioneer's franchise
      const auctioneerFranchise = franchises.find(f => f.auctioneerId === userId);
      if (!auctioneerFranchise) {
        return res.status(403).json({ 
          success: false, 
          error: 'No franchise found for auctioneer' 
        });
      }

      // Check if player belongs to auctioneer's team
      if (!auctioneerFranchise.playerIds.includes(id)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You can only delete players from your own team' 
        });
      }

      // Remove player from franchise
      auctioneerFranchise.playerIds = auctioneerFranchise.playerIds.filter(playerId => playerId !== id);
      auctioneerFranchise.playerCount = Math.max(0, (auctioneerFranchise.playerCount || 0) - 1);
      
      // If player was sold, add their price back to purse
      if (playerToDelete.soldPrice && playerToDelete.soldTo === auctioneerFranchise.id) {
        auctioneerFranchise.purseRemaining = (auctioneerFranchise.purseRemaining || 0) + playerToDelete.soldPrice;
      }
    }
    // Admin can delete any player (existing behavior preserved)
    else if (userRole === 'admin') {
      // Remove player from all franchises that might own them
      franchises.forEach(franchise => {
        if (franchise.playerIds && franchise.playerIds.includes(id)) {
          franchise.playerIds = franchise.playerIds.filter(playerId => playerId !== id);
          franchise.playerCount = Math.max(0, (franchise.playerCount || 0) - 1);
          
          // If player was sold, add their price back to purse
          if (playerToDelete.soldPrice && playerToDelete.soldTo === franchise.id) {
            franchise.purseRemaining = (franchise.purseRemaining || 0) + playerToDelete.soldPrice;
          }
        }
      });
    }
    // Other roles cannot delete players
    else {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions to delete players' 
      });
    }

    // Remove player from players array
    players = players.filter(p => p.id !== id);

    // Log history action
    await logHistoryAction('PLAYER_DELETION', {
      sport,
      playerId: id,
      playerName: playerToDelete.name,
      deletedBy: userId,
      deletedByRole: userRole,
      role: playerToDelete.role,
      basePrice: playerToDelete.basePrice,
      soldPrice: playerToDelete.soldPrice || null,
      soldTo: playerToDelete.soldTo || null,
      verified: playerToDelete.verified || false
    });

    // Save both files
    await fileStore.writeJSON(playersFilePath, players);
    await fileStore.writeJSON(franchisesFilePath, franchises);

    res.json({ 
      success: true, 
      message: 'Player deleted successfully',
      deletedPlayer: playerToDelete.name 
    });
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;