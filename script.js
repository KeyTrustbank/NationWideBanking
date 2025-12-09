// Nationwide Bank PLC - Digital Banking Application
// Main JavaScript File

// ============================================================================
// DATA MODEL & STATE MANAGEMENT
// ============================================================================

const AppState = {
    currentUser: null,
    currentScreen: 'loading',
    pinAttempts: 0,
    isLocked: false,
    lockoutUntil: null,
    pendingTransaction: null,
    isCardFlipped: false,
    cryptoPrices: {},
    chatHistory: []
};

// Data Models
const UserModel = {
    id: '',
    fullName: '',
    nationality: '',
    dob: '',
    email: '',
    phone: '',
    ssn: '',
    address: '',
    password: '',
    pin: '',
    accountType: '',
    accountNumber: '',
    routingNumber: '',
    card: {
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    },
    balance: 0,
    createdAt: '',
    isCardActive: true,
    isCardBlocked: false
};

const TransactionModel = {
    id: '',
    ref: '',
    type: '',
    status: '',
    amount: 0,
    currency: 'USD',
    date: '',
    from: '',
    to: '',
    method: '',
    meta: {},
    fees: 0
};

// ============================================================================
// INITIALIZATION & DATA PERSISTENCE
// ============================================================================

function initializeApp() {
    // Check if sample data exists, create if not
    if (!localStorage.getItem('bankUsers')) {
        createSampleData();
    }

    // Load crypto prices
    loadCryptoPrices();

    // Set up event listeners
    setupEventListeners();

    // Set up PIN input for login
    setupPinLogin();

    // Show loading screen first
    showScreen('loading');

    // After 2 seconds, show login screen
    setTimeout(() => {
        showScreen('login');
    }, 2000);

    // Check for existing session
    const session = getSession();
    if (session && session.userId) {
        const user = getUserById(session.userId);
        if (user) {
            AppState.currentUser = user;
            setTimeout(() => {
                showScreen('pin');
            }, 500);
        }
    }

    // Update notifications
    updateNotificationBadge();
}

function setupPinLogin() {
    // Initialize PIN input on PIN screen when it becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (document.getElementById('pinScreen').classList.contains('active')) {
                    const pinController = setupPinInput('pinScreen', (pin) => {
                        if (verifyPin(pin)) {
                            showToast('PIN verified successfully!', 'success');
                            showScreen('dashboard');
                        } else {
                            pinController.clear();
                        }
                    });
                }
            }
        });
    });

    observer.observe(document.getElementById('pinScreen'), { attributes: true });
}

function createSampleData() {
    const sampleUser = {
        id: generateId(),
        fullName: 'John Doe',
        nationality: 'US',
        dob: '1985-01-15',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        ssn: '123-45-6789',
        address: '123 Main St, Anytown, USA 12345',
        password: 'password123',
        pin: '1234',
        accountType: 'premium',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        card: {
            number: '4111111111114567',
            name: 'JOHN DOE',
            expiry: '12/26',
            cvv: '123'
        },
        balance: 5250.75,
        createdAt: new Date().toISOString(),
        isCardActive: true,
        isCardBlocked: false
    };

    const sampleTransactions = [
        {
            id: generateId(),
            ref: generateReferenceNumber(),
            type: 'deposit',
            status: 'success',
            amount: 1000,
            currency: 'USD',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            from: 'External Deposit',
            to: sampleUser.accountNumber,
            method: 'ACH Transfer',
            meta: { description: 'Initial deposit' },
            fees: 0
        },
        {
            id: generateId(),
            ref: generateReferenceNumber(),
            type: 'transfer',
            status: 'success',
            amount: 250,
            currency: 'USD',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            from: sampleUser.accountNumber,
            to: '9876543210',
            method: 'Domestic Transfer',
            meta: { recipient: 'Jane Smith', memo: 'Rent payment' },
            fees: 2.50
        },
        {
            id: generateId(),
            ref: generateReferenceNumber(),
            type: 'payment',
            status: 'success',
            amount: 89.99,
            currency: 'USD',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            from: sampleUser.accountNumber,
            to: 'ABC Electric Co.',
            method: 'Bill Payment',
            meta: { biller: 'Electric Bill', account: 'ELC-12345' },
            fees: 0
        },
        {
            id: generateId(),
            ref: generateReferenceNumber(),
            type: 'crypto',
            status: 'success',
            amount: 500,
            currency: 'USD',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            from: sampleUser.accountNumber,
            to: 'BTC Wallet',
            method: 'Crypto Purchase',
            meta: { crypto: 'BTC', amount: 0.0125, rate: 40000 },
            fees: 7.50
        },
        {
            id: generateId(),
            ref: generateReferenceNumber(),
            type: 'flight',
            status: 'success',
            amount: 850,
            currency: 'USD',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            from: sampleUser.accountNumber,
            to: 'Airline Booking',
            method: 'Flight Booking',
            meta: { from: 'JFK', to: 'LAX', passengers: 2 },
            fees: 25.00
        }
    ];

    localStorage.setItem('bankUsers', JSON.stringify([sampleUser]));
    localStorage.setItem('bankTransactions', JSON.stringify(sampleTransactions));
    localStorage.setItem('bankSession', JSON.stringify({}));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateReferenceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `REF-${year}-${random}`;
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function maskString(str, visibleChars = 4) {
    if (!str) return '';
    const masked = '*'.repeat(str.length - visibleChars);
    return masked + str.slice(-visibleChars);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validatePIN(pin) {
    return /^\d{4}$/.test(pin);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('show');
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================================================================
// SCREEN MANAGEMENT
// ============================================================================

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    const screen = document.getElementById(`${screenName}Screen`);
    if (screen) {
        screen.classList.add('active');
        AppState.currentScreen = screenName;
        
        // Update screen-specific content
        updateScreenContent(screenName);
        
        // Scroll to top when switching screens
        window.scrollTo(0, 0);
    }
}

function updateScreenContent(screenName) {
    switch(screenName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'account':
            updateAccountScreen();
            break;
        case 'transactions':
            updateTransactionsScreen();
            break;
        case 'transfer':
            updateTransferScreen();
            break;
        case 'deposit':
            updateDepositScreen();
            break;
        case 'buyCrypto':
            updateCryptoPrices();
            break;
        case 'register':
            setupRegistrationForm();
            break;
    }
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        AppState.currentUser = user;
        setSession(user.id);
        resetPinAttempts();
        showScreen('pin');
        return true;
    }
    
    return false;
}

function register(userData) {
    // Check if email already exists
    const users = getUsers();
    if (users.some(u => u.email === userData.email)) {
        return { success: false, error: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        ...UserModel,
        ...userData,
        id: generateId(),
        accountNumber: generateAccountNumber(),
        routingNumber: '021000021',
        card: generateCardDetails(userData.fullName),
        balance: 0,
        createdAt: new Date().toISOString(),
        isCardActive: true,
        isCardBlocked: false
    };
    
    users.push(newUser);
    localStorage.setItem('bankUsers', JSON.stringify(users));
    
    return { success: true, user: newUser };
}

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateCardDetails(name) {
    // Generate realistic card number (test number)
    const cardNumber = '4' + Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    
    // Generate expiry date (2-5 years from now)
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() + Math.floor(Math.random() * 3) + 2).slice(-2);
    
    // Generate CVV
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    
    return {
        number: cardNumber,
        name: name.toUpperCase(),
        expiry: `${month}/${year}`,
        cvv: cvv
    };
}

function verifyPin(pin) {
    if (AppState.isLocked) {
        const now = new Date();
        if (now < AppState.lockoutUntil) {
            const secondsLeft = Math.ceil((AppState.lockoutUntil - now) / 1000);
            showToast(`Account locked. Try again in ${secondsLeft} seconds.`, 'error');
            return false;
        } else {
            AppState.isLocked = false;
            AppState.lockoutUntil = null;
            AppState.pinAttempts = 0;
        }
    }
    
    if (AppState.currentUser && AppState.currentUser.pin === pin) {
        resetPinAttempts();
        return true;
    }
    
    AppState.pinAttempts++;
    
    if (AppState.pinAttempts >= 5) {
        AppState.isLocked = true;
        AppState.lockoutUntil = new Date(Date.now() + 30 * 1000); // 30 seconds lockout
        showToast('Too many failed attempts. Account locked for 30 seconds.', 'error');
        return false;
    }
    
    const attemptsLeft = 5 - AppState.pinAttempts;
    showToast(`Incorrect PIN. ${attemptsLeft} attempts remaining.`, 'error');
    return false;
}

function resetPinAttempts() {
    AppState.pinAttempts = 0;
    AppState.isLocked = false;
    AppState.lockoutUntil = null;
}

function setSession(userId) {
    const session = {
        userId,
        lastAuthTime: new Date().toISOString()
    };
    localStorage.setItem('bankSession', JSON.stringify(session));
}

function getSession() {
    const session = localStorage.getItem('bankSession');
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    localStorage.removeItem('bankSession');
    AppState.currentUser = null;
}

function getUsers() {
    const users = localStorage.getItem('bankUsers');
    return users ? JSON.parse(users) : [];
}

function getUserById(id) {
    const users = getUsers();
    return users.find(u => u.id === id);
}

function updateUser(user) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('bankUsers', JSON.stringify(users));
        AppState.currentUser = user;
        return true;
    }
    return false;
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

