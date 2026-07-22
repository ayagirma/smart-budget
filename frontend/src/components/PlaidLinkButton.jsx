import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { Link2, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PricingModal from './PricingModal';
import { API_BASE_URL } from '../config';

const PlaidLinkButton = ({ onSuccessCallback }) => {
  const { isPro } = useApp();
  const [token, setToken] = useState(null);
  const [country, setCountry] = useState('US');
  const [showPricingModal, setShowPricingModal] = useState(false);

  const createLinkToken = useCallback(async (selectedCountry) => {
    try {
      setToken(null);
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const response = await axios.post(`${API_BASE_URL}/api/plaid/create_link_token`, { countryCode: selectedCountry }, config);
      setToken(response.data.link_token);
    } catch (err) {
      console.error('Error creating link token:', err);
    }
  }, []);

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

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    createLinkToken(newCountry);
  };

  const onSuccess = useCallback(async (public_token, metadata) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/api/plaid/set_access_token`, { public_token }, config);
      if (onSuccessCallback) onSuccessCallback();
    } catch (err) {
      console.error('Error setting access token:', err);
    }
  }, [onSuccessCallback]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
  });

  const handleBankLinkClick = () => {
    if (!isPro) {
      setShowPricingModal(true);
    } else {
      open();
    }
  };

  return (
    <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Bank Connection:
          </span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.875rem', margin: 0, height: '38px' }}
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
            className={`btn ${isPro ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
            onClick={handleBankLinkClick} 
            disabled={isPro && (!ready || !token)}
            style={{ whiteSpace: 'nowrap', height: '38px', fontSize: '0.875rem' }}
          >
            {isPro ? (
              <><Link2 size={16} /> {token ? 'Link New Account' : 'Loading Plaid...'}</>
            ) : (
              <><Crown size={16} /> Link Account (Pro Feature)</>
            )}
          </button>
        </div>

        {token && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            💡 <strong>Sandbox Test:</strong> Phone <code>415-555-0010</code> • Code <code>123456</code>
          </span>
        )}
      </div>

      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </div>
  );
};

export default PlaidLinkButton;
