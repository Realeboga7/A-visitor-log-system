// Authentication functionality with user registration
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize users in Firebase if not exists
        this.initializeDefaultAdmin();

        // Check if user was previously logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    async initializeDefaultAdmin() {
        try {
            const snapshot = await database.ref('users').once('value');
            if (!snapshot.exists()) {
                // Create default admin user if no users exist
                const adminUser = {
                    username: 'admin',
                    password: 'admin123', // In real app, this should be hashed
                    fullName: 'System Administrator',
                    email: 'admin@visitorlog.com',
                    role: 'admin',
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
                await database.ref('users/admin').set(adminUser);
                console.log('✅ Default admin user created');
            }
        } catch (error) {
            console.error('Error initializing admin:', error);
        }
    }

    async register(userData) {
        try {
            const { username, password, fullName, email } = userData;

            // Validate input
            if (!username || !password || !fullName) {
                throw new Error('Please fill in all required fields');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Check if username already exists
            const snapshot = await database.ref('users/' + username).once('value');
            if (snapshot.exists()) {
                throw new Error('Username already exists');
            }

            // Create new user
            const newUser = {
                username,
                password, // In production, this should be hashed
                fullName,
                email: email || '',
                role: 'user',
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Save to Firebase
            await database.ref('users/' + username).set(newUser);

            console.log('✅ User registered successfully');
            return true;

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            const snapshot = await database.ref('users/' + username).once('value');

            if (!snapshot.exists()) {
                throw new Error('Invalid username or password');
            }

            const user = snapshot.val();

            if (user.password !== password) {
                throw new Error('Invalid username or password');
            }

            if (user.status !== 'active') {
                throw new Error('Account is deactivated');
            }

            // Set current user (remove password from stored object)
            const { password: _, ...userWithoutPassword } = user;
            this.currentUser = userWithoutPassword;

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            console.log('✅ Login successful');
            return true;

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    async updateProfile(updateData) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const updates = {};
            if (updateData.fullName) updates.fullName = updateData.fullName;
            if (updateData.email) updates.email = updateData.email;
            if (updateData.password) updates.password = updateData.password;

            await database.ref('users/' + this.currentUser.username).update(updates);

            // Update current user
            Object.assign(this.currentUser, updateData);
            if (updateData.password) {
                delete this.currentUser.password; // Don't store password in currentUser
            }
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return true;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const snapshot = await database.ref('users').once('value');
            if (!snapshot.exists()) return [];

            const users = [];
            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();
                // Remove password from response
                const { password, ...userWithoutPassword } = user;
                users.push(userWithoutPassword);
            });

            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async updateUser(username, updateData) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Only administrators can update users');
            }

            await database.ref('users/' + username).update(updateData);
            return true;
        } catch (error) {
            console.error('User update error:', error);
            throw error;
        }
    }
}

// Create auth instance
const auth = new Auth();