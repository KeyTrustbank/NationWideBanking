// ============================================
// NATIONWIDE BANK PLC - CRYPTO-STYLE BANKING
// ============================================

// Data Models and Storage
const BankApp = {
    // App state
    currentUser: null,
    currentScreen: 'login',
    pinAttempts: 0,
    isLockedOut: false,
    lockoutTimer: null,
    transactionInProgress: null,
    
    // Initialize the app
    init: function() {
        this.initializeSampleData();
        this.bindEvents();
        this.showScreen('loading');
        
        // Simulate loading time
        setTimeout(() => {
            this.checkSession();
        }, 2000);
    },
    
    // Bind all event listeners
    bindEvents: function() {
        // Navigation
        document.querySelectorAll('[data-screen]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = button.getAttribute('data-screen');
                this.showScreen(screen);
            });
        });
        
        // Login screen
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        
        document.getElementById('goToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('register');
        });
        document.getElementById('togglePassword').addEventListener('click', () => this.togglePasswordVisibility());
        document.getElementById('forgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('Password reset link has been sent to your email.', 'info');
        });
        
        // Registration screen
        document.getElementById('backFromRegister').addEventListener('click', () => this.showScreen('login'));
        document.getElementById('nextStep1').addEventListener('click', () => this.nextRegistrationStep(1));
        document.getElementById('prevStep2').addEventListener('click', () => this.prevRegistrationStep(2));
        document.getElementById('nextStep2').addEventListener('click', () => this.nextRegistrationStep(2));
        document.getElementById('prevStep3').addEventListener('click', () => this.prevRegistrationStep(3));
        document.getElementById('completeRegistration').addEventListener('click', () => this.completeRegistration());
        
        // PIN setup
        document.querySelectorAll('.pin-key').forEach(key => {
            key.addEventListener('click', () => this.handlePinKey(key.getAttribute('data-value'), 'setup'));
        });
        
        // PIN entry screen
        document.querySelectorAll('.pin-key-entry').forEach(key => {
            key.addEventListener('click', () => this.handlePinKey(key.getAttribute('data-value'), 'entry'));
        });
        document.getElementById('logoutFromPin').addEventListener('click', () => this.logout());
        
        // Dashboard
        document.getElementById('openMenu').addEventListener('click', () => this.toggleMenu(true));
        document.getElementById('closeMenu').addEventListener('click', () => this.toggleMenu(false));
        document.getElementById('menuLogout').addEventListener('click', () => this.logout());
        document.getElementById('toggleBalance').addEventListener('click', () => this.toggleBalanceVisibility());
        document.getElementById('supportBtn').addEventListener('click', () => this.showScreen('customerSupport'));
        
        // Quick actions
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
        
        // Virtual card
        document.getElementById('flipCard').addEventListener('click', () => this.flipCard());
        document.getElementById('showCvvBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCVV();
        });
        document.getElementById('freezeCard').addEventListener('click', () => this.toggleCardFreeze());
        document.getElementById('blockCard').addEventListener('click', () => this.blockCard());
        
        // Financial tips
        document.getElementById('refreshTips').addEventListener('click', () => this.refreshTips());
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const tip = dot.getAttribute('data-tip');
                this.showTip(tip);
            });
        });
        
        // Deposit screen
        document.getElementById('depositAmount').addEventListener('input', () => this.updateDepositSummary());
        document.getElementById('depositType').addEventListener('change', () => this.updateDepositDetails());
        document.getElementById('confirmDeposit').addEventListener('click', () => this.initiateDeposit());
        
        // Transfer screen
        document.querySelectorAll('.transfer-type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTransferType(btn.getAttribute('data-type')));
        });
        document.getElementById('domesticAmount').addEventListener('input', () => this.updateTransferSummary('domestic'));
        document.getElementById('internationalAmount').addEventListener('input', () => this.updateTransferSummary('international'));
        document.getElementById('confirmTransfer').addEventListener('click', () => this.initiateTransfer());
        
        // Pay bills screen
        document.getElementById('billAmount').addEventListener('input', () => this.updateBillSummary());
        document.getElementById('confirmBill').addEventListener('click', () => this.initiateBillPayment());
        
        // Buy crypto screen
        document.getElementById('cryptoAmount').addEventListener('input', () => this.updateCryptoSummary());
        document.getElementById('cryptoType').addEventListener('change', () => this.updateCryptoSummary());
        document.getElementById('confirmCrypto').addEventListener('click', () => this.initiateCryptoPurchase());
        
        // Book flight screen
        document.getElementById('flightDate').addEventListener('change', () => this.updateFlightPricing());
        document.getElementById('flightClass').addEventListener('change', () => this.updateFlightPricing());
        document.getElementById('confirmFlight').addEventListener('click', () => this.initiateFlightBooking());
        
        // Customer support
        document.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickQuestion(btn.getAttribute('data-question')));
        });
        document.getElementById('sendMessage').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // PIN verification modal
        document.getElementById('closePinModal').addEventListener('click', () => this.closePinModal());
        document.querySelectorAll('.pin-key-verify').forEach(key => {
            key.addEventListener('click', () => this.handlePinKey(key.getAttribute('data-value'), 'verify'));
        });
        
        // Receipt modal
        document.getElementById('closeReceiptModal').addEventListener('click', () => this.closeReceiptModal());
        document.getElementById('printReceipt').addEventListener('click', () => this.printReceipt());
        
        // Filter transactions
        document.getElementById('filterTransactions').addEventListener('click', () => this.toggleFilters());
        document.getElementById('applyFilters').addEventListener('click', () => this.applyTransactionFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearTransactionFilters());
        
        // Set today's date
        this.setCurrentDate();
        
        // Auto-rotate tips
        this.startTipsRotation();
    },
    
    // Show/hide screens
    showScreen: function(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show requested screen
        const screenElement = document.getElementById(`${screenName}Screen`);
        if (screenElement) {
            screenElement.classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Update UI based on screen
            switch(screenName) {
                case 'dashboard':
                    this.updateDashboard();
                    this.toggleMenu(false);
                    break;
                case 'myAccount':
                    this.updateAccountScreen();
                    break;
                case 'transactions':
                    this.loadTransactions();
                    break;
                case 'customerSupport':
                    this.scrollChatToBottom();
                    break;
            }
        }
    },
    
    // Check if user is already logged in
    checkSession: function() {
        const session = this.getFromStorage('session');
        if (session && session.userId) {
            const user = this.getUserById(session.userId);
            if (user) {
                this.currentUser = user;
                this.showScreen('pin');
                this.updatePinScreen();
            } else {
                this.showScreen('login');
            }
        } else {
            this.showScreen('login');
        }
    },
    
    // Handle login
    handleLogin: function() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validation
        if (!email || !password) {
            this.showToast('Please enter both email and password.', 'error');
            return;
        }
        
        // Check for demo user
        if (email === 'Henrycalors348@gmail.com' && password === 'Bigben081') {
            this.handleDemoLogin();
            return;
        }
        
        // Check regular users
        const users = this.getFromStorage('users') || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            
            // Create session
            const session = {
                userId: user.id,
                timestamp: new Date().toISOString()
            };
            this.saveToStorage('session', session);
            
            // Show PIN screen
            this.showScreen('pin');
            this.updatePinScreen();
            
            this.showToast('Login successful!', 'success');
        } else {
            this.showToast('Invalid email or password.', 'error');
        }
    },
    
    // Handle demo login
    handleDemoLogin: function() {
        // Create demo user with hard-coded data
        const demoUser = {
            id: 'demo-user-001',
            fullName: 'Martin Lampard',
            nationality: 'USA',
            dob: '28/03/1962',
            email: 'Henrycalors348@gmail.com',
            phone: '+1 (555) 123-4567',
            ssn: '123-45-6789',
            address: '123 Main Street, New York, NY 10001',
            password: 'Bigben081',
            pin: '1234',
            accountType: 'Savings',
            accountNumber: '73449001266344',
            routingNumber: '02688832',
            card: {
                number: '4532 8943 2312 4567',
                name: 'MARTIN LAMPARD',
                expiry: '08/28',
                cvv: '123'
            },
            balance: 12450.75,
            tier: 'Tier 3',
            dailyLimit: 500000,
            createdAt: new Date().toISOString()
        };
        
        this.currentUser = demoUser;
        
        // Create session
        const session = {
            userId: demoUser.id,
            timestamp: new Date().toISOString()
        };
        this.saveToStorage('session', session);
        
        // Show PIN screen
        this.showScreen('pin');
        this.updatePinScreen();
        
        this.showToast('Demo account loaded successfully!', 'success');
    },
    
    // Toggle password visibility
    togglePasswordVisibility: function() {
        const passwordInput = document.getElementById('loginPassword');
        const eyeIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    },
    
    // Registration steps
    nextRegistrationStep: function(currentStep) {
        // Validate current step
        if (currentStep === 1) {
            if (!this.validateStep1()) return;
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
        } else if (currentStep === 2) {
            if (!this.validateStep2()) return;
            document.getElementById('step2').classList.add('hidden');
            document.getElementById('step3').classList.remove('hidden');
        }
    },
    
    prevRegistrationStep: function(currentStep) {
        if (currentStep === 2) {
            document.getElementById('step2').classList.add('hidden');
            document.getElementById('step1').classList.remove('hidden');
        } else if (currentStep === 3) {
            document.getElementById('step3').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
        }
    },
    
    // Validate registration step 1
    validateStep1: function() {
        const fullName = document.getElementById('regFullName').value.trim();
        const nationality = document.getElementById('regNationality').value;
        const dob = document.getElementById('regDOB').value;
        const ssn = document.getElementById('regSSN').value.trim();
        const address = document.getElementById('regAddress').value.trim();
        
        if (!fullName) {
            this.showToast('Please enter your full name.', 'error');
            return false;
        }
        
        if (!nationality) {
            this.showToast('Please select your nationality.', 'error');
            return false;
        }
        
        if (!dob) {
            this.showToast('Please enter your date of birth.', 'error');
            return false;
        }
        
        if (!ssn) {
            this.showToast('Please enter your SSN.', 'error');
            return false;
        }
        
        if (!address) {
            this.showToast('Please enter your address.', 'error');
            return false;
        }
        
        return true;
    },
    
    // Validate registration step 2
    validateStep2: function() {
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const accountType = document.getElementById('regAccountType').value;
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showToast('Please enter a valid email address.', 'error');
            return false;
        }
        
        // Check if email already exists
        const users = this.getFromStorage('users') || [];
        if (users.some(u => u.email === email)) {
            this.showToast('This email is already registered.', 'error');
            return false;
        }
        
        if (!phone) {
            this.showToast('Please enter your phone number.', 'error');
            return false;
        }
        
        if (!password || password.length < 8) {
            this.showToast('Password must be at least 8 characters.', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match.', 'error');
            return false;
        }
        
        if (!accountType) {
            this.showToast('Please select an account type.', 'error');
            return false;
        }
        
        return true;
    },
    
    // Complete registration
    completeRegistration: function() {
        const pinDigits = document.querySelectorAll('.pin-digit');
        let pin = '';
        pinDigits.forEach(digit => {
            if (digit.textContent !== '●') {
                pin += digit.textContent;
            }
        });
        
        if (pin.length !== 4) {
            this.showToast('Please set a 4-digit PIN.', 'error');
            return;
        }
        
        // Create user object
        const userId = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const accountNumber = this.generateAccountNumber();
        const routingNumber = '02688832'; // Fixed for this bank
        const cardNumber = this.generateCardNumber();
        const cardExpiry = this.generateCardExpiry();
        const cardCvv = Math.floor(100 + Math.random() * 900).toString();
        
        const newUser = {
            id: userId,
            fullName: document.getElementById('regFullName').value.trim(),
            nationality: document.getElementById('regNationality').value,
            dob: document.getElementById('regDOB').value,
            ssn: document.getElementById('regSSN').value.trim(),
            address: document.getElementById('regAddress').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            phone: document.getElementById('regPhone').value.trim(),
            password: document.getElementById('regPassword').value,
            pin: pin,
            accountType: document.getElementById('regAccountType').value,
            accountNumber: accountNumber,
            routingNumber: routingNumber,
            card: {
                number: cardNumber,
                name: document.getElementById('regFullName').value.trim().toUpperCase(),
                expiry: cardExpiry,
                cvv: cardCvv
            },
            balance: 1000.00, // Initial balance
            tier: 'Tier 1',
            dailyLimit: 5000,
            createdAt: new Date().toISOString()
        };
        
        // Save user
        const users = this.getFromStorage('users') || [];
        users.push(newUser);
        this.saveToStorage('users', users);
        
        // Show success message with account details
        this.showRegistrationSuccess(newUser);
    },
    
    // Show registration success
    showRegistrationSuccess: function(user) {
        // Fill login form with new credentials
        document.getElementById('loginEmail').value = user.email;
        document.getElementById('loginPassword').value = user.password;
        
        // Show success message
        this.showToast('Account created successfully! Please login with your credentials.', 'success');
        
        // Go back to login
        this.showScreen('login');
    },
    
    // Generate random account number
    generateAccountNumber: function() {
        return '7' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    },
    
    // Generate random card number
    generateCardNumber: function() {
        const parts = [];
        for (let i = 0; i < 4; i++) {
            parts.push(Math.floor(1000 + Math.random() * 9000).toString());
        }
        return parts.join(' ');
    },
    
    // Generate card expiry (2 years from now)
    generateCardExpiry: function() {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = (now.getFullYear() + 2).toString().slice(-2);
        return `${month}/${year}`;
    },
    
    // Handle PIN key press
    handlePinKey: function(value, type) {
        let pinDisplay, pinInput;
        
        if (type === 'setup') {
            pinDisplay = document.querySelectorAll('.pin-digit');
            pinInput = document.getElementById('pinInput');
        } else if (type === 'entry') {
            pinDisplay = document.querySelectorAll('.pin-digit-entry');
        } else if (type === 'verify') {
            pinDisplay = document.querySelectorAll('.pin-digit-verify');
        }
        
        if (value === 'clear') {
            // Clear all digits
            pinDisplay.forEach(digit => {
                digit.textContent = '';
                digit.classList.remove('filled');
            });
            if (pinInput) pinInput.value = '';
            return;
        }
        
        if (value === 'backspace') {
            // Remove last digit
            for (let i = pinDisplay.length - 1; i >= 0; i--) {
                if (pinDisplay[i].textContent !== '' && pinDisplay[i].textContent !== '●') {
                    pinDisplay[i].textContent = '';
                    pinDisplay[i].classList.remove('filled');
                    if (pinInput) pinInput.value = pinInput.value.slice(0, -1);
                    break;
                }
            }
            return;
        }
        
        // Add digit
        for (let i = 0; i < pinDisplay.length; i++) {
            if (!pinDisplay[i].textContent || pinDisplay[i].textContent === '●') {
                pinDisplay[i].textContent = value;
                pinDisplay[i].classList.add('filled');
                if (pinInput) pinInput.value += value;
                
                // Auto-submit if all digits entered
                if (i === pinDisplay.length - 1) {
                    setTimeout(() => {
                        if (type === 'entry') {
                            this.verifyPin();
                        } else if (type === 'verify') {
                            this.verifyTransactionPin();
                        }
                    }, 300);
                }
                break;
            }
        }
    },
    
    // Update PIN screen with user info
    updatePinScreen: function() {
        if (!this.currentUser) return;
        
        document.getElementById('pinUserName').textContent = this.currentUser.fullName;
        
        // Reset PIN display
        document.querySelectorAll('.pin-digit-entry').forEach(digit => {
            digit.textContent = '';
            digit.classList.remove('filled');
        });
        
        // Reset error and lockout
        document.getElementById('pinError').textContent = '';
        this.pinAttempts = 0;
        this.isLockedOut = false;
        document.getElementById('pinLockout').classList.add('hidden');
    },
    
    // Verify PIN for login
    verifyPin: function() {
        if (!this.currentUser) return;
        
        // Check if locked out
        if (this.isLockedOut) {
            document.getElementById('pinError').textContent = 'Account is temporarily locked.';
            return;
        }
        
        // Get entered PIN
        const pinDigits = document.querySelectorAll('.pin-digit-entry');
        let enteredPin = '';
        pinDigits.forEach(digit => {
            if (digit.textContent) {
                enteredPin += digit.textContent;
            }
        });
        
        // Verify PIN
        if (enteredPin === this.currentUser.pin) {
            // Successful login
            this.pinAttempts = 0;
            this.showScreen('dashboard');
            this.showToast('PIN verified successfully!', 'success');
        } else {
            // Incorrect PIN
            this.pinAttempts++;
            document.getElementById('pinError').textContent = `Incorrect PIN. ${5 - this.pinAttempts} attempts remaining.`;
            
            // Shake animation for error
            pinDigits.forEach(digit => {
                digit.classList.add('shake');
                setTimeout(() => digit.classList.remove('shake'), 500);
            });
            
            // Check for lockout
            if (this.pinAttempts >= 5) {
                this.lockoutAccount();
            }
        }
    },
    
    // Lockout account after too many failed attempts
    lockoutAccount: function() {
        this.isLockedOut = true;
        document.getElementById('pinLockout').classList.remove('hidden');
        
        let seconds = 30;
        document.getElementById('lockoutTimer').textContent = seconds;
        
        this.lockoutTimer = setInterval(() => {
            seconds--;
            document.getElementById('lockoutTimer').textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(this.lockoutTimer);
                this.isLockedOut = false;
                this.pinAttempts = 0;
                document.getElementById('pinLockout').classList.add('hidden');
                document.getElementById('pinError').textContent = '';
                
                // Clear PIN display
                document.querySelectorAll('.pin-digit-entry').forEach(digit => {
                    digit.textContent = '';
                    digit.classList.remove('filled');
                });
            }
        }, 1000);
    },
    
    // Logout user
    logout: function() {
        this.currentUser = null;
        this.removeFromStorage('session');
        this.showScreen('login');
        this.showToast('Logged out successfully.', 'success');
    },
    
    // Toggle hamburger menu
    toggleMenu: function(open) {
        const menu = document.getElementById('hamburgerMenu');
        if (open) {
            menu.classList.remove('hidden');
            setTimeout(() => menu.classList.add('open'), 10);
            
            // Update menu user info
            if (this.currentUser) {
                document.getElementById('menuUserName').textContent = this.currentUser.fullName;
                document.getElementById('menuUserEmail').textContent = this.currentUser.email;
            }
        } else {
            menu.classList.remove('open');
            setTimeout(() => menu.classList.add('hidden'), 300);
        }
    },
    
    // Update dashboard with user data
    updateDashboard: function() {
        if (!this.currentUser) return;
        
        // Update welcome message
        const firstName = this.currentUser.fullName.split(' ')[0];
        document.getElementById('dashboardUserName').textContent = firstName;
        
        // Update balance
        document.getElementById('balanceAmount').textContent = this.formatCurrency(this.currentUser.balance);
        document.getElementById('dailyLimit').textContent = this.formatCurrency(this.currentUser.dailyLimit);
        document.getElementById('accountTier').textContent = this.currentUser.tier;
        
        // Update card details
        document.getElementById('cardholderName').textContent = this.currentUser.card.name;
        document.getElementById('cardNumber').textContent = '•••• •••• •••• ' + this.currentUser.card.number.slice(-4);
        document.getElementById('cardExpiry').textContent = this.currentUser.card.expiry;
        document.getElementById('cardCvv').textContent = '•••';
        
        // Update full card details in hidden fields
        document.getElementById('fullCardNumber').textContent = this.currentUser.card.number;
        document.getElementById('fullCardholderName').textContent = this.currentUser.card.name;
        document.getElementById('fullCardExpiry').textContent = this.currentUser.card.expiry;
        document.getElementById('fullCardCvv').textContent = this.currentUser.card.cvv;
        
        // Load recent transactions
        this.loadRecentTransactions();
        
        // Update account screen if needed
        this.updateAccountScreen();
    },
    
    // Update account screen
    updateAccountScreen: function() {
        if (!this.currentUser) return;
        
        document.getElementById('accountFullName').textContent = this.currentUser.fullName;
        document.getElementById('accountEmail').textContent = this.currentUser.email;
        document.getElementById('accountNationality').textContent = this.currentUser.nationality;
        document.getElementById('accountDOB').textContent = this.formatDate(this.currentUser.dob);
        document.getElementById('accountPhone').textContent = this.currentUser.phone;
        document.getElementById('accountAddress').textContent = this.currentUser.address;
        document.getElementById('accountNumber').textContent = this.currentUser.accountNumber;
        document.getElementById('routingNumber').textContent = this.currentUser.routingNumber;
        document.getElementById('accountTypeBadge').textContent = this.currentUser.accountType + ' Account';
        document.getElementById('accountTierDetail').textContent = this.currentUser.tier;
        document.getElementById('dailyLimitDetail').textContent = this.formatCurrency(this.currentUser.dailyLimit);
        document.getElementById('lastLogin').textContent = this.formatDateTime(new Date());
        
        // Update full card details
        document.getElementById('fullCardNumber').textContent = this.currentUser.card.number;
        document.getElementById('fullCardholderName').textContent = this.currentUser.card.name;
        document.getElementById('fullCardExpiry').textContent = this.currentUser.card.expiry;
        document.getElementById('fullCardCvv').textContent = this.currentUser.card.cvv;
    },
    
    // Toggle balance visibility
    toggleBalanceVisibility: function() {
        const balanceElement = document.getElementById('balanceAmount');
        const eyeIcon = document.getElementById('balanceEyeIcon');
        
        if (balanceElement.textContent.includes('*')) {
            // Show balance
            balanceElement.textContent = this.formatCurrency(this.currentUser.balance);
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            // Hide balance
            balanceElement.textContent = '****.**';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    },
    
    // Handle quick actions
    handleQuickAction: function(action) {
        switch(action) {
            case 'deposit':
                this.showScreen('deposit');
                break;
            case 'transfer':
                this.showScreen('transfer');
                break;
            case 'payBills':
                this.showScreen('payBills');
                break;
            case 'buyCrypto':
                this.showScreen('buyCrypto');
                break;
            case 'bookFlight':
                this.showScreen('bookFlight');
                break;
            case 'support':
                this.showScreen('customerSupport');
                break;
        }
    },
    
    // Flip virtual card
    flipCard: function() {
        document.getElementById('virtualCard').classList.toggle('flipped');
    },
    
    // Show CVV on card
    showCVV: function() {
        const cvvElement = document.getElementById('cardCvv');
        const button = document.getElementById('showCvvBtn');
        
        if (cvvElement.textContent === '•••') {
            cvvElement.textContent = this.currentUser.card.cvv;
            button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (cvvElement.textContent !== '•••') {
                    cvvElement.textContent = '•••';
                    button.innerHTML = '<i class="fas fa-eye"></i> Show';
                }
            }, 5000);
        } else {
            cvvElement.textContent = '•••';
            button.innerHTML = '<i class="fas fa-eye"></i> Show';
        }
    },
    
    // Toggle card freeze
    toggleCardFreeze: function() {
        const button = document.getElementById('freezeCard');
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('fa-snowflake')) {
            icon.classList.remove('fa-snowflake');
            icon.classList.add('fa-fire');
            button.innerHTML = '<i class="fas fa-fire"></i> Unfreeze Card';
            this.showToast('Card has been frozen.', 'success');
        } else {
            icon.classList.remove('fa-fire');
            icon.classList.add('fa-snowflake');
            button.innerHTML = '<i class="fas fa-snowflake"></i> Freeze Card';
            this.showToast('Card has been unfrozen.', 'success');
        }
    },
    
    // Block card
    blockCard: function() {
        if (confirm('Are you sure you want to block this card? This action cannot be undone.')) {
            this.showToast('Card has been blocked. A new card will be issued.', 'success');
            
            // Update button
            const button = document.getElementById('blockCard');
            button.innerHTML = '<i class="fas fa-ban"></i> Card Blocked';
            button.disabled = true;
            button.style.opacity = '0.6';
        }
    },
    
    // Load recent transactions
    loadRecentTransactions: function() {
        const transactions = this.getFromStorage('transactions') || [];
        const userTransactions = transactions.filter(t => t.userId === this.currentUser.id);
        
        // Sort by date (newest first)
        userTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Get last 5 transactions
        const recentTransactions = userTransactions.slice(0, 5);
        
        // Update UI
        const container = document.getElementById('transactionsList');
        container.innerHTML = '';
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="no-transactions"><p>No transactions yet</p></div>';
            return;
        }
        
        recentTransactions.forEach(transaction => {
            const transactionElement = this.createTransactionElement(transaction);
            container.appendChild(transactionElement);
        });
    },
    
    // Load all transactions
    loadTransactions: function() {
        const transactions = this.getFromStorage('transactions') || [];
        const userTransactions = transactions.filter(t => t.userId === this.currentUser.id);
        
        // Sort by date (newest first)
        userTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Update UI
        const container = document.getElementById('transactionsListFull');
        container.innerHTML = '';
        
        if (userTransactions.length === 0) {
            container.innerHTML = '<div class="no-transactions"><p>No transactions yet</p></div>';
            return;
        }
        
        userTransactions.forEach(transaction => {
            const transactionElement = this.createTransactionElement(transaction);
            container.appendChild(transactionElement);
        });
    },
    
    // Create transaction element
    createTransactionElement: function(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
        // Determine icon and color based on type
        let icon, iconColor, amountClass;
        if (transaction.type === 'deposit') {
            icon = 'fa-arrow-down';
            iconColor = '#28a745';
            amountClass = 'positive';
        } else if (transaction.type === 'transfer') {
            icon = 'fa-paper-plane';
            iconColor = '#dc3545';
            amountClass = 'negative';
        } else if (transaction.type === 'payment') {
            icon = 'fa-file-invoice-dollar';
            iconColor = '#ffc107';
            amountClass = 'negative';
        } else if (transaction.type === 'crypto') {
            icon = 'fa-coins';
            iconColor = '#f7931a';
            amountClass = 'negative';
        } else if (transaction.type === 'flight') {
            icon = 'fa-plane';
            iconColor = '#17a2b8';
            amountClass = 'negative';
        } else {
            icon = 'fa-exchange-alt';
            iconColor = '#6c757d';
            amountClass = transaction.amount > 0 ? 'positive' : 'negative';
        }
        
        // Status badge
        let statusBadge = '';
        if (transaction.status) {
            const statusClass = `status-${transaction.status}`;
            statusBadge = `<span class="transaction-status ${statusClass}">${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>`;
        }
        
        div.innerHTML = `
            <div class="transaction-icon" style="background-color: ${iconColor}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${transaction.description}</div>
                <div class="transaction-date">${this.formatDateTime(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${transaction.amount > 0 ? '+' : ''}${this.formatCurrency(transaction.amount)}
                ${statusBadge}
            </div>
        `;
        
        // Add click event to show receipt
        div.addEventListener('click', () => {
            this.showReceipt(transaction);
        });
        
        return div;
    },
    
    // Toggle transaction filters
    toggleFilters: function() {
        const filtersSection = document.getElementById('filtersSection');
        filtersSection.classList.toggle('hidden');
    },
    
    // Apply transaction filters
    applyTransactionFilters: function() {
        // This would filter transactions based on selected criteria
        this.showToast('Filters applied.', 'success');
        this.toggleFilters();
    },
    
    // Clear transaction filters
    clearTransactionFilters: function() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterPeriod').value = '';
        this.showToast('Filters cleared.', 'success');
        this.toggleFilters();
    },
    
    // Update deposit summary
    updateDepositSummary: function() {
        const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
        const fee = amount * 0.01; // 1% fee
        const total = amount - fee;
        
        document.getElementById('summaryAmount').textContent = this.formatCurrency(amount);
        document.getElementById('summaryFee').textContent = this.formatCurrency(fee);
        document.getElementById('summaryTotal').textContent = this.formatCurrency(total);
    },
    
    // Update deposit details based on type
    updateDepositDetails: function() {
        const type = document.getElementById('depositType').value;
        const container = document.getElementById('depositDetailsContainer');
        
        let html = '';
        switch(type) {
            case 'check':
                html = `
                    <label for="checkNumber">Check Number *</label>
                    <input type="text" id="checkNumber" placeholder="Enter check number">
                    <label for="checkFront">Front of Check (Image)</label>
                    <input type="file" id="checkFront" accept="image/*">
                    <label for="checkBack">Back of Check (Image)</label>
                    <input type="file" id="checkBack" accept="image/*">
                `;
                break;
            case 'mobile':
                html = `
                    <label for="mobileProvider">Mobile Provider *</label>
                    <select id="mobileProvider">
                        <option value="">Select provider</option>
                        <option value="venmo">Venmo</option>
                        <option value="cashapp">Cash App</option>
                        <option value="zelle">Zelle</option>
                        <option value="paypal">PayPal</option>
                    </select>
                    <label for="mobileAccount">Account ID *</label>
                    <input type="text" id="mobileAccount" placeholder="Your account ID with provider">
                `;
                break;
            case 'wire':
                html = `
                    <label for="wireFrom">From Bank *</label>
                    <input type="text" id="wireFrom" placeholder="Bank name">
                    <label for="wireAccount">From Account Number *</label>
                    <input type="text" id="wireAccount" placeholder="Account number at other bank">
                `;
                break;
            case 'cash':
                html = `
                    <label for="cashLocation">Deposit Location *</label>
                    <select id="cashLocation">
                        <option value="">Select location</option>
                        <option value="branch">Bank Branch</option>
                        <option value="atm">ATM</option>
                        <option value="partner">Partner Location</option>
                    </select>
                `;
                break;
            case 'other':
                html = `
                    <label for="otherDescription">Deposit Description *</label>
                    <input type="text" id="otherDescription" placeholder="Describe the deposit source">
                `;
                break;
        }
        
        container.innerHTML = html;
    },
    
    // Initiate deposit
    initiateDeposit: function() {
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const type = document.getElementById('depositType').value;
        
        // Validation
        if (!amount || amount < 1) {
            this.showToast('Please enter a valid amount (minimum $1).', 'error');
            return;
        }
        
        if (!type) {
            this.showToast('Please select a deposit type.', 'error');
            return;
        }
        
        // Check additional validation based on type
        if (type === 'check') {
            const checkNumber = document.getElementById('checkNumber')?.value;
            if (!checkNumber) {
                this.showToast('Please enter check number.', 'error');
                return;
            }
        }
        
        // Set up transaction data
        this.transactionInProgress = {
            type: 'deposit',
            amount: amount,
            fee: amount * 0.01,
            total: amount - (amount * 0.01),
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} Deposit`,
            details: {
                depositType: type
            }
        };
        
        // Show PIN verification modal
        this.showPinModal();
    },
    
    // Switch transfer type
    switchTransferType: function(type) {
        // Update buttons
        document.querySelectorAll('.transfer-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
            }
        });
        
        // Update forms
        document.getElementById('domesticForm').classList.remove('active');
        document.getElementById('internationalForm').classList.remove('active');
        document.getElementById(`${type}Form`).classList.add('active');
        
        // Update summary
        document.getElementById('summaryType').textContent = type === 'domestic' ? 'Domestic' : 'International';
        
        // Clear amount fields
        if (type === 'domestic') {
            document.getElementById('internationalAmount').value = '';
        } else {
            document.getElementById('domesticAmount').value = '';
        }
        
        this.updateTransferSummary(type);
    },
    
    // Update transfer summary
    updateTransferSummary: function(type) {
        const amountField = type === 'domestic' ? 
            document.getElementById('domesticAmount') : 
            document.getElementById('internationalAmount');
        
        const amount = parseFloat(amountField.value) || 0;
        const fee = amount * 0.01; // 1% fee
        const total = amount + fee;
        
        document.getElementById('summaryTransferAmount').textContent = this.formatCurrency(amount);
        document.getElementById('summaryTransferFee').textContent = this.formatCurrency(fee);
        document.getElementById('summaryTransferTotal').textContent = this.formatCurrency(total);
    },
    
    // Initiate transfer
    initiateTransfer: function() {
        // Determine which form is active
        const isDomestic = document.getElementById('domesticForm').classList.contains('active');
        const type = isDomestic ? 'domestic' : 'international';
        
        // Get form data
        let amount, recipientName, description;
        
        if (isDomestic) {
            amount = parseFloat(document.getElementById('domesticAmount').value);
            recipientName = document.getElementById('domesticName').value;
            const account = document.getElementById('domesticAccount').value;
            const method = document.getElementById('domesticMethod').value;
            
            // Validation
            if (!amount || amount < 1) {
                this.showToast('Please enter a valid amount (minimum $1).', 'error');
                return;
            }
            
            if (!recipientName) {
                this.showToast('Please enter recipient name.', 'error');
                return;
            }
            
            if (!account) {
                this.showToast('Please enter account number.', 'error');
                return;
            }
            
            description = `Domestic Transfer to ${recipientName}`;
            
            this.transactionInProgress = {
                type: 'transfer',
                transferType: 'domestic',
                amount: amount,
                fee: amount * 0.01,
                total: amount + (amount * 0.01),
                description: description,
                details: {
                    recipientName: recipientName,
                    accountNumber: account,
                    method: method,
                    isDomestic: true
                }
            };
        } else {
            amount = parseFloat(document.getElementById('internationalAmount').value);
            recipientName = document.getElementById('internationalName').value;
            const iban = document.getElementById('internationalIBAN').value;
            const currency = document.getElementById('internationalCurrency').value;
            
            // Validation
            if (!amount || amount < 1) {
                this.showToast('Please enter a valid amount (minimum $1).', 'error');
                return;
            }
            
            if (!recipientName) {
                this.showToast('Please enter recipient name.', 'error');
                return;
            }
            
            if (!iban) {
                this.showToast('Please enter IBAN.', 'error');
                return;
            }
            
            description = `International Transfer to ${recipientName} (${currency})`;
            
            this.transactionInProgress = {
                type: 'transfer',
                transferType: 'international',
                amount: amount,
                fee: amount * 0.01,
                total: amount + (amount * 0.01),
                description: description,
                details: {
                    recipientName: recipientName,
                    iban: iban,
                    currency: currency,
                    isDomestic: false
                }
            };
        }
        
        // Check if user has sufficient balance
        if (this.currentUser.balance < this.transactionInProgress.total) {
            this.showToast('Insufficient funds for this transfer.', 'error');
            return;
        }
        
        // Show PIN verification modal
        this.showPinModal();
    },
    
    // Update bill payment summary
    updateBillSummary: function() {
        const amount = parseFloat(document.getElementById('billAmount').value) || 0;
        const fee = 0; // No fee for bill payments
        const total = amount + fee;
        
        document.getElementById('summaryBillAmount').textContent = this.formatCurrency(amount);
        document.getElementById('summaryBillFee').textContent = this.formatCurrency(fee);
        document.getElementById('summaryBillTotal').textContent = this.formatCurrency(total);
    },
    
    // Initiate bill payment
    initiateBillPayment: function() {
        const provider = document.getElementById('billProvider').value;
        const account = document.getElementById('billAccount').value;
        const amount = parseFloat(document.getElementById('billAmount').value);
        
        // Validation
        if (!provider) {
            this.showToast('Please select a bill provider.', 'error');
            return;
        }
        
        if (!account) {
            this.showToast('Please enter your account number.', 'error');
            return;
        }
        
        if (!amount || amount < 1) {
            this.showToast('Please enter a valid amount (minimum $1).', 'error');
            return;
        }
        
        // Check if user has sufficient balance
        if (this.currentUser.balance < amount) {
            this.showToast('Insufficient funds for this payment.', 'error');
            return;
        }
        
        // Set up transaction data
        this.transactionInProgress = {
            type: 'payment',
            amount: amount,
            fee: 0,
            total: amount,
            description: `Payment to ${provider}`,
            details: {
                provider: provider,
                account: account
            }
        };
        
        // Show PIN verification modal
        this.showPinModal();
    },
    
    // Update crypto purchase summary
    updateCryptoSummary: function() {
        const amount = parseFloat(document.getElementById('cryptoAmount').value) || 0;
        const cryptoType = document.getElementById('cryptoType').value;
        const fee = amount * 0.005; // 0.5% fee
        
        // Crypto exchange rates (simulated)
        const rates = {
            bitcoin: 34567.89,
            ethereum: 1845.67,
            litecoin: 78.90,
            cardano: 0.45,
            solana: 24.56
        };
        
        const rate = rates[cryptoType] || 1;
        const receiveAmount = (amount - fee) / rate;
        
        document.getElementById('summaryCryptoAmount').textContent = this.formatCurrency(amount);
        document.getElementById('summaryCryptoFee').textContent = this.formatCurrency(fee);
        document.getElementById('summaryCryptoReceive').textContent = `${receiveAmount.toFixed(8)} ${cryptoType.toUpperCase()}`;
        document.getElementById('summaryCryptoTotal').textContent = this.formatCurrency(amount);
    },
    
    // Initiate crypto purchase
    initiateCryptoPurchase: function() {
        const amount = parseFloat(document.getElementById('cryptoAmount').value);
        const cryptoType = document.getElementById('cryptoType').value;
        
        // Validation
        if (!amount || amount < 10) {
            this.showToast('Minimum purchase amount is $10.', 'error');
            return;
        }
        
        // Check if user has sufficient balance
        if (this.currentUser.balance < amount) {
            this.showToast('Insufficient funds for this purchase.', 'error');
            return;
        }
        
        // Set up transaction data
        this.transactionInProgress = {
            type: 'crypto',
            amount: amount,
            fee: amount * 0.005,
            total: amount,
            description: `Purchase ${cryptoType.toUpperCase()}`,
            details: {
                cryptoType: cryptoType
            }
        };
        
        // Show PIN verification modal
        this.showPinModal();
    },
    
    // Update flight pricing
    updateFlightPricing: function() {
        const flightClass = document.getElementById('flightClass').value;
        
        // Base fares based on class (simulated)
        const baseFares = {
            economy: 450,
            premium: 750,
            business: 1200,
            first: 2000
        };
        
        const baseFare = baseFares[flightClass] || 450;
        const taxes = baseFare * 0.15; // 15% taxes
        const total = baseFare + taxes;
        
        document.getElementById('baseFare').textContent = this.formatCurrency(baseFare);
        document.getElementById('flightTaxes').textContent = this.formatCurrency(taxes);
        document.getElementById('flightTotal').textContent = this.formatCurrency(total);
    },
    
    // Initiate flight booking
    initiateFlightBooking: function() {
        const from = document.getElementById('flightFrom').value;
        const to = document.getElementById('flightTo').value;
        const date = document.getElementById('flightDate').value;
        const passenger = document.getElementById('flightPassenger').value;
        const flightClass = document.getElementById('flightClass').value;
        
        // Validation
        if (!from) {
            this.showToast('Please enter departure city.', 'error');
            return;
        }
        
        if (!to) {
            this.showToast('Please enter destination city.', 'error');
            return;
        }
        
        if (!date) {
            this.showToast('Please select departure date.', 'error');
            return;
        }
        
        if (!passenger) {
            this.showToast('Please enter passenger name.', 'error');
            return;
        }
        
        // Calculate total (using the same logic as updateFlightPricing)
        const baseFares = {
            economy: 450,
            premium: 750,
            business: 1200,
            first: 2000
        };
        
        const baseFare = baseFares[flightClass] || 450;
        const taxes = baseFare * 0.15;
        const total = baseFare + taxes;
        
        // Check if user has sufficient balance
        if (this.currentUser.balance < total) {
            this.showToast('Insufficient funds for this booking.', 'error');
            return;
        }
        
        // Set up transaction data
        this.transactionInProgress = {
            type: 'flight',
            amount: total,
            fee: 0,
            total: total,
            description: `Flight Booking: ${from} to ${to}`,
            details: {
                from: from,
                to: to,
                date: date,
                passenger: passenger,
                class: flightClass
            }
        };
        
        // Show PIN verification modal
        this.showPinModal();
    },
    
    // Handle quick question in support chat
    handleQuickQuestion: function(question) {
        let answer = '';
        
        switch(question) {
            case 'balance':
                answer = `Your current available balance is ${this.formatCurrency(this.currentUser.balance)}.`;
                break;
            case 'card':
                answer = 'To block your card, go to the Dashboard, click on your virtual card, and select "Block Card". A new card will be issued within 7-10 business days.';
                break;
            case 'deposit':
                answer = 'You can deposit funds via check, mobile payment, wire transfer, or cash at any Nationwide Bank branch. The minimum deposit is $1.';
                break;
            case 'transfer':
                answer = `Your daily transfer limit is ${this.formatCurrency(this.currentUser.dailyLimit)}. International transfers may have additional limits and fees.`;
                break;
            case 'contact':
                answer = 'You can contact our support team 24/7 at 1-800-NATIONWIDE or email support@nationwidebank.com.';
                break;
            case 'hours':
                answer = 'Our branches are open Monday-Friday 9AM-5PM and Saturday 9AM-1PM. Digital banking is available 24/7.';
                break;
            default:
                answer = 'I\'m sorry, I didn\'t understand that question. Can you please rephrase?';
        }
        
        // Add user question
        this.addChatMessage(question, 'user');
        
        // Add bot response after delay
        setTimeout(() => {
            this.addChatMessage(answer, 'bot');
        }, 500);
    },
    
    // Send chat message
    sendChatMessage: function() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage(message, 'user');
        
        // Clear input
        input.value = '';
        
        // Simulate bot response after delay
        setTimeout(() => {
            let response = '';
            
            if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                response = 'Hello! How can I assist you with your banking needs today?';
            } else if (message.toLowerCase().includes('balance')) {
                response = `Your current balance is ${this.formatCurrency(this.currentUser.balance)}.`;
            } else if (message.toLowerCase().includes('fee')) {
                response = 'Our fee structure: Deposits - 1%, Transfers - 1%, Crypto purchases - 0.5%, Bill payments - no fee.';
            } else if (message.toLowerCase().includes('card')) {
                response = 'You can manage your card settings from the Dashboard. Options include freezing, blocking, and viewing card details.';
            } else if (message.toLowerCase().includes('support')) {
                response = 'For immediate assistance, call 1-800-NATIONWIDE (1-800-628-4666) or visit any branch.';
            } else {
                response = 'Thank you for your question. For specific account inquiries, please contact our support team at 1-800-NATIONWIDE.';
            }
            
            this.addChatMessage(response, 'bot');
        }, 1000);
    },
    
    // Add message to chat
    addChatMessage: function(message, sender) {
        const container = document.getElementById('chatMessages');
        const time = this.formatTime(new Date());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
            <span class="message-time">${time}</span>
        `;
        
        container.appendChild(messageDiv);
        this.scrollChatToBottom();
    },
    
    // Scroll chat to bottom
    scrollChatToBottom: function() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    },
    
    // Show PIN verification modal
    showPinModal: function() {
        if (!this.transactionInProgress) return;
        
        // Update modal with transaction details
        document.getElementById('pinTransactionType').textContent = 
            this.transactionInProgress.type.charAt(0).toUpperCase() + 
            this.transactionInProgress.type.slice(1);
        
        document.getElementById('pinTransactionAmount').textContent = 
            this.formatCurrency(this.transactionInProgress.total);
        
        // Show modal
        document.getElementById('pinModal').classList.remove('hidden');
        
        // Clear PIN display
        document.querySelectorAll('.pin-digit-verify').forEach(digit => {
            digit.textContent = '';
            digit.classList.remove('filled');
        });
        
        // Hide error and loading
        document.getElementById('pinVerifyError').classList.add('hidden');
        document.getElementById('pinLoading').classList.add('hidden');
    },
    
    // Close PIN modal
    closePinModal: function() {
        document.getElementById('pinModal').classList.add('hidden');
        this.transactionInProgress = null;
    },
    
    // Verify transaction PIN
    verifyTransactionPin: function() {
        // Get entered PIN
        const pinDigits = document.querySelectorAll('.pin-digit-verify');
        let enteredPin = '';
        pinDigits.forEach(digit => {
            if (digit.textContent) {
                enteredPin += digit.textContent;
            }
        });
        
        // Verify PIN
        if (enteredPin.length !== 4) return;
        
        if (enteredPin === this.currentUser.pin) {
            // PIN is correct - process transaction
            this.processTransaction();
        } else {
            // Incorrect PIN
            document.getElementById('pinVerifyError').classList.remove('hidden');
            
            // Shake animation
            pinDigits.forEach(digit => {
                digit.classList.add('shake');
                setTimeout(() => digit.classList.remove('shake'), 500);
            });
            
            // Clear PIN after delay
            setTimeout(() => {
                pinDigits.forEach(digit => {
                    digit.textContent = '';
                    digit.classList.remove('filled');
                });
            }, 1000);
        }
    },
    
    // Process the transaction after PIN verification
    processTransaction: function() {
        if (!this.transactionInProgress) return;
        
        // Show loading
        document.getElementById('pinLoading').classList.remove('hidden');
        
        // Simulate processing delay
        setTimeout(() => {
            // Check if user has sufficient balance (for outgoing transactions)
            const isOutgoing = ['transfer', 'payment', 'crypto', 'flight'].includes(this.transactionInProgress.type);
            
            if (isOutgoing && this.currentUser.balance < this.transactionInProgress.total) {
                this.showToast('Transaction failed: Insufficient funds.', 'error');
                this.closePinModal();
                return;
            }
            
            // Update user balance
            if (this.transactionInProgress.type === 'deposit') {
                // For deposits, add the net amount (after fee)
                this.currentUser.balance += this.transactionInProgress.total;
            } else {
                // For other transactions, subtract the total (amount + fee)
                this.currentUser.balance -= this.transactionInProgress.total;
            }
            
            // Update user in storage
            this.updateUser(this.currentUser);
            
            // Create transaction record
            const transactionId = 'txn-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            const reference = 'REF-' + new Date().getFullYear() + '-' + 
                Math.random().toString(36).substr(2, 5).toUpperCase() + '-' + 
                Math.random().toString(36).substr(2, 6).toUpperCase();
            
            const transaction = {
                id: transactionId,
                userId: this.currentUser.id,
                ref: reference,
                type: this.transactionInProgress.type,
                status: 'success',
                amount: this.transactionInProgress.type === 'deposit' ? 
                    this.transactionInProgress.total : 
                    -this.transactionInProgress.total,
                currency: 'USD',
                date: new Date().toISOString(),
                description: this.transactionInProgress.description,
                details: this.transactionInProgress.details,
                fee: this.transactionInProgress.fee
            };
            
            // Save transaction
            this.saveTransaction(transaction);
            
            // Update dashboard
            this.updateDashboard();
            
            // Show success
            this.showToast('Transaction completed successfully!', 'success');
            
            // Close PIN modal
            this.closePinModal();
            
            // Show receipt
            this.showReceipt(transaction);
            
            // Return to dashboard
            this.showScreen('dashboard');
        }, 3000); // 3 second delay to simulate processing
    },
    
    // Show receipt
    showReceipt: function(transaction) {
        const container = document.getElementById('receiptContent');
        
        // Format date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determine transaction details based on type
        let detailsHtml = '';
        if (transaction.type === 'transfer') {
            const isDomestic = transaction.details?.isDomestic;
            detailsHtml = `
                <div class="receipt-row">
                    <span>Recipient:</span>
                    <span>${transaction.details?.recipientName || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                    <span>Type:</span>
                    <span>${isDomestic ? 'Domestic Transfer' : 'International Transfer'}</span>
                </div>
                ${isDomestic ? 
                    `<div class="receipt-row">
                        <span>Account Number:</span>
                        <span>${transaction.details?.accountNumber || 'N/A'}</span>
                    </div>` : 
                    `<div class="receipt-row">
                        <span>IBAN:</span>
                        <span>${transaction.details?.iban || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span>Currency:</span>
                        <span>${transaction.details?.currency || 'USD'}</span>
                    </div>`
                }
            `;
        } else if (transaction.type === 'payment') {
            detailsHtml = `
                <div class="receipt-row">
                    <span>Provider:</span>
                    <span>${transaction.details?.provider || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                    <span>Account:</span>
                    <span>${transaction.details?.account || 'N/A'}</span>
                </div>
            `;
        } else if (transaction.type === 'crypto') {
            detailsHtml = `
                <div class="receipt-row">
                    <span>Crypto Type:</span>
                    <span>${transaction.details?.cryptoType?.toUpperCase() || 'N/A'}</span>
                </div>
            `;
        } else if (transaction.type === 'flight') {
            detailsHtml = `
                <div class="receipt-row">
                    <span>Route:</span>
                    <span>${transaction.details?.from || 'N/A'} to ${transaction.details?.to || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                    <span>Passenger:</span>
                    <span>${transaction.details?.passenger || 'N/A'}</span>
                </div>
                <div class="receipt-row">
                    <span>Class:</span>
                    <span>${transaction.details?.class?.charAt(0).toUpperCase() + transaction.details?.class?.slice(1) || 'Economy'}</span>
                </div>
                <div class="receipt-row">
                    <span>Date:</span>
                    <span>${transaction.details?.date || 'N/A'}</span>
                </div>
            `;
        } else if (transaction.type === 'deposit') {
            detailsHtml = `
                <div class="receipt-row">
                    <span>Deposit Type:</span>
                    <span>${transaction.details?.depositType?.charAt(0).toUpperCase() + transaction.details?.depositType?.slice(1) || 'N/A'}</span>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="receipt-header">
                <h3>Nationwide Bank PLC</h3>
                <p>Transaction Receipt</p>
            </div>
            
            <div class="receipt-details">
                <div class="receipt-row">
                    <span>Reference:</span>
                    <span>${transaction.ref}</span>
                </div>
                <div class="receipt-row">
                    <span>Date & Time:</span>
                    <span>${formattedDate}</span>
                </div>
                <div class="receipt-row">
                    <span>Transaction Type:</span>
                    <span>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
                <div class="receipt-row">
                    <span>Status:</span>
                    <span class="status-${transaction.status}">${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </div>
                
                ${detailsHtml}
                
                <div class="receipt-row">
                    <span>Amount:</span>
                    <span>${transaction.amount > 0 ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}</span>
                </div>
                ${transaction.fee > 0 ? `
                <div class="receipt-row">
                    <span>Fee:</span>
                    <span>${this.formatCurrency(transaction.fee)}</span>
                </div>` : ''}
                <div class="receipt-row total">
                    <span>Net Amount:</span>
                    <span>${transaction.amount > 0 ? '+' : ''}${this.formatCurrency(transaction.amount)}</span>
                </div>
            </div>
        `;
        
        // Show receipt modal
        document.getElementById('receiptModal').classList.remove('hidden');
    },
    
    // Close receipt modal
    closeReceiptModal: function() {
        document.getElementById('receiptModal').classList.add('hidden');
    },
    
    // Print receipt
    printReceipt: function() {
        window.print();
    },
    
    // Start tips rotation
    startTipsRotation: function() {
        let currentTip = 1;
        
        setInterval(() => {
            currentTip = currentTip % 5 + 1;
            this.showTip(currentTip.toString());
        }, 8000); // Rotate every 8 seconds
    },
    
    // Show specific tip
    showTip: function(tipNumber) {
        // Hide all tips
        document.querySelectorAll('.tip-card').forEach(tip => {
            tip.classList.remove('active');
        });
        
        // Show selected tip
        document.getElementById(`tip${tipNumber}`).classList.add('active');
        
        // Update dots
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('data-tip') === tipNumber) {
                dot.classList.add('active');
            }
        });
    },
    
    // Refresh tips (randomize order)
    refreshTips: function() {
        const tips = [
            "Diversify your investments across different asset classes to minimize risk.",
            "Regularly review your spending patterns to identify areas for potential savings.",
            "Set aside at least 20% of your income for savings and investments.",
            "Enable two-factor authentication on all your financial accounts for added security.",
            "Pay your credit card balance in full each month to avoid high interest charges.",
            "Consider automating your savings to ensure consistent contributions.",
            "Review your credit report annually to check for errors or signs of fraud.",
            "Build an emergency fund covering 3-6 months of living expenses.",
            "Take advantage of employer-matched retirement contributions if available.",
            "Consult with a financial advisor for personalized investment strategies."
        ];
        
        // Shuffle tips
        const shuffledTips = [...tips].sort(() => Math.random() - 0.5);
        
        // Update tip cards
        for (let i = 1; i <= 5; i++) {
            const tipCard = document.getElementById(`tip${i}`);
            if (tipCard) {
                tipCard.querySelector('p').textContent = shuffledTips[i-1];
            }
        }
        
        // Show first tip
        this.showTip('1');
        
        this.showToast('Financial tips refreshed!', 'success');
    },
    
    // Set current date on dashboard
    setCurrentDate: function() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('dashboardDate').textContent = 
            `Today is ${now.toLocaleDateString('en-US', options)}`;
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Add close event
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toastId);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeToast(toastId);
        }, 5000);
    },
    
    // Remove toast
    removeToast: function(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    },
    
    // Format date
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        
        // Handle both ISO format and DD/MM/YYYY format
        let date;
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            date = new Date(dateString);
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    // Format date and time
    formatDateTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Format time only
    formatTime: function(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Get user by ID
    getUserById: function(userId) {
        const users = this.getFromStorage('users') || [];
        return users.find(user => user.id === userId);
    },
    
    // Update user in storage
    updateUser: function(user) {
        const users = this.getFromStorage('users') || [];
        const index = users.findIndex(u => u.id === user.id);
        
        if (index !== -1) {
            users[index] = user;
            this.saveToStorage('users', users);
        }
        
        // Update session
        const session = this.getFromStorage('session');
        if (session && session.userId === user.id) {
            session.timestamp = new Date().toISOString();
            this.saveToStorage('session', session);
        }
    },
    
    // Save transaction
    saveTransaction: function(transaction) {
        const transactions = this.getFromStorage('transactions') || [];
        transactions.push(transaction);
        this.saveToStorage('transactions', transactions);
    },
    
    // Initialize sample data
    initializeSampleData: function() {
        // Check if sample data already exists
        if (this.getFromStorage('sampleDataInitialized')) {
            return;
        }
        
        // Create sample transactions for demo user
        const sampleTransactions = [
            {
                id: 'txn-001',
                userId: 'demo-user-001',
                ref: 'REF-2023-AB3DE-F5G7H9',
                type: 'deposit',
                status: 'success',
                amount: 5000.00,
                currency: 'USD',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                description: 'Salary Deposit',
                details: { depositType: 'wire' },
                fee: 50.00
            },
            {
                id: 'txn-002',
                userId: 'demo-user-001',
                ref: 'REF-2023-C1D2E-F3G4H5',
                type: 'transfer',
                status: 'success',
                amount: -250.00,
                currency: 'USD',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                description: 'Domestic Transfer to John Smith',
                details: { 
                    recipientName: 'John Smith',
                    accountNumber: '9876543210',
                    method: 'ach',
                    isDomestic: true
                },
                fee: 2.50
            },
            {
                id: 'txn-003',
                userId: 'demo-user-001',
                ref: 'REF-2023-I6J7K-L8M9N0',
                type: 'payment',
                status: 'success',
                amount: -150.75,
                currency: 'USD',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                description: 'Payment to Electric Company',
                details: { 
                    provider: 'Electric Company',
                    account: 'ACC-789456'
                },
                fee: 0
            },
            {
                id: 'txn-004',
                userId: 'demo-user-001',
                ref: 'REF-2023-O1P2Q-R3S4T5',
                type: 'crypto',
                status: 'success',
                amount: -1000.00,
                currency: 'USD',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                description: 'Purchase Bitcoin',
                details: { cryptoType: 'bitcoin' },
                fee: 5.00
            },
            {
                id: 'txn-005',
                userId: 'demo-user-001',
                ref: 'REF-2023-U6V7W-X8Y9Z0',
                type: 'flight',
                status: 'success',
                amount: -750.50,
                currency: 'USD',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                description: 'Flight Booking: NYC to LON',
                details: { 
                    from: 'New York (JFK)',
                    to: 'London (LHR)',
                    date: '2023-12-15',
                    passenger: 'Martin Lampard',
                    class: 'economy'
                },
                fee: 0
            }
        ];
        
        // Save sample transactions
        const existingTransactions = this.getFromStorage('transactions') || [];
        const allTransactions = [...existingTransactions, ...sampleTransactions];
        this.saveToStorage('transactions', allTransactions);
        
        // Mark sample data as initialized
        this.saveToStorage('sampleDataInitialized', true);
    },
    
    // LocalStorage helper functions
    saveToStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    getFromStorage: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    
    removeFromStorage: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    BankApp.init();
});