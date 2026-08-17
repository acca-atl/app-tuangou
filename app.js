const DEFAULT_CATALOG = [
  { id: 'tianjin-baozi', name: '天津包子', unit: '12个/盒', price: 18 },
  { id: 'cai-rou-baozi', name: '菜肉包子', unit: '12个/盒', price: 18 },
  { id: 'jiu-cai-he-zi', name: '韭菜盒子', unit: '4个/盒', price: 18 },
  { id: 'gan-ceng-rou-bing', name: '干层肉饼', unit: '2个/盒', price: 18 },
  { id: 'dou-bao', name: '豆包', unit: '9个/盒', price: 16 },
  { id: 'jiu-cai-zhu-rou-shui-jiao', name: '韭菜猪肉水饺', unit: '50粒', price: 30 },
  { id: 'bai-cai-zhu-rou-shui-jiao', name: '白菜猪肉水饺', unit: '50粒', price: 30 },
  { id: 'ji-cai-zhu-rou-shui-jiao', name: '荠菜猪肉水饺', unit: '50粒', price: 30 },
  { id: 'ji-rou-yu-mi-shui-jiao', name: '鸡肉玉米水饺', unit: '50粒', price: 30 },
  { id: 'zhu-rou-qin-cai-shui-jiao', name: '猪肉芹菜水饺', unit: '50粒', price: 30 },
  { id: 'san-xian-shui-jiao', name: '三鲜水饺', unit: '50粒/袋', price: 33 },
  { id: 'yu-rou-shui-jiao', name: '鱼肉水饺', unit: '50粒/袋', price: 33 },
  { id: 'xian-xia-shui-jiao', name: '鲜虾水饺', unit: '50粒/袋', price: 34 },
  { id: 'xian-xia-hun-tun', name: '鲜虾馄饨', unit: '100粒/袋', price: 35 },
  { id: 'ji-cai-zhu-rou-hun-tun', name: '荠菜猪肉馄饨', unit: '100粒', price: 32 }
];

let catalog = [...DEFAULT_CATALOG];

const selection = new Map();
const catalogEl = document.querySelector('#catalog');
const catalogModal = document.querySelector('#catalog-modal');
const openCatalogButton = document.querySelector('#open-catalog-btn');
const editOrderButton = document.querySelector('#edit-order-btn');
const closeCatalogButton = document.querySelector('#close-catalog-btn');
const saveOrderButton = document.querySelector('#save-order-btn');
const signupForm = document.querySelector('#signup-form');
const selectedCountEl = document.querySelector('#selected-count');
const totalPriceEl = document.querySelector('#total-price');
const orderCountEl = document.querySelector('#order-count');
const itemCountEl = document.querySelector('#item-count');
const revenueTotalEl = document.querySelector('#revenue-total');
const reportItemsEl = document.querySelector('#report-items');
const refreshButton = document.querySelector('#refresh-report');

let db = null;
let firebaseReady = false;
let editingOrderId = null;
let reportOrders = [];

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function showStatus(message, type = 'success') {
  const existing = signupForm.querySelector('.status-message');
  if (existing) existing.remove();

  const status = document.createElement('div');
  status.className = `status-message ${type}`;
  status.textContent = message;
  signupForm.appendChild(status);
}

function openCatalogModal(orderId = null) {
  if (!catalogModal) {
    return;
  }

  editingOrderId = orderId;
  if (orderId) {
    const order = reportOrders.find((entry) => entry.id === orderId);
    selection.clear();
    if (order && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        if (quantity > 0) {
          selection.set(item.id, quantity);
        }
      });
    }
    if (saveOrderButton) {
      saveOrderButton.classList.remove('hidden');
    }
  } else if (saveOrderButton) {
    saveOrderButton.classList.add('hidden');
  }

  catalogModal.classList.add('is-open');
  renderCatalog();
  updateSelectionSummary();
}

function closeCatalogModal() {
  if (catalogModal) {
    catalogModal.classList.remove('is-open');
  }

  if (saveOrderButton) {
    saveOrderButton.classList.add('hidden');
  }

  editingOrderId = null;
}

function updateSelectionSummary() {
  let total = 0;
  let count = 0;

  selection.forEach((quantity, id) => {
    const item = catalog.find((entry) => entry.id === id);
    if (item) {
      total += item.price * quantity;
      count += quantity;
    }
  });

  selectedCountEl.textContent = String(count);
  totalPriceEl.textContent = formatCurrency(total);
}

