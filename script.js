// ============================================
// Constants & Configuration
// ============================================
const STORAGE_KEYS = {
    MENU_ITEMS: 'restaurant_menuItems',
    BILLS: 'restaurant_bills',
    THEME: 'restaurant_theme'
};

// Current state
let currentCart = [];
let currentEditItemId = null;

// ============================================
// LocalStorage Functions
// ============================================

function initStorage() {
    const sampleItems = [
        { id: '1', name: 'Idly', price: 40, imageUrl: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Idly' },
        { id: '2', name: 'Vada', price: 35, imageUrl: 'https://images.pexels.com/photos/11143720/pexels-photo-11143720.jpeg' },
        { id: '3', name: 'Dosa', price: 60, imageUrl: 'https://via.placeholder.com/400x300/f39c12/ffffff?text=Dosa' },
        { id: '4', name: 'Poori', price: 50, imageUrl: 'https://images.pexels.com/photos/8477234/pexels-photo-8477234.jpeg' },
        { id: '5', name: 'Pongal', price: 55, imageUrl: 'https://images.pexels.com/photos/8477227/pexels-photo-8477227.jpeg' },
        { id: '6', name: 'Puttu', price: 45, imageUrl: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg' }
    ];

    const existingItems = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    let shouldInitialize = true;
    
    if (existingItems) {
        try {
            const parsed = JSON.parse(existingItems);
            if (Array.isArray(parsed) && parsed.length > 0) shouldInitialize = false;
        } catch (e) { console.warn('Invalid menu items, reinitializing...'); }
    }
    
    if (shouldInitialize) localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(sampleItems));
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    applyTheme(localStorage.getItem(STORAGE_KEYS.THEME));
}

function getMenuItems() {
    const items = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    return items ? JSON.parse(items) : [];
}

function saveMenuItem(item) {
    const items = getMenuItems();
    if (item.id && items.find(i => i.id === item.id)) {
        const index = items.findIndex(i => i.id === item.id);
        items[index] = item;
    } else {
        item.id = Date.now().toString();
        items.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
    return item;
}

function deleteMenuItem(itemId) {
    const items = getMenuItems();
    const filtered = items.filter(item => item.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(filtered));
}

function saveBill(bill) {
    const bills = getBills();
    bill.id = Date.now().toString();
    bill.date = new Date().toISOString();
    bills.push(bill);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    return bill;
}

function getBills() {
    const bills = localStorage.getItem(STORAGE_KEYS.BILLS);
    return bills ? JSON.parse(bills) : [];
}

// ============================================
// Menu Display Functions
// ============================================

function renderMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    const items = getMenuItems();

    if (items.length === 0) {
        menuGrid.innerHTML = '<p class="empty-cart">No menu items available. Add items in Manage Items section.</p>';
        return;
    }

    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item-card" data-item-id="${item.id}">
            <img src="${item.imageUrl}" alt="${item.name}" class="menu-item-image" 
                 onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                <div class="menu-item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn" data-action="decrease" data-item-id="${item.id}" type="button">-</button>
                        <span class="quantity-display" id="qty-${item.id}">${getCartQuantity(item.id)}</span>
                        <button class="qty-btn" data-action="increase" data-item-id="${item.id}" type="button">+</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getCartQuantity(itemId) {
    const cartItem = currentCart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
}

function updateQuantity(itemId, change) {
    const items = getMenuItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const cartItemIndex = currentCart.findIndex(ci => ci.id === itemId);

    if (cartItemIndex >= 0) {
        currentCart[cartItemIndex].quantity += change;
        if (currentCart[cartItemIndex].quantity <= 0) {
            currentCart.splice(cartItemIndex, 1);
        }
    } else {
        if (change > 0) {
            currentCart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1
            });
        }
    }

    const qtyDisplay = document.getElementById(`qty-${itemId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = getCartQuantity(itemId);
    }

    updateBillingPanel();
}

// ============================================
// Billing Functions
// ============================================

function updateBillingPanel() {
    const billingItems = document.getElementById('billingItems');
    
    if (currentCart.length === 0) {
        billingItems.innerHTML = '<p class="empty-cart">No items selected</p>';
    } else {
        billingItems.innerHTML = currentCart.map(item => `
            <div class="billing-item">
                <div class="billing-item-info">
                    <div class="billing-item-name">${item.name}</div>
                    <div class="billing-item-details">
                        ${item.quantity} × ₹${item.price.toFixed(2)}
                    </div>
                </div>
                <div class="billing-item-total">₹${(item.quantity * item.price).toFixed(2)}</div>
                <div class="billing-item-controls">
                    <button class="qty-btn btn-small" onclick="event.stopPropagation(); updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="qty-btn btn-small" onclick="event.stopPropagation(); updateQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }

    calculateTotals();
}

