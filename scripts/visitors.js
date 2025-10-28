// Visitor management functionality
class VisitorManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize visitor logs in localStorage as fallback
        if (!localStorage.getItem('visitorLogs')) {
            localStorage.setItem('visitorLogs', JSON.stringify([]));
        }
    }

    async logVisitor(visitorData) {
        const visitorLog = {
            id: Date.now(),
            ...visitorData,
            entryTime: new Date().toLocaleString(),
            exitTime: '',
            status: 'In',
            loggedBy: auth.currentUser.username,
            createdAt: new Date().toISOString()
        };

        try {
            // Save to Firebase
            const newVisitorRef = database.ref('visitors').push();
            await newVisitorRef.set(visitorLog);
            console.log('✅ Visitor saved to Firebase');
        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
        }

        // Save to localStorage as backup
        this.saveToLocalStorage(visitorLog);
        return visitorLog;
    }

    async checkoutVisitor(id) {
        try {
            // Update Firebase
            const visitorsRef = database.ref('visitors');
            const snapshot = await visitorsRef.orderByChild('id').equalTo(id).once('value');

            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(childSnapshot => {
                    updates[`${childSnapshot.key}/status`] = 'Out';
                    updates[`${childSnapshot.key}/exitTime`] = new Date().toLocaleString();
                });
                await visitorsRef.update(updates);
                console.log('✅ Visitor checked out in Firebase');
            }
        } catch (error) {
            console.error('❌ Error updating Firebase:', error);
        }

        // Update localStorage
        return this.checkoutLocalVisitor(id);
    }

    async loadVisitors() {
        try {
            // Try Firebase first
            const snapshot = await database.ref('visitors').once('value');
            if (snapshot.exists()) {
                const firebaseVisitors = [];
                snapshot.forEach(childSnapshot => {
                    firebaseVisitors.push(childSnapshot.val());
                });
                console.log(`✅ Loaded ${firebaseVisitors.length} visitors from Firebase`);
                return firebaseVisitors;
            }
        } catch (error) {
            console.error('❌ Error loading from Firebase:', error);
        }

        // Fallback to localStorage
        return this.getLocalLogs();
    }

    saveToLocalStorage(visitorLog) {
        const logs = this.getLocalLogs();
        logs.push(visitorLog);
        localStorage.setItem('visitorLogs', JSON.stringify(logs));
    }

    checkoutLocalVisitor(id) {
        const logs = this.getLocalLogs();
        const logIndex = logs.findIndex(log => log.id === id);

        if (logIndex !== -1) {
            logs[logIndex].status = 'Out';
            logs[logIndex].exitTime = new Date().toLocaleString();
            localStorage.setItem('visitorLogs', JSON.stringify(logs));
            return true;
        }
        return false;
    }

    getLocalLogs() {
        return JSON.parse(localStorage.getItem('visitorLogs')) || [];
    }

    async renderLogs(tableBody, searchTerm = '') {
        const logs = await this.loadVisitors();
        tableBody.innerHTML = '';

        // Sort by entry time (newest first)
        logs.sort((a, b) => b.id - a.id);

        // Filter by search term if provided
        const filteredLogs = searchTerm ? logs.filter(log =>
            log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.phone.includes(searchTerm) ||
            log.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.purpose.toLowerCase().includes(searchTerm.toLowerCase())
        ) : logs;

        if (filteredLogs.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center; color: #6c757d;">No visitors found</td>`;
            tableBody.appendChild(row);
            return;
        }

        filteredLogs.forEach(log => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${log.name}</td>
                <td>${log.phone}</td>
                <td>${log.purpose}</td>
                <td>${log.host}</td>
                <td>${log.entryTime}</td>
                <td>${log.exitTime || '-'}</td>
                <td class="status-${log.status.toLowerCase()}">${log.status}</td>
                <td>
                    ${log.status === 'In' ?
                    `<button class="action-btn checkout-btn" data-id="${log.id}">Check Out</button>` :
                    'Completed'
                }
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Bind checkout buttons
        this.bindCheckoutButtons();
    }

    bindCheckoutButtons() {
        document.querySelectorAll('.checkout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                this.checkoutVisitor(id).then(() => {
                    this.renderLogs(document.getElementById('visitor-table-body'));
                });
            });
        });
    }
}

// Create visitor manager instance
const visitorManager = new VisitorManager();