function renderCatalog() {
  catalogEl.innerHTML = catalog
    .map((item) => {
      const qty = selection.get(item.id) || 0;
      const isSelected = qty > 0;
      return `
        <div class="catalog-item ${isSelected ? 'selected' : ''}" data-id="${item.id}">
          <div class="catalog-item-main">
            <span class="catalog-item-name">${item.name}</span>
            <span class="catalog-item-unit">${item.unit}</span>
          </div>
          <div class="catalog-item-price">${formatCurrency(item.price)}</div>
          <div class="stepper ${isSelected ? 'selected-stepper' : ''}" aria-label="Select quantity for ${item.name}">
            <button type="button" data-action="decrease" data-id="${item.id}">−</button>
            <span>${qty}</span>
            <button type="button" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
      `;
    })
    .join('');

  catalogEl.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const { id, action } = button.dataset;
      const current = selection.get(id) || 0;
      const next = action === 'increase' ? current + 1 : Math.max(current - 1, 0);

      if (next === 0) {
        selection.delete(id);
      } else {
        selection.set(id, next);
      }

      renderCatalog();
      updateSelectionSummary();
    });
  });
}

if (openCatalogButton) {
  openCatalogButton.addEventListener('click', () => openCatalogModal());
}

if (editOrderButton) {
  editOrderButton.addEventListener('click', () => openCatalogModal());
}

if (closeCatalogButton) {
  closeCatalogButton.addEventListener('click', () => {
    if (editingOrderId) {
      closeCatalogModal();
      return;
    }
    closeCatalogModal();
  });
}

if (saveOrderButton) {
  saveOrderButton.addEventListener('click', async () => {
    if (!editingOrderId || !firebaseReady || !db) {
      closeCatalogModal();
      return;
    }

    const items = [...selection.entries()].map(([id, quantity]) => {
      const product = catalog.find((entry) => entry.id === id);
      if (!product) {
        return null;
      }
      return {
        id: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity
      };
    }).filter(Boolean);

    if (!items.length) {
      showStatus('至少选择一件商品。', 'error');
      return;
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    try {
      await db.collection('tuangou').doc(editingOrderId).update({
        items,
        total,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      const report = await fetchReport();
      renderReport(report);
      selection.clear();
      closeCatalogModal();
      showStatus('订单已更新。', 'success');
    } catch (error) {
      console.error(error);
      showStatus('更新失败，请稍后再试。', 'error');
    }
  });
}

if (catalogModal) {
  catalogModal.addEventListener('click', (event) => {
    if (event.target === catalogModal) {
      closeCatalogModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && catalogModal && catalogModal.classList.contains('is-open')) {
    closeCatalogModal();
  }
});

function initFirebase() {
  const config = window.firebaseConfig || {};

  if (!config.apiKey || !config.projectId || config.apiKey.includes('YOUR_')) {
    console.warn('Firebase config is not set. Update firebase-config.js first.');
    return false;
  }

  firebase.initializeApp(config);
  db = firebase.firestore();
  firebaseReady = true;
  return true;
}

async function ensureCatalogDocument() {
  if (!firebaseReady || !db) {
    return;
  }

  const catalogRef = db.collection('tuangou').doc('catalog');
  const snapshot = await catalogRef.get();

  if (!snapshot.exists) {
    await catalogRef.set({
      items: DEFAULT_CATALOG,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    catalog = [...DEFAULT_CATALOG];
    return;
  }

  const data = snapshot.data() || {};
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.catalog)
      ? data.catalog
      : DEFAULT_CATALOG;

  catalog = items;
}

async function fetchReport() {
  if (!firebaseReady || !db) {
    return {
      totalOrders: 0,
      totalItems: 0,
      totalRevenue: 0,
      catalogSummary: [],
      orders: []
    };
  }

  const snapshot = await db.collection('tuangou').get();

  const summaryMap = new Map();
  const orders = [];
  let totalOrders = 0;
  let totalItems = 0;
  let totalRevenue = 0;

  snapshot.forEach((doc) => {
    if (doc.id === 'catalog' || doc.id === 'liujie') {
      return;
    }

    totalOrders += 1;
    const order = doc.data();
    const items = order.items || [];
    const customerOrder = {
      id: doc.id,
      name: order.name || '未填写姓名',
      total: Number(order.total || 0),
      note: order.notes || '',
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity || 0)
      }))
    };
    orders.push(customerOrder);

    items.forEach((item) => {
      const key = item.id;
      const current = summaryMap.get(key) || { name: item.name, quantity: 0, revenue: 0 };
      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.quantity || 0) * Number(item.price || 0);
      summaryMap.set(key, current);
      totalItems += Number(item.quantity || 0);
      totalRevenue += Number(item.quantity || 0) * Number(item.price || 0);
    });
  });

  const catalogSummary = [...summaryMap.values()].sort((a, b) => b.quantity - a.quantity);
  return { totalOrders, totalItems, totalRevenue, catalogSummary, orders };
}

