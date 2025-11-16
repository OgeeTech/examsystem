

// class AuthService {
//     static BASE_URL = 'https://examsystem-ujhm.onrender.com/api';


//     static getToken() {
//         return localStorage.getItem('token');
//     }

//     static setToken(token) {
//         localStorage.setItem('token', token);
//     }

//     static getUser() {
//         const user = localStorage.getItem('user');
//         return user ? JSON.parse(user) : null;
//     }

//     static setUser(user) {
//         localStorage.setItem('user', JSON.stringify(user));
//     }

//     static isAuthenticated() {
//         return !!this.getToken();
//     }

//     static async validateSession() {
//         const token = this.getToken();
//         if (!token) {
//             return false;
//         }

//         try {
//             // Verify token is still valid with backend
//             const response = await fetch(`${this.BASE_URL}/auth/verify`, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 return data.valid;
//             }
//             return false;
//         } catch (error) {
//             console.error('Session validation failed:', error);
//             return false;
//         }
//     }

//     static async checkAuthAndRedirect() {
//         const token = this.getToken();
//         const user = this.getUser();
//         const currentPage = window.location.pathname.split('/').pop();

//         const isLoginPage = currentPage === '' || currentPage === 'index.html';

//         console.log('Auth check:', { token, user, currentPage });

//         // If no token or user → allow staying on login page
//         if (!token || !user) {
//             if (!isLoginPage) {
//                 window.location.href = 'index.html';
//             }
//             return false;
//         }

//         // Role → dashboard mapping
//         const rolePages = {
//             'admin': 'adminDashboard.html',
//             'tutor': 'tutorDashboard.html',
//             'student': 'studentDashboard.html'
//         };

//         const expectedPage = rolePages[user.role];

//         // If user is logged in and is on login page → redirect them
//         if (isLoginPage) {
//             window.location.href = expectedPage;
//             return true;
//         }

//         // If they are on the correct dashboard → allow
//         if (currentPage === expectedPage) {
//             return true;
//         }

//         // ELSE redirect to the correct dashboard (only once)
//         window.location.href = expectedPage;
//         return false;
//     }


//     static async login(email, password) {
//         try {
//             const response = await fetch(`${this.BASE_URL}/auth/login`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 throw new Error(data.message || 'Login failed');
//             }

//             this.setToken(data.token);
//             this.setUser(data.user);

//             console.log('Login successful, user role:', data.user.role);

//             // Redirect based on role
//             const rolePages = {
//                 'admin': 'adminDashboard.html',
//                 'tutor': 'tutorDashboard.html',
//                 'student': 'studentDashboard.html'
//             };

//             const redirectPage = rolePages[data.user.role] || 'index.html';
//             console.log('Redirecting to:', redirectPage);
//             window.location.href = redirectPage;

//             return data;
//         } catch (error) {
//             throw new Error(error.message);
//         }
//     }

//     static async signup(userData) {
//         try {
//             const response = await fetch(`${this.BASE_URL}/auth/signup`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(userData)
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 throw new Error(data.message || 'Signup failed');
//             }

//             this.setToken(data.token);
//             this.setUser(data.user);

//             console.log('Signup successful, user role:', data.user.role);

//             // Redirect based on role
//             const rolePages = {
//                 'admin': 'adminDashboard.html',
//                 'tutor': 'tutorDashboard.html',
//                 'student': 'studentDashboard.html'
//             };

//             const redirectPage = rolePages[data.user.role] || 'index.html';
//             console.log('Redirecting to:', redirectPage);
//             window.location.href = redirectPage;

//             return data;
//         } catch (error) {
//             throw new Error(error.message);
//         }
//     }

//     static logout() {
//         console.log('Logging out...');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         window.location.href = 'index.html';
//     }

//     static getAuthHeaders() {
//         const token = this.getToken();
//         return {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         };
//     }
// }

class AuthService {
    static BASE_URL = 'https://examsystem-ujhm.onrender.com/api';

    // ====== TOKEN + USER STORAGE ======
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

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };
    }

    // ====== SESSION VALIDATION ======
    static async validateSession() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return false;

            const data = await response.json();
            return data.valid;
        } catch (err) {
            console.error("Session validation error:", err);
            return false;
        }
    }

    // ====== AUTH REDIRECTION LOGIC ======
    static async checkAuthAndRedirect() {
        const token = this.getToken();
        const user = this.getUser();

        const currentPage = window.location.pathname.split("/").pop() || "index.html";

        const isLoginPage = currentPage === "index.html";

        const rolePages = {
            admin: "adminDashboard.html",
            tutor: "tutorDashboard.html",
            student: "studentDashboard.html"
        };

        // --- If not logged in, force login page ---
        if (!token || !user) {
            if (!isLoginPage) window.location.href = 'index.html';
            return false;
        }

        const expectedPage = rolePages[user.role];

        // --- If logged in but on login page → redirect to dashboard ---
        if (isLoginPage) {
            window.location.href = expectedPage;
            return true;
        }

        // --- If on correct dashboard → allow ---
        if (currentPage === expectedPage) {
            return true;
        }

        // --- If on wrong page → force correct dashboard ---
        window.location.href = expectedPage;
        return false;
    }

    // ====== LOGIN ======
    static async login(email, password) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Login failed");

            this.setToken(data.token);
            this.setUser(data.user);

            const rolePages = {
                admin: "adminDashboard.html",
                tutor: "tutorDashboard.html",
                student: "studentDashboard.html"
            };

            window.location.href = rolePages[data.user.role];

        } catch (err) {
            throw new Error(err.message);
        }
    }

    // ====== SIGNUP ======
    static async signup(userData) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Signup failed");

            this.setToken(data.token);
            this.setUser(data.user);

            const rolePages = {
                admin: "adminDashboard.html",
                tutor: "tutorDashboard.html",
                student: "studentDashboard.html"
            };

            window.location.href = rolePages[data.user.role];

        } catch (err) {
            throw new Error(err.message);
        }
    }
}
