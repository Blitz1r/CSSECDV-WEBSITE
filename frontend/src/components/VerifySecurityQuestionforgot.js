import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/forgot-password.css';
import config from '../config';

const VerifySecurityQuestionForgot = () => {
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    
    const navigate = useNavigate();

    // Handle redirect in a separate effect to avoid setState during render
    useEffect(() => {
        if (shouldRedirect) {
            navigate('/forgot-password');
        }
    }, [shouldRedirect, navigate]);

    // Main initialization effect
    useEffect(() => {
        const initialize = async () => {
            const token = sessionStorage.getItem('resetToken');
            const email = sessionStorage.getItem('resetEmail');

            // Check if missing credentials
            if (!token || !email) {
                console.warn('Missing token or email, redirecting...');
                setShouldRedirect(true);
                return; 
            }

            // If we have credentials, fetch the question
            try {
                const response = await fetch(`${config.API_URL}/api/login/security-question?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                const data = await response.json();

                if (response.ok && data.success && data.securityQuestion) {
                    setSecurityQuestion(data.securityQuestion);
                    setIsReady(true);
                } else {
                    setErrorMessage(data.message || 'Failed to retrieve security question.');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setErrorMessage('Network error. Could not load question.');
            }
        };

        initialize();
    }, []); // Remove navigate from dependencies

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!answer.trim()) {
            setErrorMessage('Please enter your answer.');
            return;
        }

        setLoading(true);
        const token = sessionStorage.getItem('resetToken');

        try {
            // FIXED: Use the correct endpoint for forgot password flow
            const response = await fetch(`${config.API_URL}/api/login/verify-security-forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, answer }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success: Move to reset password
                navigate('/reset-password');
            } else {
                // TOKEN ROTATION: If the backend sent a new token, update it
                if (data.newToken) {
                    console.log('Token rotated by server');
                    sessionStorage.setItem('resetToken', data.newToken);
                }
                
                // If the token is totally expired/invalid and no new one was sent
                if (data.message && data.message.toLowerCase().includes('expired') && !data.newToken) {
                    setErrorMessage('Session expired. Redirecting...');
                    setTimeout(() => navigate('/forgot-password'), 2000);
                } else {
                    setErrorMessage(data.message || 'Incorrect answer.');
                    setAnswer(''); // Clear answer on failure
                }
            }
        } catch (err) {
            console.error('Submission error:', err);
            setErrorMessage('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loader while checking credentials or fetching
    if (!isReady && !errorMessage && !shouldRedirect) {
        return (
            <div className="forgot-password-container">
                <div className="branding-section">
                    <div className="branding-content">
                        <h1>Loading...</h1>
                        <p>Please wait</p>
                    </div>
                </div>
            </div>
        );
    }

    // Don't render form if redirecting
    if (shouldRedirect) {
        return null;
    }

    return (
        <div className="forgot-password-container">
            <div className="branding-section">
                <div className="branding-content">
                    <h1>Security Verification</h1>
                    <p>Identity Check</p>
                </div>
            </div>

            <div className="form-section">
                <div className="forgot-password-form">
                    <h2>Security Question</h2>
                    <p>Please answer the following question:</p>

                    <form onSubmit={handleSubmit}>
                        <div className="question-display">
                            <p><strong>{securityQuestion}</strong></p>
                        </div>
                        
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Your answer"
                            required
                            autoFocus
                        />
                        
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Answer'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => {
                                sessionStorage.clear();
                                navigate('/forgot-password');
                            }}
                            className="back-button"
                        >
                            Cancel
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

export default VerifySecurityQuestionForgot;