function renderReport(report) {
  reportOrders = report.orders || [];

  orderCountEl.textContent = String(report.totalOrders || 0);
  itemCountEl.textContent = String(report.totalItems || 0);
  revenueTotalEl.textContent = formatCurrency(report.totalRevenue || 0);

  if (!report.catalogSummary || !report.catalogSummary.length) {
    reportItemsEl.innerHTML = '<div class="report-item"><span>暂无订单</span></div>';
  } else {
    reportItemsEl.innerHTML = report.catalogSummary
      .map(
        (item) => `
          <div class="report-item">
            <span>${item.name}</span>
            <strong>${item.quantity} 份 / ${formatCurrency(item.revenue)}</strong>
          </div>
        `
      )
      .join('');
  }

  const ordersEl = document.querySelector('#report-orders');
  if (!ordersEl) {
    return;
  }

  if (!report.orders || !report.orders.length) {
    ordersEl.innerHTML = '<div class="report-order"><div>暂无报名名单</div></div>';
    return;
  }

  ordersEl.innerHTML = report.orders
    .map(
      (order) => `
        <div class="report-order" data-order-id="${order.id}">
          <div class="report-order-header">
            <span>${order.name}</span>
            <span>${formatCurrency(order.total)}</span>
          <button class="secondary-btn update-order-btn" type="button" data-order-id="${order.id}">更新订单</button></div>
          <ul class="report-order-items">
            ${order.items
              .map((item) => `<li>${item.name} × ${item.quantity}</li>`)
              .join('')}
          </ul>
          ${order.note ? `<div class="report-order-note">备注：${order.note}</div>` : ''}
        </div>
      `
    )
    .join('');

  ordersEl.querySelectorAll('.update-order-btn').forEach((button) => {
    button.addEventListener('click', () => {
      openCatalogModal(button.dataset.orderId);
    });
  });
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!firebaseReady || !db) {
    showStatus('请先在 firebase-config.js 中填入 Firebase 配置。', 'error');
    return;
  }

  const formData = new FormData(signupForm);
  const name = String(formData.get('name') || '').trim();
  const notes = String(formData.get('notes') || '').trim();

  if (!name) {
    showStatus('姓名为必填项。', 'error');
    return;
  }

  if (selection.size === 0) {
    showStatus('至少选择一件商品。', 'error');
    return;
  }

  const items = [...selection.entries()].map(([id, quantity]) => {
    const product = catalog.find((entry) => entry.id === id);
    return {
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity
    };
  });

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  try {
    await db.collection('tuangou').add({
      name,
      notes,
      items,
      total,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    signupForm.reset();
    selection.clear();
    renderCatalog();
    updateSelectionSummary();
    showStatus(`报名成功！总金额 ${formatCurrency(total)}。`, 'success');

    const report = await fetchReport();
    renderReport(report);
  } catch (error) {
    console.error(error);
    showStatus('提交失败，请检查 Firestore 配置。', 'error');
  }
});

refreshButton.addEventListener('click', async () => {
  const report = await fetchReport();
  renderReport(report);
});

(async function init() {
  renderCatalog();
  updateSelectionSummary();

  const ready = initFirebase();
  if (ready) {
    await ensureCatalogDocument();
    renderCatalog();
    updateSelectionSummary();
    const report = await fetchReport();
    renderReport(report);
  } else {
    renderReport({ totalOrders: 0, totalItems: 0, totalRevenue: 0, catalogSummary: [] });
    const warning = document.createElement('div');
    warning.className = 'status-message error';
    warning.textContent = 'Firebase 未配置；请在 firebase-config.js 中填入你的 Web SDK 配置。';
    signupForm.appendChild(warning);
  }
})();