function createTransaction(transactionData) {
    const transaction = {
        ...TransactionModel,
        ...transactionData,
        id: generateId(),
        ref: generateReferenceNumber(),
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    return transaction;
}

function saveTransaction(transaction) {
    const transactions = getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem('bankTransactions', JSON.stringify(transactions));
    return transaction;
}

function getTransactions(userId = null, limit = 50) {
    const transactions = localStorage.getItem('bankTransactions');
    let allTransactions = transactions ? JSON.parse(transactions) : [];
    
    if (userId) {
        allTransactions = allTransactions.filter(t => 
            t.from === userId || t.to === userId
        );
    }
    
    return allTransactions.slice(0, limit);
}

function getUserTransactions() {
    if (!AppState.currentUser) return [];
    return getTransactions().filter(t => 
        t.from === AppState.currentUser.accountNumber || 
        t.to === AppState.currentUser.accountNumber
    );
}

function deductBalance(amount, fees = 0) {
    if (!AppState.currentUser) return false;
    
    const total = amount + fees;
    if (AppState.currentUser.balance < total) {
        return false;
    }
    
    AppState.currentUser.balance -= total;
    return updateUser(AppState.currentUser);
}

function addBalance(amount) {
    if (!AppState.currentUser) return false;
    
    AppState.currentUser.balance += amount;
    return updateUser(AppState.currentUser);
}

// ============================================================================
// SCREEN UPDATES
// ============================================================================

function updateDashboard() {
    if (!AppState.currentUser) return;
    
    // Update welcome message
    const firstName = AppState.currentUser.fullName.split(' ')[0];
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${firstName}!`;
    
    // Update balance
    document.getElementById('currentBalance').textContent = 
        formatCurrency(AppState.currentUser.balance);
    
    // Update card details
    document.getElementById('cardNumber').textContent = 
        maskString(AppState.currentUser.card.number, 4);
    document.getElementById('cardHolder').textContent = 
        AppState.currentUser.card.name;
    document.getElementById('cardExpiry').textContent = 
        AppState.currentUser.card.expiry;
    document.getElementById('cardCVV').textContent = '•••';
    
    // Update recent transactions
    updateRecentTransactions();
    
    // Update menu user info
    document.getElementById('menuUserName').textContent = 
        AppState.currentUser.fullName;
    document.getElementById('menuUserEmail').textContent = 
        AppState.currentUser.email;
    
    // Update card status
    updateCardStatus();
}

function updateRecentTransactions() {
    const transactions = getUserTransactions().slice(0, 5);
    const container = document.getElementById('transactionsList');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    transactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        container.appendChild(transactionEl);
    });
}

function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.dataset.id = transaction.id;
    
    const icon = getTransactionIcon(transaction.type);
    const amountClass = transaction.type === 'deposit' ? 'positive' : 'negative';
    const amountPrefix = transaction.type === 'deposit' ? '+' : '-';
    
    div.innerHTML = `
        <div class="transaction-icon" style="background: ${icon.color}">
            <i class="${icon.icon}"></i>
        </div>
        <div class="transaction-info">
            <div class="transaction-title">${getTransactionTitle(transaction)}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
        </div>
        <div class="transaction-amount ${amountClass}">
            ${amountPrefix}${formatCurrency(transaction.amount)}
        </div>
    `;
    
    div.addEventListener('click', () => showTransactionReceipt(transaction));
    
    return div;
}

function getTransactionIcon(type) {
    const icons = {
        deposit: { icon: 'fas fa-money-bill-wave', color: '#00d68f' },
        transfer: { icon: 'fas fa-exchange-alt', color: '#6a11cb' },
        payment: { icon: 'fas fa-file-invoice-dollar', color: '#ff6b6b' },
        crypto: { icon: 'fab fa-bitcoin', color: '#f9d423' },
        flight: { icon: 'fas fa-plane', color: '#36d1dc' }
    };
    return icons[type] || { icon: 'fas fa-exchange-alt', color: '#6a11cb' };
}

function getTransactionTitle(transaction) {
    const titles = {
        deposit: 'Deposit',
        transfer: transaction.method.includes('Domestic') ? 'Domestic Transfer' : 'International Transfer',
        payment: 'Bill Payment',
        crypto: 'Crypto Purchase',
        flight: 'Flight Booking'
    };
    return titles[transaction.type] || 'Transaction';
}

function updateAccountScreen() {
    if (!AppState.currentUser) return;
    
    const user = AppState.currentUser;
    
    // Update personal info
    document.getElementById('infoFullName').textContent = user.fullName;
    document.getElementById('infoNationality').textContent = 
        getCountryName(user.nationality);
    document.getElementById('infoDOB').textContent = 
        new Date(user.dob).toLocaleDateString();
    document.getElementById('infoSSN').textContent = maskString(user.ssn, 4);
    document.getElementById('infoAddress').textContent = user.address;
    
    // Update contact info
    document.getElementById('infoEmail').textContent = user.email;
    document.getElementById('infoPhone').textContent = user.phone;
    
    // Update account info
    document.getElementById('infoAccountType').textContent = 
        user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1);
    document.getElementById('infoAccountNumberFull').textContent = user.accountNumber;
    document.getElementById('infoRoutingNumber').textContent = user.routingNumber;
    
    // Update card info
    document.getElementById('infoCardNumber').textContent = 
        maskString(user.card.number, 4);
    document.getElementById('infoCardHolder').textContent = user.card.name;
    document.getElementById('infoCardExpiry').textContent = user.card.expiry;
}

function getCountryName(code) {
    const countries = {
        US: 'United States',
        UK: 'United Kingdom',
        CA: 'Canada',
        AU: 'Australia',
        DE: 'Germany'
    };
    return countries[code] || code;
}

function updateTransactionsScreen() {
    const transactions = getUserTransactions();
    const container = document.getElementById('transactionsHistory');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    transactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        container.appendChild(transactionEl);
    });
}

function updateTransferScreen() {
    // Reset forms
    document.getElementById('domesticTransferForm').classList.add('active');
    document.getElementById('internationalTransferForm').classList.remove('active');
    
    // Update summary calculations
    updateTransferSummary('domestic');
    updateTransferSummary('international');
}

function updateDepositScreen() {
    // Update deposit method details
    updateDepositMethodDetails();
}

function updateCryptoPrices() {
    const container = document.getElementById('cryptoList');
    if (!container) return;
    
    const prices = AppState.cryptoPrices;
    container.innerHTML = '';
    
    Object.entries(prices).forEach(([crypto, data]) => {
        const div = document.createElement('div');
        div.className = 'crypto-item';
        div.innerHTML = `
            <div class="crypto-info">
                <div class="crypto-name">${crypto}</div>
                <div class="crypto-fullname">${data.name}</div>
            </div>
            <div class="crypto-price">
                <div class="price">${formatCurrency(data.price)}</div>
                <div class="change ${data.change >= 0 ? 'positive' : 'negative'}">
                    ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function loadCryptoPrices() {
    // Simulated crypto prices
    AppState.cryptoPrices = {
        BTC: { name: 'Bitcoin', price: 42567.89, change: 2.34 },
        ETH: { name: 'Ethereum', price: 3256.78, change: 1.56 },
        USDT: { name: 'Tether', price: 1.00, change: 0.00 },
        BNB: { name: 'BNB', price: 312.45, change: -0.45 },
        SOL: { name: 'Solana', price: 98.76, change: 3.21 },
        XRP: { name: 'XRP', price: 0.56, change: 0.89 },
        ADA: { name: 'Cardano', price: 0.45, change: -1.23 },
        DOGE: { name: 'Dogecoin', price: 0.12, change: 5.67 }
    };
}

function updateNotificationBadge() {
    // Simulate notifications
    const badge = document.querySelector('.notification-badge .badge');
    if (badge) {
        badge.textContent = '3';
    }
}

// ============================================================================
// CARD INTERACTIONS
// ============================================================================

function setupCardInteractions() {
    const virtualCard = document.getElementById('virtualCard');
    const showCVV = document.getElementById('showCVV');
    
    if (virtualCard) {
        virtualCard.addEventListener('click', (e) => {
            // Don't flip if clicking on CVV button
            if (!e.target.closest('.show-cvv-btn')) {
                virtualCard.classList.toggle('flipped');
                AppState.isCardFlipped = !AppState.isCardFlipped;
                
                // Update CVV button text when flipping back
                if (!AppState.isCardFlipped && showCVV) {
                    const cvvElement = document.getElementById('cardCVV');
                    if (cvvElement.textContent !== '•••') {
                        cvvElement.textContent = '•••';
                        showCVV.innerHTML = '<i class="fas fa-eye"></i> Show';
                    }
                }
            }
        });
    }
    
    if (showCVV) {
        showCVV.addEventListener('click', (e) => {
            e.stopPropagation();
            if (AppState.currentUser) {
                const cvvElement = document.getElementById('cardCVV');
                if (cvvElement.textContent === '•••') {
                    cvvElement.textContent = AppState.currentUser.card.cvv;
                    showCVV.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
                    
                    // Auto-hide CVV after 5 seconds
                    setTimeout(() => {
                        if (cvvElement.textContent !== '•••') {
                            cvvElement.textContent = '•••';
                            showCVV.innerHTML = '<i class="fas fa-eye"></i> Show';
                        }
                    }, 5000);
                } else {
                    cvvElement.textContent = '•••';
                    showCVV.innerHTML = '<i class="fas fa-eye"></i> Show';
                }
            }
        });
    }
    
    // Card control buttons
    const freezeCardBtn = document.getElementById('freezeCard');
    const blockCardBtn = document.getElementById('blockCard');
    const viewCardDetailsBtn = document.getElementById('viewCardDetails');
    
    if (freezeCardBtn && AppState.currentUser) {
        freezeCardBtn.addEventListener('click', () => {
            AppState.currentUser.isCardActive = !AppState.currentUser.isCardActive;
            updateUser(AppState.currentUser);
            showToast(
                AppState.currentUser.isCardActive ? 
                'Card unfrozen successfully' : 
                'Card frozen successfully',
                'success'
            );
            updateCardStatus();
        });
    }
    
    if (blockCardBtn && AppState.currentUser) {
        blockCardBtn.addEventListener('click', () => {
            AppState.currentUser.isCardBlocked = !AppState.currentUser.isCardBlocked;
            updateUser(AppState.currentUser);
            showToast(
                AppState.currentUser.isCardBlocked ? 
                'Card blocked successfully' : 
                'Card unblocked successfully',
                AppState.currentUser.isCardBlocked ? 'warning' : 'success'
            );
            updateCardStatus();
        });
    }
    
    if (viewCardDetailsBtn) {
        viewCardDetailsBtn.addEventListener('click', () => {
            showScreen('account');
        });
    }
}

function updateCardStatus() {
    if (!AppState.currentUser) return;
    
    const freezeCardBtn = document.getElementById('freezeCard');
    const blockCardBtn = document.getElementById('blockCard');
    
    if (freezeCardBtn) {
        if (AppState.currentUser.isCardActive) {
            freezeCardBtn.innerHTML = '<i class="fas fa-snowflake"></i> Freeze Card';
            freezeCardBtn.style.background = '';
            freezeCardBtn.style.color = '';
        } else {
            freezeCardBtn.innerHTML = '<i class="fas fa-fire"></i> Unfreeze Card';
            freezeCardBtn.style.background = 'var(--warning-color)';
            freezeCardBtn.style.color = 'white';
        }
    }
    
    if (blockCardBtn) {
        if (AppState.currentUser.isCardBlocked) {
            blockCardBtn.innerHTML = '<i class="fas fa-unlock"></i> Unblock Card';
            blockCardBtn.style.background = 'var(--error-color)';
            blockCardBtn.style.color = 'white';
        } else {
            blockCardBtn.innerHTML = '<i class="fas fa-ban"></i> Block Card';
            blockCardBtn.style.background = '';
            blockCardBtn.style.color = '';
        }
    }
}

// ============================================================================
// PIN INPUT MANAGEMENT
// ============================================================================

function setupPinInput(pinContainerId, onSubmit) {
    const container = document.getElementById(pinContainerId);
    if (!container) return;
    
    const digits = container.querySelectorAll('.pin-digit-display');
    const status = container.querySelector('.pin-status');
    const keypad = container.querySelector('.pin-keypad');
    
    let pin = '';
    
    function updateDisplay() {
        digits.forEach((digit, index) => {
            if (index < pin.length) {
                digit.textContent = '●';
                digit.classList.add('filled');
            } else {
                digit.textContent = '●';
                digit.classList.remove('filled');
            }
        });
        
        status.textContent = pin.length === 4 ? 'Ready to submit' : 'Enter PIN';
        
        // Enable/disable submit button
        const submitBtn = keypad.querySelector('.keypad-submit');
        if (submitBtn) {
            submitBtn.disabled = pin.length !== 4;
        }
    }
    
    function addDigit(digit) {
        if (pin.length < 4) {
            pin += digit;
            updateDisplay();
            
            if (pin.length === 4) {
                setTimeout(() => {
                    if (onSubmit) {
                        onSubmit(pin);
                    }
                }, 300);
            }
        }
    }
    
    function removeDigit() {
        if (pin.length > 0) {
            pin = pin.slice(0, -1);
            updateDisplay();
        }
    }
    
    // Setup keypad listeners
    keypad.querySelectorAll('.keypad-key').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.key;
            
            if (key === 'clear') {
                removeDigit();
            } else if (key === 'submit') {
                if (pin.length === 4 && onSubmit) {
                    onSubmit(pin);
                }
            } else if (/^\d$/.test(key)) {
                addDigit(key);
            }
        });
    });
    
    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        if (!container.closest('.screen.active')) return;
        
        if (/^\d$/.test(e.key)) {
            addDigit(e.key);
        } else if (e.key === 'Backspace') {
            removeDigit();
        } else if (e.key === 'Enter' && pin.length === 4) {
            if (onSubmit) {
                onSubmit(pin);
            }
        }
    });
    
    // Clear PIN function
    return {
        clear: () => {
            pin = '';
            updateDisplay();
        },
        setPin: (newPin) => {
            pin = newPin;
            updateDisplay();
        }
    };
}

