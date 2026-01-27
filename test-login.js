const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/auctioneers/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'james_mitchell',
        password: 'password123',
        sport: 'baseball',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
};

testLogin();
