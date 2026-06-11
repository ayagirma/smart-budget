import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { Link2 } from 'lucide-react';

const PlaidLinkButton = ({ onSuccessCallback }) => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const response = await axios.post('http://localhost:5000/api/plaid/create_link_token', {}, config);
        setToken(response.data.link_token);
      } catch (err) {
        console.error('Error creating link token:', err);
      }
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback(async (public_token, metadata) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/plaid/set_access_token', { public_token }, config);
      if (onSuccessCallback) onSuccessCallback();
    } catch (err) {
      console.error('Error setting access token:', err);
    }
  }, [onSuccessCallback]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
  });

  return (
    <button 
      className="btn btn-secondary flex items-center gap-2" 
      onClick={() => open()} 
      disabled={!ready}
    >
      <Link2 size={20} /> Link Bank
    </button>
  );
};

export default PlaidLinkButton;
