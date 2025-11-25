import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../config';

function VerifySecurityQuestion() {
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { email, securityQuestion, token } = location.state || {};

    if (!email || !securityQuestion || !token) {
        navigate('/');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.API_URL}/api/login/verify-security`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token, answer }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                try {
                    localStorage.setItem('auth', 'true');
                    localStorage.setItem('email', data.user.email);
                    localStorage.setItem('role', data.user.role);
                    window.dispatchEvent(new Event('auth-changed'));
                } catch {}
                navigate('/dashboard');
            } else {
                setError(data.message || 'Incorrect answer');
            }
        } catch (err) {
            console.error('Security verification error:', err);
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="branding-section">
                <div className="branding-content">
                    <h1>Verify Identity</h1>
                    <p>Answer your security question to continue</p>
                </div>
            </div>
            <div className="form-section">
                <div className="login-form">
                    <h2>Security Question</h2>
                    <p>{securityQuestion}</p>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Your answer"
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default VerifySecurityQuestion;