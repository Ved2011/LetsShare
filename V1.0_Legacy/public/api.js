// Centralized API utility for LetsShare
const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            // Prepared for transition to httpOnly cookies
            credentials: 'include'
        };

        try {
            const response = await fetch(endpoint, config);

            if (response.status === 401) {
                // Handle expired token or unauthorized access centralized
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
                return null;
            }

            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
};

window.API = API;