import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { Link2 } from 'lucide-react';

const PlaidLinkButton = ({ onSuccessCallback }) => {
  const [token, setToken] = useState(null);
  const [country, setCountry] = useState('US');

  const createLinkToken = useCallback(async (selectedCountry) => {
    try {
      setToken(null); // Reset token to disable button while loading
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const response = await axios.post('http://localhost:5000/api/plaid/create_link_token', { countryCode: selectedCountry }, config);
      setToken(response.data.link_token);
    } catch (err) {
      console.error('Error creating link token:', err);
    }
  }, []);

  // Run IP-based geolocation lookup on mount
  useEffect(() => {
    const detectCountry = async () => {
      let detectedCountry = 'US';
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        if (geoData && geoData.country_code) {
          detectedCountry = geoData.country_code;
        }
      } catch (err) {
        console.error('IP Geolocation error, falling back to browser locale:', err);
        const lang = navigator.language || navigator.userLanguage;
        if (lang && lang.includes('-')) {
          detectedCountry = lang.split('-')[1].toUpperCase();
        }
      }
      setCountry(detectedCountry);
      createLinkToken(detectedCountry);
    };
    detectCountry();
  }, [createLinkToken]);

  // Handle manual country dropdown changes
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    createLinkToken(newCountry);
  };

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
    <div className="flex items-center gap-2">
      <select
        className="form-input"
        style={{ width: 'auto', padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.875rem', margin: 0, height: '42px' }}
        value={country}
        onChange={e => handleCountryChange(e.target.value)}
      >
        <option value="US">🇺🇸 United States</option>
        <option value="CA">🇨🇦 Canada</option>
        <option value="GB">🇬🇧 United Kingdom</option>
        <option value="IE">🇮🇪 Ireland</option>
        <option value="FR">🇫🇷 France</option>
        <option value="ES">🇪🇸 Spain</option>
        <option value="NL">🇳🇱 Netherlands</option>
        <option value="DE">🇩🇪 Germany</option>
        <option value="BE">🇧🇪 Belgium</option>
        <option value="IT">🇮🇹 Italy</option>
        <option value="PL">🇵🇱 Poland</option>
        <option value="SE">🇸🇪 Sweden</option>
      </select>
      <button 
        className="btn btn-secondary flex items-center gap-2" 
        onClick={() => open()} 
        disabled={!ready || !token}
        style={{ whiteSpace: 'nowrap', height: '42px' }}
      >
        <Link2 size={18} /> {token ? 'Link Bank' : 'Loading Plaid...'}
      </button>
    </div>
  );
};

export default PlaidLinkButton;
