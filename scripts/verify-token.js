#!/usr/bin/env node

/**
 * Manual verification token tester
 * 
 * This script allows you to manually test the verification endpoint
 * when developing locally with a live backend.
 * 
 * Usage:
 *   node verify-token.js <token>
 */

const axios = require('axios');

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';

// Get token from command line args
const token = process.argv[2];

if (!token) {
  console.error('Error: No token provided');
  console.log('Usage: node verify-token.js <token>');
  process.exit(1);
}

console.log(`Testing verification for token: ${token}`);
console.log(`API URL: ${API_URL}`);

// Make the verification request
axios.post(`${API_URL}/auth/verify-email`, { token })
  .then(response => {
    console.log('\n✅ Verification successful!');
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🔐 Your email has been verified successfully.');
      console.log('You can now sign in to your account.');
    } else {
      console.log('\n⚠️ Response indicates verification was not successful.');
    }
  })
  .catch(error => {
    console.log('\n❌ Verification failed');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`Status: ${error.response.status}`);
      console.log('Response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('\n⚠️ 404 Not Found - The verification endpoint does not exist');
        console.log('Make sure your backend has a POST /auth/verify-email endpoint');
      } else if (error.response.status === 401) {
        console.log('\n⚠️ 401 Unauthorized - The token is invalid or expired');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server');
      console.log('The server might be down or unreachable');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error setting up request:');
      console.log(error.message);
    }
    
    console.log('\n🔍 Debugging tips:');
    console.log('1. Make sure the backend is running and accessible');
    console.log('2. Check if the token is valid and not expired');
    console.log('3. Verify the API endpoint path is correct');
  });