// ============================================================================
// TRANSACTION PROCESSING
// ============================================================================

function processTransaction(transactionType, transactionData) {
    // Store pending transaction
    AppState.pendingTransaction = {
        type: transactionType,
        data: transactionData,
        timestamp: Date.now()
    };
    
    // Show PIN verification modal
    showPinVerificationModal(transactionType, transactionData);
}

function showPinVerificationModal(transactionType, transactionData) {
    const modal = document.getElementById('pinModal');
    const typeElement = document.getElementById('modalTransactionType');
    const amountElement = document.getElementById('modalTransactionAmount');
    const feeElement = document.getElementById('modalTransactionFee');
    const totalElement = document.getElementById('modalTransactionTotal');
    
    if (!modal || !typeElement || !amountElement || !feeElement || !totalElement) return;
    
    // Update modal content
    typeElement.textContent = getTransactionTypeName(transactionType);
    amountElement.textContent = formatCurrency(transactionData.amount);
    
    const fees = transactionData.fees || calculateFees(transactionType, transactionData.amount);
    const total = transactionData.amount + fees;
    
    feeElement.textContent = formatCurrency(fees);
    totalElement.textContent = formatCurrency(total);
    
    // Show modal
    modal.classList.add('active');
    
    // Setup PIN input
    const pinController = setupPinInput('pinModal', (pin) => {
        if (verifyPin(pin)) {
            modal.classList.remove('active');
            pinController.clear();
            
            // Show loading animation
            showLoadingModal();
            
            // Process transaction after delay
            setTimeout(() => {
                completeTransaction(transactionType, transactionData);
                hideLoadingModal();
            }, 3000);
        } else {
            pinController.clear();
        }
    });
}

