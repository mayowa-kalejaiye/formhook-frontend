// Quick debug script to test what happens in production environment
// Run this in browser console on the deployed site to see what's happening

console.log('=== AUTH DEBUG ===');
console.log('Hostname:', window.location.hostname);
console.log('Is Production:', window.location.hostname !== 'localhost');

// Test the proxy route
fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://formhook-backend.onrender.com/auth/me',
    method: 'GET',
    data: {}
  })
})
.then(response => {
  console.log('Proxy Response Status:', response.status);
  console.log('Proxy Response Headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('Proxy Response Data:', data);
})
.catch(error => {
  console.log('Proxy Error:', error);
});

// Test direct API call
fetch('https://formhook-backend.onrender.com/auth/me', {
  credentials: 'include'
})
.then(response => {
  console.log('Direct API Response Status:', response.status);
  console.log('Direct API Response Headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('Direct API Response Data:', data);
})
.catch(error => {
  console.log('Direct API Error:', error);
});
