const testHealth = async () => {
  try {
    const response = await fetch('http://localhost:4000/health');
    const data = await response.json();
    console.log('Health Status:', response.status);
    console.log('Health Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

testHealth();
