// Wavy™ — Digital Receipt System (Elite Edition)
// Built for Okami Nalado — Digital Empire Architect

// CONFIGURATION — REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://xuaugiixuqrtomkgbwvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YXVnaWl4dXFydG9ta2did3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTE2NDUsImV4cCI6MjA3ODk2NzY0NX0._uHk5cxdmFl2MIZetvwf_2y0Qw-ZJyAYE6yOG0wN78Y';
const PAYSTACK_PUBLIC_KEY = 'YOUR_PAYSTACK_PUBLIC_KEY';

// Initialize Supabase
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// DOM Elements
const elements = {
    landingPage: document.getElementById('landingPage'),
    merchantSection: document.getElementById('merchantSection'),
    customerSection: document.getElementById('customerSection'),
    merchantBtn: document.getElementById('merchantBtn'),
    customerBtn: document.getElementById('customerBtn'),
    backToLanding: document.getElementById('backToLanding'),
    customerBack: document.getElementById('customerBack'),
    authSection: document.getElementById('authSection'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    merchantName: document.getElementById('merchantName'),
    planTag: document.getElementById('planTag'),
    upgradeBtn: document.getElementById('upgradeBtn'),
    createReceiptForm: document.getElementById('createReceiptForm'),
    receiptItems: document.getElementById('receiptItems'),
    receiptAmount: document.getElementById('receiptAmount'),
    receiptDescription: document.getElementById('receiptDescription'),
    receiptToken: document.getElementById('receiptToken'),
    tokenValue: document.getElementById('tokenValue'),
    copyToken: document.getElementById('copyToken'),
    receiptHistory: document.getElementById('receiptHistory'),
    receiptList: document.getElementById('receiptList'),
    tokenForm: document.getElementById('tokenForm'),
    tokenInput: document.getElementById('tokenInput'),
    receiptDisplay: document.getElementById('receiptDisplay'),
    displayToken: document.getElementById('displayToken'),
    displayAmount: document.getElementById('displayAmount'),
    displayDate: document.getElementById('displayDate'),
    displayItems: document.getElementById('displayItems'),
    displayDescription: document.getElementById('displayDescription'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    paymentModal: document.getElementById('paymentModal'),
    closePaymentModal: document.getElementById('closePaymentModal'),
    paystackBtn: document.getElementById('paystackBtn'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    authForms: document.querySelectorAll('.auth-form')
};

// INIT
function initApp() {
    setupEventListeners();
    checkUserSession();
}

// EVENT LISTENERS
function setupEventListeners() {
    // Navigation
    elements.merchantBtn.addEventListener('click', () => showSection('merchant'));
    elements.customerBtn.addEventListener('click', () => showSection('customer'));
    elements.backToLanding.addEventListener('click', () => showSection('landing'));
    elements.customerBack.addEventListener('click', () => showSection('landing'));

    // Auth
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.signupForm.addEventListener('submit', handleSignup);
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
    });

    // Receipt
    elements.createReceiptForm.addEventListener('submit', handleCreateReceipt);
    elements.copyToken.addEventListener('click', copyTokenToClipboard);
    elements.upgradeBtn.addEventListener('click', openPaymentModal);

    // Payment
    elements.closePaymentModal.addEventListener('click', closePaymentModal);
    elements.paystackBtn.addEventListener('click', handlePaystackPayment);

    // Customer
    elements.tokenForm.addEventListener('submit', handleTokenSubmit);
    elements.exportPdfBtn.addEventListener('click', exportReceiptAsPDF);
}

// SHOW SECTION
function showSection(section) {
    elements.landingPage.style.display = 'none';
    elements.merchantSection.style.display = 'none';
    elements.customerSection.style.display = 'none';

    if (section === 'landing') elements.landingPage.style.display = 'block';
    if (section === 'merchant') elements.merchantSection.style.display = 'block';
    if (section === 'customer') elements.customerSection.style.display = 'block';

    // Reset forms
    if (section === 'merchant') {
        elements.authSection.style.display = 'block';
        elements.dashboard.style.display = 'none';
        elements.receiptToken.style.display = 'none';
        elements.receiptHistory.style.display = 'none';
    }

    // Animate in
    document.querySelectorAll('.hero, .dashboard, .customer-view').forEach(el => {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'fadeInUp 0.6s ease-out forwards';
    });
}

// SWITCH AUTH TAB
function switchAuthTab(tab) {
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    elements.authForms.forEach(form => {
        form.style.display = form.id === `${tab}Form` ? 'block' : 'none';
    });
}

// LOGIN
async function handleLogin(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: elements.loginEmail.value,
        password: elements.loginPassword.value
    });
    if (error) return alert('Login failed: ' + error.message);
    currentUser = data.user;
    await loadMerchantDashboard();
    elements.authSection.style.display = 'none';
    elements.dashboard.style.display = 'block';
    elements.loginForm.reset();
}

// SIGNUP
async function handleSignup(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
        email: elements.signupEmail.value,
        password: elements.signupPassword.value,
        options: { data: { name: elements.signupName.value, role: 'merchant', plan: 'free' } }
    });
    if (error) return alert('Signup failed: ' + error.message);
    currentUser = data.user;
    await loadMerchantDashboard();
    elements.authSection.style.display = 'none';
    elements.dashboard.style.display = 'block';
    elements.signupForm.reset();
}