function calculateTotals() {
    const grandTotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('grandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
}

function generateBill() {
    if (currentCart.length === 0) {
        showNotification('Please add items to cart first', 'warning');
        return;
    }

    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const bill = {
        items: currentCart.map(item => ({
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total
    };

    saveBill(bill);
    showNotification('Bill generated successfully!', 'success');
    
    // Print the bill
    printBill();
    
    // Clear cart
    currentCart = [];
    renderMenuItems();
    updateBillingPanel();
}

function clearBill() {
    if (currentCart.length === 0) {
        showNotification('Cart is already empty', 'info');
        return;
    }

    if (confirm('Are you sure you want to clear the cart?')) {
        currentCart = [];
        renderMenuItems();
        updateBillingPanel();
        showNotification('Cart cleared', 'success');
    }
}

function printBill() {
    if (currentCart.length === 0) {
        showNotification('No items to print', 'warning');
        return;
    }

    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const printBillDiv = document.getElementById('printBill');
    const printDate = document.getElementById('printDate');
    const printItems = document.getElementById('printItems');
    const printSummary = document.getElementById('printSummary');

    printDate.textContent = `Date: ${new Date().toLocaleString()}`;
    
    printItems.innerHTML = currentCart.map(item => `
        <div class="print-item">
            <div>
                <strong>${item.name}</strong><br>
                ${item.quantity} × ₹${item.price.toFixed(2)}
            </div>
            <div>₹${(item.quantity * item.price).toFixed(2)}</div>
        </div>
    `).join('');

    printSummary.innerHTML = `
        <div class="summary-row total-row">
            <span>Grand Total:</span>
            <span>₹${total.toFixed(2)}</span>
        </div>
    `;

    printBillDiv.style.display = 'block';
    window.print();
    printBillDiv.style.display = 'none';
}

// ============================================
// Payment & QR Functions (New Added)
// ============================================

function showQRModal() {
    if (currentCart.length === 0) {
        showNotification('Cart is empty!', 'warning');
        return;
    }

    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const modal = document.getElementById('paymentModal');
    const amountDisplay = document.getElementById('payAmountDisplay');
    const qrContainer = document.getElementById('qrcode');

    // Show Modal
    modal.style.display = 'flex';
    amountDisplay.textContent = `₹${total.toFixed(2)}`;
    
    // Clear previous QR
    qrContainer.innerHTML = '';

    // UPI Payment Link Format
    const upiLink = `upi://pay?pa=9703757210@ibl&pn=Balaji%20Restaurant&am=${total.toFixed(2)}&cu=INR`;

    // Generate QR Code
    new QRCode(qrContainer, {
        text: upiLink,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function confirmPaymentAndPrint() {
    closePaymentModal();
    showNotification('Payment Received! Printing Bill...', 'success');
    generateBill(); 
}

// ============================================
// Owner Panel Functions
// ============================================

function renderManageItems() {
    const itemsGrid = document.getElementById('itemsGrid');
    const items = getMenuItems();

    if (items.length === 0) {
        itemsGrid.innerHTML = '<p class="empty-cart">No items available. Add your first item below.</p>';
        return;
    }

    itemsGrid.innerHTML = items.map(item => `
        <div class="manage-item-card">
            <img src="${item.imageUrl}" alt="${item.name}" class="manage-item-image"
                 onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="manage-item-info">
                <div class="manage-item-name">${item.name}</div>
                <div class="manage-item-price">₹${item.price.toFixed(2)}</div>
                <div class="manage-item-actions">
                    <button class="btn btn-primary btn-small" onclick="editItem('${item.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="handleDeleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddItemForm() {
    currentEditItemId = null;
    document.getElementById('formTitle').textContent = 'Add New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('editItemId').value = '';
    document.getElementById('submitItemBtn').textContent = 'Add Item';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function editItem(itemId) {
    const items = getMenuItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    currentEditItemId = itemId;
    document.getElementById('formTitle').textContent = 'Edit Item';
    document.getElementById('editItemId').value = itemId;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImageUrl').value = item.imageUrl;
    document.getElementById('submitItemBtn').textContent = 'Update Item';
    document.getElementById('cancelEditBtn').style.display = 'block';
    document.querySelector('.item-form-container').scrollIntoView({ behavior: 'smooth' });
}

function handleAddItem(event) {
    event.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);
    const imageUrl = document.getElementById('itemImageUrl').value.trim();

    if (!name || !price || !imageUrl) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    if (price <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return;
    }

    const item = {
        id: currentEditItemId,
        name: name,
        price: price,
        imageUrl: imageUrl
    };

    saveMenuItem(item);
    showNotification(currentEditItemId ? 'Item updated successfully!' : 'Item added successfully!', 'success');
    showAddItemForm();
    renderManageItems();
    renderMenuItems();
}

function handleDeleteItem(itemId) {
    const items = getMenuItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        deleteMenuItem(itemId);
        showNotification('Item deleted successfully!', 'success');
        renderManageItems();
        renderMenuItems();
        currentCart = currentCart.filter(ci => ci.id !== itemId);
        updateBillingPanel();
    }
}

// ============================================
// Reports Functions
// ============================================

function renderDailyReport() {
    const bills = getBills();
    const selectedDate = document.getElementById('dailyReportDate').value;
    const tbody = document.getElementById('dailyReportBody');

    if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No bills available</td></tr>';
        return;
    }

    const dailyData = {};
    bills.forEach(bill => {
        const date = new Date(bill.date).toLocaleDateString();
        if (selectedDate) {
            const billDate = new Date(bill.date).toISOString().split('T')[0];
            if (billDate !== selectedDate) return;
        }

        if (!dailyData[date]) {
            dailyData[date] = { date: date, itemsSold: 0, revenue: 0 };
        }
        bill.items.forEach(item => {
            dailyData[date].itemsSold += item.quantity;
        });
        dailyData[date].revenue += bill.total;
    });

    const dailyArray = Object.values(dailyData).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (dailyArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No data for selected date</td></tr>';
        return;
    }

    tbody.innerHTML = dailyArray.map(day => `
        <tr>
            <td>${day.date}</td>
            <td>${day.itemsSold}</td>
            <td>₹${day.revenue.toFixed(2)}</td>
        </tr>
    `).join('');

    renderChart(dailyArray);
}

function renderMonthlyReport() {
    const bills = getBills();
    const selectedMonth = document.getElementById('monthlyReportMonth').value;
    const tbody = document.getElementById('monthlyReportBody');
    const itemWiseStats = document.getElementById('itemWiseStats');

    if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No bills available</td></tr>';
        itemWiseStats.innerHTML = '';
        return;
    }

    const monthlyData = {};
    const itemStats = {};

    bills.forEach(bill => {
        const date = new Date(bill.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (selectedMonth && monthKey !== selectedMonth) return;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthName, revenue: 0, itemsSold: 0 };
        }

        bill.items.forEach(item => {
            monthlyData[monthKey].itemsSold += item.quantity;
            monthlyData[monthKey].revenue += bill.total;

            if (!itemStats[item.itemId]) {
                itemStats[item.itemId] = { name: item.name, quantity: 0 };
            }
            itemStats[item.itemId].quantity += item.quantity;
        });
    });

    const monthlyArray = Object.values(monthlyData).sort((a, b) => new Date(b.month) - new Date(a.month));

    if (monthlyArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No data for selected month</td></tr>';
        itemWiseStats.innerHTML = '';
        return;
    }

    tbody.innerHTML = monthlyArray.map(month => `
        <tr>
            <td>${month.month}</td>
            <td>₹${month.revenue.toFixed(2)}</td>
            <td>${month.itemsSold}</td>
        </tr>
    `).join('');

    if (Object.keys(itemStats).length > 0) {
        const itemStatsArray = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);
        itemWiseStats.innerHTML = `
            <h4>Item-wise Sales</h4>
            ${itemStatsArray.map(stat => `
                <div class="item-stat-item">
                    <span>${stat.name}</span>
                    <span><strong>${stat.quantity}</strong> sold</span>
                </div>
            `).join('')}
        `;
    } else {
        itemWiseStats.innerHTML = '';
    }
}

function renderChart(data) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#eaeaea' : '#2c3e50';
    ctx.strokeStyle = isDark ? '#eaeaea' : '#2c3e50';

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const barWidth = chartWidth / data.length;
    const colors = ['#4a90e2', '#50c878', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

    data.forEach((day, index) => {
        const barHeight = (day.revenue / maxRevenue) * chartHeight;
        const x = padding + (index * barWidth) + (barWidth * 0.1);
        const y = height - padding - barHeight;
        const w = barWidth * 0.8;

        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, y, w, barHeight);

        ctx.fillStyle = isDark ? '#eaeaea' : '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(day.date, x + w / 2, height - padding + 20);
        ctx.fillText(`₹${day.revenue.toFixed(0)}`, x + w / 2, y - 5);
    });
}

function toggleTheme() {
    const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    applyTheme(newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function switchTab(tabName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tabName}-section`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'menu') {
        renderMenuItems();
        updateBillingPanel();
    } else if (tabName === 'manage') {
        renderManageItems();
    } else if (tabName === 'reports') {
        renderDailyReport();
        renderMonthlyReport();
    }
}

// ============================================
// Event Listeners (FIXED)
// ============================================

function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Billing actions
    // FIXED: Changed from Generate Bill to Generate QR
    const generateQRBtn = document.getElementById('generateQRBtn');
    if(generateQRBtn) {
        generateQRBtn.addEventListener('click', showQRModal);
    }
    
    document.getElementById('clearBillBtn').addEventListener('click', clearBill);

    // Item form
    document.getElementById('itemForm').addEventListener('submit', handleAddItem);
    document.getElementById('cancelEditBtn').addEventListener('click', showAddItemForm);

    // Reports
    document.getElementById('viewDailyReportBtn').addEventListener('click', renderDailyReport);
    document.getElementById('viewMonthlyReportBtn').addEventListener('click', renderMonthlyReport);

    // Menu grid event delegation (FIXED: Consolidated logic)
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.addEventListener('click', (e) => {
        // 1. Check if a Quantity Button was clicked
        const qtyBtn = e.target.closest('.qty-btn');
        
        if (qtyBtn) {
            e.stopPropagation(); 
            const action = qtyBtn.dataset.action;
            const itemId = qtyBtn.dataset.itemId;
            
            if (action === 'increase') {
                updateQuantity(itemId, 1);
            } else if (action === 'decrease') {
                updateQuantity(itemId, -1);
            }
            return;
        }

        // 2. If not a button, check if the Card was clicked (to add item)
        const menuCard = e.target.closest('.menu-item-card');
        if (menuCard) {
            const itemId = menuCard.dataset.itemId;
            updateQuantity(itemId, 1);
        }
    });

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('dailyReportDate').value = today;
    document.getElementById('monthlyReportMonth').value = currentMonth;
}

// ============================================
// Initialization
// ============================================

function init() {
    initStorage();
    initEventListeners();
    renderMenuItems();
    renderManageItems();
    updateBillingPanel();
    renderDailyReport();
    renderMonthlyReport();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}