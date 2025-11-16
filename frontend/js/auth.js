

// class AuthService {
//     static BASE_URL = 'https://examsystem-ujhm.onrender.com/api';

//     // ====== TOKEN + USER STORAGE ======
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

//     static logout() {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         window.location.href = 'index.html';
//     }

//     static getAuthHeaders() {
//         return {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${this.getToken()}`
//         };
//     }

//     // ====== SESSION VALIDATION ======
//     static async validateSession() {
//         const token = this.getToken();
//         if (!token) return false;

//         try {
//             const response = await fetch(`${this.BASE_URL}/auth/verify`, {
//                 method: 'GET',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (!response.ok) return false;

//             const data = await response.json();
//             return data.valid;
//         } catch (err) {
//             console.error("Session validation error:", err);
//             return false;
//         }
//     }

//     // ====== AUTH REDIRECTION LOGIC ======
//     static async checkAuthAndRedirect() {
//         const token = this.getToken();
//         const user = this.getUser();

//         const currentPage = window.location.pathname.split("/").pop() || "index.html";

//         const isLoginPage = currentPage === "index.html";

//         const rolePages = {
//             admin: "adminDashboard.html",
//             tutor: "tutorDashboard.html",
//             student: "studentDashboard.html"
//         };

//         // --- If not logged in, force login page ---
//         if (!token || !user) {
//             if (!isLoginPage) window.location.href = 'index.html';
//             return false;
//         }

//         const expectedPage = rolePages[user.role];

//         // --- If logged in but on login page → redirect to dashboard ---
//         if (isLoginPage) {
//             window.location.href = expectedPage;
//             return true;
//         }

//         // --- If on correct dashboard → allow ---
//         if (currentPage === expectedPage) {
//             return true;
//         }

//         // --- If on wrong page → force correct dashboard ---
//         window.location.href = expectedPage;
//         return false;
//     }

//     // ====== LOGIN ======
//     static async login(email, password) {
//         try {
//             const response = await fetch(`${this.BASE_URL}/auth/login`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || "Login failed");

//             this.setToken(data.token);
//             this.setUser(data.user);

//             const rolePages = {
//                 admin: "adminDashboard.html",
//                 tutor: "tutorDashboard.html",
//                 student: "studentDashboard.html"
//             };

//             window.location.href = rolePages[data.user.role];

//         } catch (err) {
//             throw new Error(err.message);
//         }
//     }

//     // ====== SIGNUP ======
//     static async signup(userData) {
//         try {
//             const response = await fetch(`${this.BASE_URL}/auth/signup`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(userData)
//             });

//             const data = await response.json();
//             if (!response.ok) throw new Error(data.message || "Signup failed");

//             this.setToken(data.token);
//             this.setUser(data.user);

//             const rolePages = {
//                 admin: "adminDashboard.html",
//                 tutor: "tutorDashboard.html",
//                 student: "studentDashboard.html"
//             };

//             window.location.href = rolePages[data.user.role];

//         } catch (err) {
//             throw new Error(err.message);
//         }
//     }
// }


class AuthService {
    static BASE_URL = 'https://examsystem-ujhm.onrender.com/api';
    static FRONTEND_URL = 'https://e-dch.netlify.app/';

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
        window.location.href = AuthService.FRONTEND_URL + 'login.html';
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
        const isLoginPage = currentPage === "login.html" || currentPage === "index.html";

        const rolePages = {
            admin: AuthService.FRONTEND_URL + "adminDashboard.html",
            tutor: AuthService.FRONTEND_URL + "tutorDashboard.html",
            student: AuthService.FRONTEND_URL + "studentDashboard.html"
        };

        if (!token || !user) {
            if (!isLoginPage) window.location.href = AuthService.FRONTEND_URL + 'login.html';
            return false;
        }

        const expectedPage = rolePages[user.role];

        if (isLoginPage) {
            window.location.href = expectedPage;
            return true;
        }

        if (window.location.href === expectedPage) return true;

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
                admin: AuthService.FRONTEND_URL + "adminDashboard.html",
                tutor: AuthService.FRONTEND_URL + "tutorDashboard.html",
                student: AuthService.FRONTEND_URL + "studentDashboard.html"
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
                admin: AuthService.FRONTEND_URL + "adminDashboard.html",
                tutor: AuthService.FRONTEND_URL + "tutorDashboard.html",
                student: AuthService.FRONTEND_URL + "studentDashboard.html"
            };

            window.location.href = rolePages[data.user.role];

        } catch (err) {
            throw new Error(err.message);
        }
    }
}