// LOAD DASHBOARD
async function loadMerchantDashboard() {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    if (error) return;

    elements.merchantName.textContent = user.name;
    elements.planTag.textContent = user.plan === 'premium' ? 'Premium Plan' : 'Free Plan';
    elements.planTag.className = 'plan-tag ' + (user.plan === 'premium' ? 'premium' : '');
    elements.receiptHistory.style.display = user.plan === 'premium' ? 'block' : 'none';
    if (user.plan === 'premium') await loadReceiptHistory();
}

// LOAD RECEIPT HISTORY
async function loadReceiptHistory() {
    const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('merchant_id', currentUser.id)
        .order('created_at', { ascending: false });
    if (error) return;

    elements.receiptList.innerHTML = receipts.map(r => `
        <div class="receipt-item">
            <span class="receipt-token">${r.token}</span>
            <span class="receipt-amount">₦${r.amount}</span>
        </div>
    `).join('');
}

// GENERATE TOKEN
function generateUniqueToken() {
    return Array(6).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
}

// CREATE RECEIPT
async function handleCreateReceipt(e) {
    e.preventDefault();
    const items = elements.receiptItems.value.trim();
    const amount = parseFloat(elements.receiptAmount.value);
    const description = elements.receiptDescription.value.trim();

    if (!items || !amount) return alert('All fields required.');

    const token = generateUniqueToken();

    const { data, error } = await supabase
        .from('receipts')
        .insert([{
            merchant_id: currentUser.id,
            token,
            items,
            amount,
            description: description || null
        }]);

    if (error) return alert('Failed to save receipt.');

    elements.tokenValue.textContent = token;
    elements.receiptToken.style.display = 'block';
    elements.createReceiptForm.reset();

    if (elements.planTag.classList.contains('premium')) await loadReceiptHistory();
}

// COPY TOKEN
function copyTokenToClipboard() {
    navigator.clipboard.writeText(elements.tokenValue.textContent).then(() => {
        alert('Token copied to clipboard!');
    });
}

// OPEN PAYSTACK MODAL
function openPaymentModal() {
    elements.paymentModal.classList.add('active');
}

// CLOSE PAYSTACK MODAL
function closePaymentModal() {
    elements.paymentModal.classList.remove('active');
}

// PAYSTACK PAYMENT
function handlePaystackPayment() {
    if (!currentUser) {
        alert('Please login first.');
        return;
    }

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: 500000, // 5,000 NGN
        currency: 'NGN',
        ref: `wavy-upgrade-${Date.now()}-${currentUser.id}`,
        metadata: {
            custom_fields: [
                { display_name: "User ID", variable_name: "user_id", value: currentUser.id },
                { display_name: "Upgrade Type", variable_name: "upgrade_type", value: "premium" }
            ]
        },
        callback: async (response) => {
            const { error } = await supabase
                .from('users')
                .update({ plan: 'premium', last_payment_ref: response.reference })
                .eq('id', currentUser.id);

            if (error) return alert('Payment confirmed, but account upgrade failed. Contact support.');

            elements.planTag.textContent = 'Premium Plan';
            elements.planTag.className = 'plan-tag premium';
            elements.receiptHistory.style.display = 'block';
            await loadReceiptHistory();
            closePaymentModal();
            alert('✅ You are now a Premium Merchant. Welcome to the elite tier.');
        },
        onClose: () => console.log('Payment window closed')
    });

    handler.openIframe();
}

// CUSTOMER VIEW
async function handleTokenSubmit(e) {
    e.preventDefault();
    const token = elements.tokenInput.value.trim().toUpperCase();

    if (token.length !== 6) return alert('Invalid token. Must be 6 characters.');

    const { data: receipt, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('token', token)
        .single();

    if (error || !receipt) return alert('Receipt not found. Please verify the token.');

    elements.displayToken.textContent = receipt.token;
    elements.displayAmount.textContent = receipt.amount;
    elements.displayDate.textContent = new Date(receipt.created_at).toLocaleString();
    elements.displayItems.textContent = receipt.items;
    elements.displayDescription.innerHTML = receipt.description ? `<p><strong>Description:</strong> ${receipt.description}</p>` : '';

    elements.tokenForm.style.display = 'none';
    elements.receiptDisplay.style.display = 'block';
}

// EXPORT PDF
async function exportReceiptAsPDF() {
    const { jsPDF } = window.jspdf;
    const receiptContent = document.getElementById('receiptContent');

    const canvas = await html2canvas(receiptContent, {
        backgroundColor: '#0F0F0F',
        scale: 2
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`receipt-${elements.displayToken.textContent}.pdf`);
}

// CHECK SESSION
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadMerchantDashboard();
        showSection('merchant');
    }
}

// INIT ON LOAD
document.addEventListener('DOMContentLoaded', initApp);

// AUTH STATE LISTENER
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        currentUser = null;
        showSection('landing');
    }
});