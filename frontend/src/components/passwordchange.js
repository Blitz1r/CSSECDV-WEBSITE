import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/forgot-password.css';
import config from '../config';

const PasswordChange = () => {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const [email, setEmail] = useState("")
    useEffect(() => {
        fetch(`${config.API_URL}/api/login/session`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setEmail(data.user.email);
        });
        //
    }, [] );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        
        if (!password || !confirmPassword) {
            setErrorMessage('Please fill in both password fields.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        

        // Client-side policy validation
        const minLen = Number(process.env.REACT_APP_PASSWORD_MIN_LENGTH) || 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
        const hasSpace = /\s/.test(password);

        if (password.length < minLen || !hasUpper || !hasLower || !hasDigit || !hasSpecial || hasSpace) {
            setErrorMessage(`Password must be ${minLen}+ chars with uppercase, lowercase, digit, special character, and no spaces.`);
            return;
        }
        setLoading(true);

        try {
            const response = await fetch(`${config.API_URL}/api/login/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Password reset successful! Redirecting to login...');
            } else {
                setErrorMessage(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="branding-section">
                <div className="branding-content">
                    <h1>Create New Password</h1>
                    <p>Enter a secure new password for your account.</p>
                </div>
            </div>

            <div className="form-section">
                <div className="forgot-password-form">
                    <h2>Reset Password</h2>
                    <p>Your identity has been verified. Choose a new password.</p>

                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New Password"
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="back-button"
                        >
                            Back
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

            {successMessage && (
                <div className="success-popup active">
                    <p>{successMessage}</p>
                </div>
            )}
        </div>
    );
};

export default PasswordChange;