function getTransactionTypeName(type) {
    const names = {
        deposit: 'Deposit',
        transfer: 'Transfer',
        domestic: 'Domestic Transfer',
        international: 'International Transfer',
        payment: 'Bill Payment',
        crypto: 'Crypto Purchase',
        flight: 'Flight Booking'
    };
    return names[type] || 'Transaction';
}

function calculateFees(transactionType, amount) {
    switch(transactionType) {
        case 'domestic':
            return amount * 0.01; // 1% fee
        case 'international':
            return 35.00 + (amount * 0.02); // $35 + 2%
        case 'crypto':
            return 2.49; // Fixed fee
        case 'flight':
            return 25.00; // Fixed fee
        default:
            return 0;
    }
}

function completeTransaction(transactionType, transactionData) {
    let success = false;
    let transaction = null;
    
    switch(transactionType) {
        case 'deposit':
            success = addBalance(transactionData.amount);
            if (success) {
                transaction = createTransaction({
                    type: 'deposit',
                    amount: transactionData.amount,
                    from: 'External',
                    to: AppState.currentUser.accountNumber,
                    method: transactionData.method,
                    meta: { description: transactionData.memo }
                });
                transaction.status = 'success';
                saveTransaction(transaction);
            }
            break;
            
        case 'domestic':
        case 'international':
            const fees = calculateFees(transactionType, transactionData.amount);
            success = deductBalance(transactionData.amount, fees);
            if (success) {
                transaction = createTransaction({
                    type: 'transfer',
                    amount: transactionData.amount,
                    from: AppState.currentUser.accountNumber,
                    to: transactionData.toAccount,
                    method: `${transactionType === 'domestic' ? 'Domestic' : 'International'} Transfer`,
                    fees: fees,
                    meta: {
                        recipient: transactionData.recipientName,
                        memo: transactionData.memo
                    }
                });
                transaction.status = 'success';
                saveTransaction(transaction);
            }
            break;
            
        case 'payment':
            success = deductBalance(transactionData.amount);
            if (success) {
                transaction = createTransaction({
                    type: 'payment',
                    amount: transactionData.amount,
                    from: AppState.currentUser.accountNumber,
                    to: transactionData.biller,
                    method: 'Bill Payment',
                    meta: {
                        biller: transactionData.biller,
                        account: transactionData.accountNumber
                    }
                });
                transaction.status = 'success';
                saveTransaction(transaction);
            }
            break;
            
        case 'crypto':
            const cryptoFees = 2.49;
            success = deductBalance(transactionData.amount, cryptoFees);
            if (success) {
                transaction = createTransaction({
                    type: 'crypto',
                    amount: transactionData.amount,
                    from: AppState.currentUser.accountNumber,
                    to: 'Crypto Exchange',
                    method: 'Crypto Purchase',
                    fees: cryptoFees,
                    meta: {
                        crypto: transactionData.crypto,
                        amount: transactionData.cryptoAmount,
                        rate: transactionData.rate
                    }
                });
                transaction.status = 'success';
                saveTransaction(transaction);
            }
            break;
            
        case 'flight':
            const flightFees = 25.00;
            success = deductBalance(transactionData.amount, flightFees);
            if (success) {
                transaction = createTransaction({
                    type: 'flight',
                    amount: transactionData.amount,
                    from: AppState.currentUser.accountNumber,
                    to: 'Airline',
                    method: 'Flight Booking',
                    fees: flightFees,
                    meta: {
                        from: transactionData.from,
                        to: transactionData.to,
                        passengers: transactionData.passengers,
                        date: transactionData.date
                    }
                });
                transaction.status = 'success';
                saveTransaction(transaction);
            }
            break;
    }
    
    if (success && transaction) {
        // Update user balance
        updateUser(AppState.currentUser);
        
        // Show success toast
        showToast('Transaction completed successfully!', 'success');
        
        // Show receipt
        showTransactionReceipt(transaction);
        
        // Update dashboard
        updateDashboard();
    } else {
        showToast('Transaction failed. Please try again.', 'error');
    }
    
    return success;
}

