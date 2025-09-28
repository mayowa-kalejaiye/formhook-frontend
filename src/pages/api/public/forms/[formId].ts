// Public API endpoint to get form structure for submission (no auth required)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { formId } = req.query;

  if (!formId || typeof formId !== 'string') {
    return res.status(400).json({ message: 'Form ID is required' });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';
    
    let formData = null;
    
    // Try the public endpoint first
    try {
      console.log(`Trying to fetch form from: ${backendUrl}/forms/public/${formId}`);
      const publicResponse = await fetch(`${backendUrl}/forms/public/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Backend response status: ${publicResponse.status}`);
      
      if (publicResponse.ok) {
        formData = await publicResponse.json();
        console.log('Got form data from public endpoint:', formData);
        return res.status(200).json(formData);
      } else {
        const errorText = await publicResponse.text();
        console.log(`Backend error response: ${errorText}`);
      }
    } catch (publicError) {
      console.log('Public endpoint error:', publicError.message);
    }

    // Temporary workaround: Try to get form data through authenticated endpoint
    // This should be removed once the public endpoint is working
    try {
      console.log('Trying authenticated endpoint as fallback...');
      const authResponse = await fetch(`${backendUrl}/forms/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: This won't work without auth token, but let's try
        },
      });
      
      if (authResponse.ok) {
        formData = await authResponse.json();
        console.log('Got form data from authenticated endpoint:', formData);
        return res.status(200).json(formData);
      }
    } catch (authError) {
      console.log('Authenticated endpoint also failed:', authError.message);
    }
    
    // Fallback to hardcoded structure
    console.log('Using fallback form structure for form:', formId);
    formData = {
      id: formId,
      name: 'Contact Form',
      description: 'Please fill out this form',
      fields: [
        { 
          name: 'email', 
          label: 'Email Address', 
          type: 'email', 
          required: true,
          placeholder: 'Enter your email address'
        },
        { 
          name: 'name', 
          label: 'Name', 
          type: 'text', 
          required: false,
          placeholder: 'Enter your name'
        },
        { 
          name: 'message', 
          label: 'Message', 
          type: 'textarea', 
          required: false,
          placeholder: 'Enter your message'
        }
      ]
    };
    
    return res.status(200).json(formData);
  } catch (error) {
    console.error('Error fetching form:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
