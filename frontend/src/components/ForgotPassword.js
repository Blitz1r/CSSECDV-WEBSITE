// src/components/ForgotPassword.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/forgot-password.css';
import config from '../config';

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!email) {
            setErrorMessage('Please enter your email.');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/api/login/request-security`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                credentials: 'include',
            });
            
            const data = await response.json();
            
            if (response.ok && data.success && data.token) {
                // Store token and email in sessionStorage for next step
                sessionStorage.setItem('resetToken', data.token);
                sessionStorage.setItem('resetEmail', email);
                navigate('/verify-security-forgot');
            } else {
                setErrorMessage(data.message || 'Unable to find account with that email.');
            }
        } catch (err) {
            console.error('Request security error:', err);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="branding-section">
                <div className="branding-content">
                    <h1>Password Reset</h1>
                    <p>Reset your password to regain access to your account.</p>
                </div>
            </div>

            <div className="form-section">
                <div className="forgot-password-form">
                    <h2>Reset Password</h2>
                    <p>Enter your account email to proceed.</p>
                    
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Finding Account...' : 'Next'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="back-button"
                        >
                            Back to Login
                        </button>
                    </form>
                </div>
            </div>

            {errorMessage && (
                <div className="error-popup active">
                    <p>{errorMessage}</p>
                    <button onClick={() => setErrorMessage('')}>Close</button>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