function showTransactionReceipt(transaction) {
    const modal = document.getElementById('receiptModal');
    const content = document.getElementById('receiptContent');
    
    if (!modal || !content) return;
    
    // Generate receipt content
    content.innerHTML = generateReceiptHTML(transaction);
    
    // Show modal
    modal.classList.add('active');
}

function generateReceiptHTML(transaction) {
    return `
        <div class="receipt-header">
            <h3>Nationwide Bank PLC</h3>
            <p>Transaction Receipt</p>
        </div>
        
        <div class="receipt-details">
            <div class="receipt-item">
                <span>Reference Number:</span>
                <span>${transaction.ref}</span>
            </div>
            <div class="receipt-item">
                <span>Date & Time:</span>
                <span>${formatDate(transaction.date)}</span>
            </div>
            <div class="receipt-item">
                <span>Transaction Type:</span>
                <span>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
            </div>
            <div class="receipt-item">
                <span>Status:</span>
                <span class="status-${transaction.status}">${transaction.status.toUpperCase()}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-item">
                <span>Amount:</span>
                <span>${formatCurrency(transaction.amount)}</span>
            </div>
            ${transaction.fees ? `
            <div class="receipt-item">
                <span>Fees:</span>
                <span>${formatCurrency(transaction.fees)}</span>
            </div>
            ` : ''}
            <div class="receipt-item total">
                <span>Total:</span>
                <span>${formatCurrency(transaction.amount + (transaction.fees || 0))}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-item">
                <span>From:</span>
                <span>${transaction.from}</span>
            </div>
            <div class="receipt-item">
                <span>To:</span>
                <span>${transaction.to}</span>
            </div>
            <div class="receipt-item">
                <span>Method:</span>
                <span>${transaction.method}</span>
            </div>
            
            ${Object.entries(transaction.meta || {}).map(([key, value]) => `
                <div class="receipt-item">
                    <span>${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                    <span>${value}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="receipt-footer">
            <p>Thank you for banking with Nationwide Bank PLC</p>
            <p class="receipt-note">This is an electronic receipt. Please keep it for your records.</p>
        </div>
    `;
}

function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================================================
// FORM HANDLERS
// ============================================================================

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Show register link
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('register');
        });
    }
    
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateBack();
        });
    });
    
    // Hamburger menu
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('hamburgerMenu').classList.add('active');
        });
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', () => {
            document.getElementById('hamburgerMenu').classList.remove('active');
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            document.getElementById('hamburgerMenu').classList.remove('active');
        });
    }
    
    // Menu navigation
    document.querySelectorAll('.menu-item[data-screen]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screen = item.dataset.screen;
            if (screen === 'dashboard' && item.classList.contains('active')) {
                // Already on dashboard, just close menu
                document.getElementById('hamburgerMenu').classList.remove('active');
                return;
            }
            document.getElementById('hamburgerMenu').classList.remove('active');
            showScreen(screen);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            showScreen('login');
            showToast('Logged out successfully', 'success');
        });
    }
    
    // Quick action buttons
    document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Card interactions
    setupCardInteractions();
    
    // Transfer mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.transfer-form').forEach(form => {
                form.classList.remove('active');
            });
            
            document.getElementById(`${mode}TransferForm`).classList.add('active');
        });
    });
    
    // Form submissions
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', handleDeposit);
    }
    
    const domesticTransferForm = document.getElementById('domesticTransferForm');
    if (domesticTransferForm) {
        domesticTransferForm.addEventListener('submit', handleDomesticTransfer);
    }
    
    const internationalTransferForm = document.getElementById('internationalTransferForm');
    if (internationalTransferForm) {
        internationalTransferForm.addEventListener('submit', handleInternationalTransfer);
    }
    
    const payBillsForm = document.getElementById('payBillsForm');
    if (payBillsForm) {
        payBillsForm.addEventListener('submit', handlePayBills);
    }
    
    const buyCryptoForm = document.getElementById('buyCryptoForm');
    if (buyCryptoForm) {
        buyCryptoForm.addEventListener('submit', handleBuyCrypto);
    }
    
    const bookFlightForm = document.getElementById('bookFlightForm');
    if (bookFlightForm) {
        bookFlightForm.addEventListener('submit', handleBookFlight);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            if (e.target === element || e.target.closest('.modal-close')) {
                element.closest('.modal-overlay').classList.remove('active');
            }
        });
    });
    
    // Close receipt button
    const closeReceiptBtn = document.getElementById('closeReceiptBtn');
    if (closeReceiptBtn) {
        closeReceiptBtn.addEventListener('click', () => {
            document.getElementById('receiptModal').classList.remove('active');
        });
    }
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentNode.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Form input validation
    setupFormValidation();
    
    // Balance refresh button
    const refreshBalance = document.getElementById('refreshBalance');
    if (refreshBalance) {
        refreshBalance.addEventListener('click', () => {
            if (AppState.currentUser) {
                refreshBalance.classList.add('rotating');
                setTimeout(() => {
                    updateDashboard();
                    refreshBalance.classList.remove('rotating');
                    showToast('Balance updated', 'success');
                }, 1000);
            }
        });
    }
    
    // Tips refresh button
    const refreshTips = document.getElementById('refreshTips');
    if (refreshTips) {
        refreshTips.addEventListener('click', () => {
            refreshTips.classList.add('rotating');
            setTimeout(() => {
                rotateTips();
                refreshTips.classList.remove('rotating');
                showToast('Tips refreshed', 'success');
            }, 500);
        });
    }
}

function setupRegistrationForm() {
    // Clear any existing PIN values
    for (let i = 1; i <= 4; i++) {
        const pinInput = document.getElementById(`pin${i}`);
        if (pinInput) pinInput.value = '';
    }
    
    // Set up PIN input auto-advance
    const pinInputs = document.querySelectorAll('.pin-digit');
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            
            // Validate PIN as user types
            validateRegistrationPIN();
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });
}

function validateRegistrationPIN() {
    const pin1 = document.getElementById('pin1').value;
    const pin2 = document.getElementById('pin2').value;
    const pin3 = document.getElementById('pin3').value;
    const pin4 = document.getElementById('pin4').value;
    
    const pin = pin1 + pin2 + pin3 + pin4;
    const pinError = document.getElementById('pinError');
    
    if (pin.length === 4 && !/^\d{4}$/.test(pin)) {
        pinError.textContent = 'PIN must contain only digits';
        pinError.classList.add('show');
        return false;
    } else {
        pinError.classList.remove('show');
        return true;
    }
}

function rotateTips() {
    const tips = document.querySelectorAll('.tip-card');
    const dots = document.querySelectorAll('.dot');
    
    let currentActive = 0;
    tips.forEach((tip, index) => {
        if (tip.classList.contains('active')) {
            currentActive = index;
        }
        tip.classList.remove('active');
    });
    
    dots.forEach(dot => dot.classList.remove('active'));
    
    let nextActive = (currentActive + 1) % tips.length;
    tips[nextActive].classList.add('active');
    dots[nextActive].classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Clear errors
    hideError('loginEmailError');
    hideError('loginPasswordError');
    
    // Validate
    let isValid = true;
    
    if (!validateEmail(email)) {
        showError('loginEmailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showError('loginPasswordError', 'Please enter your password');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Attempt login
    if (login(email, password)) {
        showToast('Login successful! Please enter your PIN.', 'success');
    } else {
        showError('loginPasswordError', 'Invalid email or password');
        showToast('Login failed. Please check your credentials.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    // Clear all errors first
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    
    // Collect form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        nationality: document.getElementById('nationality').value,
        dob: document.getElementById('dob').value,
        ssn: document.getElementById('ssn').value.trim(),
        address: document.getElementById('address').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        pin: Array.from({length: 4}, (_, i) => 
            document.getElementById(`pin${i+1}`).value
        ).join(''),
        accountType: document.getElementById('accountType').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
    // Validate
    if (!validateRegistration(formData)) return;
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        showToast('Passwords do not match', 'error');
        return;
    }
    
    // Check if email already exists
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === formData.email)) {
        showError('emailError', 'Email already registered');
        showToast('Email already registered. Please use a different email.', 'error');
        return;
    }
    
    // Register user
    const result = register({
        fullName: formData.fullName,
        nationality: formData.nationality,
        dob: formData.dob,
        ssn: formData.ssn,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        pin: formData.pin,
        accountType: formData.accountType
    });
    
    if (result.success) {
        showToast('Account created successfully! Please login.', 'success');
        
        // Auto-fill login form
        document.getElementById('loginEmail').value = formData.email;
        document.getElementById('loginPassword').value = formData.password;
        
        // Clear registration form
        registerForm.reset();
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`pin${i}`).value = '';
        }
        
        // Show login screen after delay
        setTimeout(() => {
            showScreen('login');
        }, 1500);
    } else {
        showToast(result.error, 'error');
    }
}

function validateRegistration(formData) {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = [
        { id: 'fullName', name: 'Full Name', value: formData.fullName },
        { id: 'nationality', name: 'Nationality', value: formData.nationality },
        { id: 'dob', name: 'Date of Birth', value: formData.dob },
        { id: 'ssn', name: 'SSN', value: formData.ssn },
        { id: 'address', name: 'Address', value: formData.address },
        { id: 'email', name: 'Email', value: formData.email },
        { id: 'phone', name: 'Phone', value: formData.phone },
        { id: 'password', name: 'Password', value: formData.password },
        { id: 'confirmPassword', name: 'Confirm Password', value: formData.confirmPassword },
        { id: 'accountType', name: 'Account Type', value: formData.accountType }
    ];
    
    requiredFields.forEach(field => {
        if (!field.value) {
            showError(`${field.id}Error`, `${field.name} is required`);
            isValid = false;
        }
    });
    
    // Validate email
    if (formData.email && !validateEmail(formData.email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password
    if (formData.password && !validatePassword(formData.password)) {
        showError('passwordError', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    // Validate PIN
    if (formData.pin && !validatePIN(formData.pin)) {
        showError('pinError', 'PIN must be 4 digits');
        isValid = false;
    }
    
    // Validate SSN format
    if (formData.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)) {
        showError('ssnError', 'SSN must be in format 123-45-6789');
        isValid = false;
    }
    
    // Validate age (must be 18+)
    if (formData.dob) {
        const dob = new Date(formData.dob);
        const age = new Date().getFullYear() - dob.getFullYear();
        if (age < 18) {
            showError('dobError', 'You must be at least 18 years old');
            isValid = false;
        }
    }
    
    return isValid;
}

function handleQuickAction(action) {
    switch(action) {
        case 'deposit':
            showScreen('deposit');
            break;
        case 'transfer':
            showScreen('transfer');
            break;
        case 'payBills':
            showScreen('payBills');
            break;
        case 'bookFlight':
            showScreen('bookFlight');
            break;
        case 'buyCrypto':
            showScreen('buyCrypto');
            break;
        case 'support':
            showScreen('support');
            break;
    }
}

function handleDeposit(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const type = document.getElementById('depositType').value;
    const memo = document.getElementById('depositMemo').value;
    
    if (!amount || amount < 1) {
        showToast('Please enter a valid amount (minimum $1)', 'error');
        return;
    }
    
    if (!type) {
        showToast('Please select a deposit method', 'error');
        return;
    }
    
    processTransaction('deposit', {
        amount: amount,
        method: type,
        memo: memo
    });
}

function handleDomesticTransfer(e) {
    e.preventDefault();
    
    const formData = {
        recipientName: document.getElementById('domesticName').value,
        toAccount: document.getElementById('domesticAccount').value,
        routingNumber: document.getElementById('domesticRouting').value,
        amount: parseFloat(document.getElementById('domesticAmount').value),
        method: document.querySelector('input[name="domesticMethod"]:checked').value,
        memo: document.getElementById('domesticMemo').value
    };
    
    if (!validateDomesticTransfer(formData)) return;
    
    processTransaction('domestic', formData);
}

function handleInternationalTransfer(e) {
    e.preventDefault();
    
    const formData = {
        recipientName: document.getElementById('internationalName').value,
        toAccount: document.getElementById('internationalIBAN').value,
        swift: document.getElementById('internationalSWIFT').value,
        amount: parseFloat(document.getElementById('internationalAmount').value),
        currency: document.getElementById('internationalCurrency').value,
        memo: document.getElementById('internationalMemo').value
    };
    
    if (!validateInternationalTransfer(formData)) return;
    
    processTransaction('international', formData);
}

function handlePayBills(e) {
    e.preventDefault();
    
    const formData = {
        biller: document.getElementById('billerName').value,
        accountNumber: document.getElementById('billerAccount').value,
        amount: parseFloat(document.getElementById('billAmount').value),
        dueDate: document.getElementById('billDueDate').value,
        memo: document.getElementById('billMemo').value
    };
    
    if (!validateBillPayment(formData)) return;
    
    processTransaction('payment', formData);
}

function handleBuyCrypto(e) {
    e.preventDefault();
    
    const crypto = document.getElementById('cryptoCurrency').value;
    const amount = parseFloat(document.getElementById('cryptoAmount').value);
    
    if (!crypto) {
        showToast('Please select a cryptocurrency', 'error');
        return;
    }
    
    if (!amount || amount < 10) {
        showToast('Minimum purchase is $10', 'error');
        return;
    }
    
    const cryptoData = AppState.cryptoPrices[crypto];
    const cryptoAmount = amount / cryptoData.price;
    
    processTransaction('crypto', {
        crypto: crypto,
        amount: amount,
        cryptoAmount: cryptoAmount,
        rate: cryptoData.price
    });
}

function handleBookFlight(e) {
    e.preventDefault();
    
    const formData = {
        from: document.getElementById('flightFrom').value,
        to: document.getElementById('flightTo').value,
        date: document.getElementById('flightDepart').value,
        passengers: parseInt(document.getElementById('flightPassengers').value),
        amount: 450 // Simulated flight price
    };
    
    if (!validateFlightBooking(formData)) return;
    
    processTransaction('flight', formData);
}

function validateDomesticTransfer(data) {
    if (!data.recipientName) {
        showToast('Please enter recipient name', 'error');
        return false;
    }
    
    if (!data.toAccount || data.toAccount.length < 10) {
        showToast('Please enter a valid account number', 'error');
        return false;
    }
    
    if (!data.routingNumber || data.routingNumber.length !== 9) {
        showToast('Please enter a valid routing number', 'error');
        return false;
    }
    
    if (!data.amount || data.amount < 1) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }
    
    if (data.amount > (AppState.currentUser?.balance || 0)) {
        showToast('Insufficient funds', 'error');
        return false;
    }
    
    return true;
}

function validateInternationalTransfer(data) {
    if (!data.recipientName) {
        showToast('Please enter recipient name', 'error');
        return false;
    }
    
    if (!data.toAccount) {
        showToast('Please enter IBAN', 'error');
        return false;
    }
    
    if (!data.swift) {
        showToast('Please enter SWIFT/BIC code', 'error');
        return false;
    }
    
    if (!data.amount || data.amount < 1) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }
    
    const total = data.amount + 35 + (data.amount * 0.02); // Fees
    if (total > (AppState.currentUser?.balance || 0)) {
        showToast('Insufficient funds', 'error');
        return false;
    }
    
    return true;
}

function validateBillPayment(data) {
    if (!data.biller) {
        showToast('Please enter biller name', 'error');
        return false;
    }
    
    if (!data.accountNumber) {
        showToast('Please enter account number', 'error');
        return false;
    }
    
    if (!data.amount || data.amount < 1) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }
    
    if (data.amount > (AppState.currentUser?.balance || 0)) {
        showToast('Insufficient funds', 'error');
        return false;
    }
    
    return true;
}

function validateFlightBooking(data) {
    if (!data.from) {
        showToast('Please enter departure city', 'error');
        return false;
    }
    
    if (!data.to) {
        showToast('Please enter destination city', 'error');
        return false;
    }
    
    if (!data.date) {
        showToast('Please select departure date', 'error');
        return false;
    }
    
    const total = data.amount + 25; // Fees
    if (total > (AppState.currentUser?.balance || 0)) {
        showToast('Insufficient funds', 'error');
        return false;
    }
    
    return true;
}

function setupFormValidation() {
    // Real-time validation for amount fields
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value && parseFloat(this.value) < 0) {
                this.value = '';
            }
        });
    });
    
    // SSN format validation
    const ssnInput = document.getElementById('ssn');
    if (ssnInput) {
        ssnInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 9) value = value.substr(0, 9);
            
            if (value.length > 5) {
                value = value.substr(0, 3) + '-' + value.substr(3, 2) + '-' + value.substr(5);
            } else if (value.length > 3) {
                value = value.substr(0, 3) + '-' + value.substr(3);
            }
            
            this.value = value;
        });
    }
    
    // Phone format validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substr(0, 10);
            
            if (value.length > 6) {
                value = '(' + value.substr(0, 3) + ') ' + value.substr(3, 3) + '-' + value.substr(6);
            } else if (value.length > 3) {
                value = '(' + value.substr(0, 3) + ') ' + value.substr(3);
            } else if (value.length > 0) {
                value = '(' + value;
            }
            
            this.value = value;
        });
    }
    
    // PIN input auto-advance
    document.querySelectorAll('.pin-digit').forEach((input, index, inputs) => {
        input.addEventListener('input', function() {
            if (this.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

function navigateBack() {
    switch(AppState.currentScreen) {
        case 'register':
        case 'pin':
        case 'account':
        case 'transactions':
        case 'deposit':
        case 'transfer':
        case 'payBills':
        case 'buyCrypto':
        case 'bookFlight':
        case 'support':
            showScreen('dashboard');
            break;
        default:
            showScreen('login');
    }
}

function updateTransferSummary(mode) {
    const amountInput = document.getElementById(`${mode}Amount`);
    const amountDisplay = document.getElementById(`${mode}SummaryAmount`);
    const feeDisplay = document.getElementById(`${mode}SummaryFee`);
    const totalDisplay = document.getElementById(`${mode}SummaryTotal`);
    
    if (!amountInput || !amountDisplay || !feeDisplay || !totalDisplay) return;
    
    amountInput.addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        const fees = calculateFees(mode, amount);
        const total = amount + fees;
        
        amountDisplay.textContent = formatCurrency(amount);
        feeDisplay.textContent = formatCurrency(fees);
        totalDisplay.textContent = formatCurrency(total);
    });
}

function updateDepositMethodDetails() {
    const depositType = document.getElementById('depositType');
    if (!depositType) return;
    
    depositType.addEventListener('change', function() {
        const method = this.value;
        
        // Hide all method details
        document.querySelectorAll('.method-details').forEach(details => {
            details.style.display = 'none';
        });
        
        // Show selected method details
        const detailsElement = document.getElementById(`${method}Details`);
        if (detailsElement) {
            detailsElement.style.display = 'block';
        }
    });
}

// ============================================================================
// CHAT BOT FUNCTIONALITY
// ============================================================================

function setupChatBot() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChat');
    const chatMessages = document.getElementById('chatMessages');
    const questionBtns = document.querySelectorAll('.question-btn');
    
    if (!chatInput || !sendBtn || !chatMessages) return;
    
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
            <span class="message-time">${time}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to chat history
        AppState.chatHistory.push({
            text,
            isUser,
            time: new Date().toISOString()
        });
    }
    
    function handleUserMessage(message) {
        addMessage(message, true);
        
        // Bot response
        setTimeout(() => {
            const response = getBotResponse(message.toLowerCase());
            addMessage(response);
        }, 1000);
    }
    
    function getBotResponse(message) {
        const responses = {
            'hello': 'Hello! How can I help you today?',
            'hi': 'Hi there! What can I assist you with?',
            'balance': `Your current balance is ${formatCurrency(AppState.currentUser?.balance || 0)}.`,
            'transfer': 'To transfer money, go to the Transfer section. Domestic transfers have 1% fee, international transfers have $35 + 2% fee.',
            'card': 'If your card is lost or stolen, please go to Card Controls on your dashboard to block it immediately.',
            'deposit': 'You can deposit money via mobile check, bank transfer, wire transfer, or card. Minimum deposit is $1.',
            'limits': 'Daily transfer limit: $10,000. Monthly limit: $50,000. International transfers may have additional limits.',
            'contact': 'You can contact human support at 1-800-555-1234 or email support@nationwidebank.com.',
            'default': 'I\'m not sure I understand. You can ask about: balance, transfers, card issues, deposits, limits, or contact information.'
        };
        
        for (const [key, response] of Object.entries(responses)) {
            if (message.includes(key)) {
                return response;
            }
        }
        
        return responses.default;
    }
    
    // Send button click
    sendBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            handleUserMessage(message);
            chatInput.value = '';
        }
    });
    
    // Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                handleUserMessage(message);
                chatInput.value = '';
            }
        }
    });
    
    // Quick question buttons
    questionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            handleUserMessage(question);
        });
    });
}

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

// Add CSS for rotating animation
const style = document.createElement('style');
style.textContent = `
    .rotating {
        animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Fix quick actions grid for mobile */
    @media (max-width: 320px) {
        #dashboardScreen .actions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
        }
        
        #dashboardScreen .action-btn {
            padding: 0.5rem;
            height: 90px;
        }
        
        #dashboardScreen .action-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
        }
        
        #dashboardScreen .action-btn span {
            font-size: 0.75rem;
        }
    }
    
    /* Fix registration form spacing */
    #registerScreen .form-container {
        padding: 1rem;
    }
    
    @media (min-width: 768px) {
        #registerScreen .form-container {
            padding: 2rem;
        }
    }
    
    /* Fix PIN digit input focus */
    .pin-digit:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.2);
    }
    
    /* Fix transfer form display */
    .transfer-form {
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .transfer-form.active {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupChatBot();
});