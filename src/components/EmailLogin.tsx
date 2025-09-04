import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailLoginProps {
    onEmailSubmit: (email: string) => void;
}

const EmailLogin: React.FC<EmailLoginProps> = ({ onEmailSubmit }) => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [showValidation, setShowValidation] = useState(false);

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateEmail = (emailValue: string) => {
        const valid = emailRegex.test(emailValue);
        setIsValid(valid);
        return valid;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emailValue = e.target.value;
        setEmail(emailValue);
        setShowValidation(emailValue.length > 0);
        validateEmail(emailValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onEmailSubmit(email.toLowerCase().trim());
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        AI Code Analyzer
                    </h1>
                    <p className="text-gray-600">
                        Enter your email to start analyzing repositories
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="your.email@example.com"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    showValidation
                                        ? isValid
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                                }`}
                                autoComplete="email"
                                autoFocus
                            />
                            {showValidation && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {isValid ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {showValidation && !isValid && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Please enter a valid email address
                            </p>
                        )}
                        
                        {showValidation && isValid && (
                            <p className="mt-2 text-sm text-green-600 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Valid email address
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isValid}
                        className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        Continue to Repository Analysis
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Your email is used to maintain your analysis session</p>
                    <p>No account creation required</p>
                </div>
            </div>
        </div>
    );
};

export default EmailLogin;