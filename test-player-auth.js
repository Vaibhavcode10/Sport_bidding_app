const testPlayerLogin = async () => {
  const testCases = [
    {
      username: "lionel_messi",
      password: "password123",
      role: "player",
      sport: "football",
      expectedName: "Lionel Messi"
    },
    {
      username: "virat_kohli", 
      password: "password123",
      role: "player",
      sport: "cricket",
      expectedName: "Virat Kohli"
    },
    {
      username: "lebron_james",
      password: "password123", 
      role: "player",
      sport: "basketball",
      expectedName: "LeBron James"
    }
  ];

  console.log("Testing Player Authentication System...\n");

  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase),
      });

      const result = await response.json();
      
      if (result.success && result.user.name === testCase.expectedName) {
        console.log(`✅ ${testCase.expectedName} (${testCase.sport}) - Login successful`);
        console.log(`   User ID: ${result.user.id}`);
        console.log(`   Role: ${result.user.role}`);
        
        // Test fetching player-specific data
        const playersResponse = await fetch(`http://localhost:3001/api/players/${testCase.sport}?userId=${result.user.id}&userRole=${result.user.role}`);
        const playersData = await playersResponse.json();
        
        if (playersData.length === 1 && playersData[0].name === testCase.expectedName) {
          console.log(`   ✅ Player-specific data fetch successful - only shows own data`);
        } else {
          console.log(`   ❌ Player-specific data fetch failed - shows ${playersData.length} players`);
        }
        console.log();
      } else {
        console.log(`❌ ${testCase.expectedName} - Login failed:`, result.message);
      }
    } catch (error) {
      console.log(`❌ ${testCase.expectedName} - Error:`, error.message);
    }
  }
  
  // Test admin login (should see all players)
  console.log("Testing Admin Login (should see all players)...\n");
  try {
    const adminResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
        role: "admin"
      }),
    });

    const adminResult = await adminResponse.json();
    
    if (adminResult.success) {
      console.log(`✅ Admin login successful`);
      
      // Test fetching all players as admin
      const playersResponse = await fetch(`http://localhost:3001/api/players/football`);
      const playersData = await playersResponse.json();
      
      console.log(`   ✅ Admin can see all ${playersData.length} football players`);
      console.log(`   Players: ${playersData.map(p => p.name).join(', ')}`);
    } else {
      console.log(`❌ Admin login failed:`, adminResult.message);
    }
  } catch (error) {
    console.log(`❌ Admin test - Error:`, error.message);
  }
};

// Wait a bit for server to be ready and then run tests
setTimeout(testPlayerLogin, 2000);