// Main application functionality
class App {
    constructor() {
        this.auth = auth;
        this.visitorManager = visitorManager;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Auth tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.getAttribute('data-tab'));
            });
        });

        // Login
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Registration
        document.getElementById('register-btn').addEventListener('click', () => {
            this.handleRegister();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNavigation(e.currentTarget);
            });
        });

        // Log visitor
        document.getElementById('log-visitor-btn').addEventListener('click', () => {
            this.handleLogVisitor();
        });

        // Refresh logs
        document.getElementById('refresh-logs').addEventListener('click', () => {
            this.refreshLogs();
        });

        // Search visitors
        document.getElementById('search-visitors').addEventListener('input', (e) => {
            this.searchVisitors(e.target.value);
        });

        // Add user (admin)
        document.getElementById('add-user-btn').addEventListener('click', () => {
            this.showAddUserModal();
        });

        // Update profile
        document.getElementById('update-profile-btn').addEventListener('click', () => {
            this.handleUpdateProfile();
        });

        // Enter key for login
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    }

    checkAuthStatus() {
        if (this.auth.currentUser) {
            this.showAppScreen();
        } else {
            this.showLoginScreen();
        }
    }

    switchAuthTab(tab) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show corresponding form
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');

        // Clear messages
        this.clearAuthMessages();
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('login-error');

        try {
            await this.auth.login(username, password);
            this.showAppScreen();
            this.clearAuthMessages();
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        }
    }

    async handleRegister() {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const fullName = document.getElementById('reg-fullname').value;
        const email = document.getElementById('reg-email').value;
        const registerError = document.getElementById('register-error');
        const registerSuccess = document.getElementById('register-success');

        try {
            await this.auth.register({ username, password, fullName, email });

            registerSuccess.textContent = 'Account created successfully! You can now login.';
            registerSuccess.style.display = 'block';
            registerError.style.display = 'none';

            // Clear form
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-email').value = '';

            // Switch to login tab
            setTimeout(() => {
                this.switchAuthTab('login');
            }, 2000);

        } catch (error) {
            registerError.textContent = error.message;
            registerError.style.display = 'block';
            registerSuccess.style.display = 'none';
        }
    }

    handleLogout() {
        this.auth.logout();
        this.showLoginScreen();
        this.clearLoginForm();
    }

    handleNavigation(navItem) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');

        const target = navItem.getAttribute('data-target');
        document.querySelectorAll('.main-content > div').forEach(section => {
            if (section.id === target) {
                section.classList.remove('hidden');

                // Load appropriate data
                switch (target) {
                    case 'view-logs':
                        this.visitorManager.renderLogs(document.getElementById('visitor-table-body'));
                        break;
                    case 'manage-users':
                        if (this.auth.isAdmin()) {
                            this.loadUsersTable();
                        } else {
                            this.showError('Access denied. Admin rights required.');
                        }
                        break;
                    case 'user-profile':
                        this.loadUserProfile();
                        break;
                }
            } else {
                section.classList.add('hidden');
            }
        });
    }

    async handleLogVisitor() {
        const name = document.getElementById('visitor-name').value;
        const phone = document.getElementById('visitor-phone').value;
        const email = document.getElementById('visitor-email').value;
        const purpose = document.getElementById('visitor-purpose').value;
        const host = document.getElementById('host-name').value;
        const notes = document.getElementById('visitor-notes').value;
        const logSuccess = document.getElementById('log-success');

        if (!name || !phone || !host) {
            this.showError('Please fill in all required fields');
            return;
        }

        try {
            await this.visitorManager.logVisitor({ name, phone, email, purpose, host, notes });

            logSuccess.textContent = 'Visitor logged successfully!';
            logSuccess.style.display = 'block';

            // Clear form
            this.clearVisitorForm();

            // Hide success message after 3 seconds
            setTimeout(() => {
                logSuccess.style.display = 'none';
            }, 3000);

        } catch (error) {
            this.showError('Error logging visitor: ' + error.message);
        }
    }

    refreshLogs() {
        this.visitorManager.renderLogs(document.getElementById('visitor-table-body'));
    }

    searchVisitors(searchTerm) {
        this.visitorManager.renderLogs(document.getElementById('visitor-table-body'), searchTerm);
    }

    async loadUsersTable() {
        try {
            const users = await this.auth.getAllUsers();
            const tableBody = document.getElementById('users-table-body');
            tableBody.innerHTML = '';

            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email || '-'}</td>
                    <td><span class="role-${user.role}">${user.role}</span></td>
                    <td class="status-${user.status}">${user.status}</td>
                    <td>
                        ${user.username !== this.auth.currentUser.username ?
                        `<button class="action-btn edit-btn" data-user="${user.username}">Edit</button>
                             <button class="action-btn delete-btn" data-user="${user.username}">Delete</button>` :
                        'Current User'
                    }
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Bind user action buttons
            this.bindUserActions();
        } catch (error) {
            this.showError('Error loading users: ' + error.message);
        }
    }

    bindUserActions() {
        // Implement edit/delete user functionality
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.getAttribute('data-user');
                this.editUser(username);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.getAttribute('data-user');
                this.deleteUser(username);
            });
        });
    }

    loadUserProfile() {
        if (!this.auth.currentUser) return;

        document.getElementById('profile-username').value = this.auth.currentUser.username;
        document.getElementById('profile-fullname').value = this.auth.currentUser.fullName || '';
        document.getElementById('profile-email').value = this.auth.currentUser.email || '';
    }

    async handleUpdateProfile() {
        const fullName = document.getElementById('profile-fullname').value;
        const email = document.getElementById('profile-email').value;
        const password = document.getElementById('profile-password').value;
        const profileSuccess = document.getElementById('profile-success');

        try {
            const updateData = {};
            if (fullName) updateData.fullName = fullName;
            if (email) updateData.email = email;
            if (password) updateData.password = password;

            await this.auth.updateProfile(updateData);

            profileSuccess.textContent = 'Profile updated successfully!';
            profileSuccess.style.display = 'block';

            // Update UI
            this.updateUserInfo();

            setTimeout(() => {
                profileSuccess.style.display = 'none';
            }, 3000);

        } catch (error) {
            this.showError('Error updating profile: ' + error.message);
        }
    }

    updateUserInfo() {
        if (this.auth.currentUser) {
            document.getElementById('user-display-name').textContent = this.auth.currentUser.fullName || this.auth.currentUser.username;
            document.getElementById('user-role').textContent = this.auth.currentUser.role;
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
        this.clearAuthMessages();
    }

    showAppScreen() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        this.updateUserInfo();
        this.visitorManager.renderLogs(document.getElementById('visitor-table-body'));
    }

    showError(message) {
        alert(message); // In production, use a proper notification system
    }

    clearAuthMessages() {
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('register-error').style.display = 'none';
        document.getElementById('register-success').style.display = 'none';
    }

    clearLoginForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    clearVisitorForm() {
        document.getElementById('visitor-name').value = '';
        document.getElementById('visitor-phone').value = '';
        document.getElementById('visitor-email').value = '';
        document.getElementById('host-name').value = '';
        document.getElementById('visitor-notes').value = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Starting Visitor Log System...');
    window.app = new App()

});