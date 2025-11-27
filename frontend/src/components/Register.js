import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import '../styles/forgot-password.css';
import config from '../config';

function Register() {
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const HandleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        setSuccess(false);
        setErrorMessage('');

        try {
            const response = await fetch(`${config.API_URL}/api/publicusers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword,
                    securityAnswer,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setErrorMessage('');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setError(true);
                setErrorMessage(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(true);
            setErrorMessage('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="branding-section">
                <div className="branding-content">
                    <h1>Create Account</h1>
                    <p>Create a new public user account</p>
                </div>
            </div>
            <div className="form-section">
                <div className="login-form">
                    <h2>Register</h2>
                    <p>Create your account with credentials.</p>
                    {success && <div className="success-message">Account created! Redirecting to login...</div>}
                    <form onSubmit={HandleSubmit}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                        />
                        <input
                            type="text"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            placeholder="Most Memorable Moment? (User Question)"
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
            {error && (
                <div className="error-popup active">
                    <p>{errorMessage}</p>
                    <button onClick={() => setError(false)}>Close</button>
                </div>
            )}
        </div>
    );
}

export default Register;