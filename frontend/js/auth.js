

class AuthService {
    static BASE_URL = 'http://localhost:5000/api';

    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static async validateSession() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            // Verify token is still valid with backend
            const response = await fetch(`${this.BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.valid;
            }
            return false;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }

    static async checkAuthAndRedirect() {
        const token = this.getToken();
        const user = this.getUser();
        const currentPage = window.location.pathname.split('/').pop();

        console.log('Auth check:', { token, user, currentPage });

        // If no token or user, redirect to login
        if (!token || !user) {
            console.log('No token or user, redirecting to index');
            if (currentPage !== 'index.html') {
                window.location.href = 'index.html';
            }
            return false;
        }

        // Role-based redirection
        const rolePages = {
            'admin': 'adminDashboard.html',
            'tutor': 'tutorDashboard.html',
            'student': 'studentDashboard.html'
        };

        const expectedPage = rolePages[user.role];

        console.log('User role:', user.role, 'Expected page:', expectedPage, 'Current page:', currentPage);

        // If user is on wrong dashboard, redirect to correct one
        if (expectedPage && currentPage !== expectedPage) {
            console.log('Redirecting to correct dashboard:', expectedPage);
            window.location.href = expectedPage;
            return false;
        }

        console.log('Authentication successful, staying on:', currentPage);
        return true;
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.setToken(data.token);
            this.setUser(data.user);

            console.log('Login successful, user role:', data.user.role);

            // Redirect based on role
            const rolePages = {
                'admin': 'adminDashboard.html',
                'tutor': 'tutorDashboard.html',
                'student': 'studentDashboard.html'
            };

            const redirectPage = rolePages[data.user.role] || 'index.html';
            console.log('Redirecting to:', redirectPage);
            window.location.href = redirectPage;

            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async signup(userData) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            this.setToken(data.token);
            this.setUser(data.user);

            console.log('Signup successful, user role:', data.user.role);

            // Redirect based on role
            const rolePages = {
                'admin': 'adminDashboard.html',
                'tutor': 'tutorDashboard.html',
                'student': 'studentDashboard.html'
            };

            const redirectPage = rolePages[data.user.role] || 'index.html';
            console.log('Redirecting to:', redirectPage);
            window.location.href = redirectPage;

            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static logout() {
        console.log('Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
}