
const app = document.getElementById('app');
const title = document.getElementById('title');
const status = document.getElementById('status');
const pageDescription = document.getElementById('page-description');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const installBtn = document.getElementById('install-btn');

let currentPage = 'dashboard';
const uri = window.location.origin;
let authToken = localStorage.getItem('phone-stock-token');
let deferredInstallPrompt;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;

  if (installBtn && authToken) {
    installBtn.hidden = false;
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;

  if (installBtn) {
    installBtn.hidden = true;
  }
});

// ======================================================
// HELPERS
// ======================================================

const money = (n) => {
  return `₦${Number(n || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};


const dateTime = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};


const dateOnly = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-NG', {
    dateStyle: 'medium'
  });
};


function setStatus(message = '', type = '') {
  status.textContent = message;
  status.className = type;
}


function setLoading() {
  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}


function escapeHTML(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ======================================================
// API
// ======================================================

async function api(url, options = {}) {

  const requestUrl = new URL(url, `${uri}/`).toString();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(requestUrl, config);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('Server returned an invalid response');
  }

  if (!response.ok) {
    if (response.status === 401 && !requestUrl.includes('/api/auth/')) {
      authToken = null;
      localStorage.removeItem('phone-stock-token');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      } else {
        showAuthScreen();
      }

      const authError = new Error('Authentication expired. Please sign in again.');
      authError.code = 'AUTH_REQUIRED';
      throw authError;
    }

    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function saveAuth(data) {
  authToken = data.token;
  localStorage.setItem('phone-stock-token', authToken);
  window.history.replaceState({}, '', '/dashboard');
  document.body.classList.remove('auth-mode');

  if (logoutBtn) {
    logoutBtn.hidden = false;
  }

  if (installBtn && deferredInstallPrompt) {
    installBtn.hidden = false;
  }
}

function showAuthScreen() {
  const registering = window.location.pathname === '/signup';

  document.body.classList.add('auth-mode');

  if (logoutBtn) {
    logoutBtn.hidden = true;
  }

  title.textContent = registering ? 'Create account' : 'Sign in';
  pageDescription.textContent = registering
    ? 'Set up your workspace in under a minute'
    : 'Sign in to manage your phone stock';
  setStatus('', '');

  app.innerHTML = `
    <div class="auth-page">
      <section class="auth-story">
        <a class="auth-brand" href="/login" aria-label="Stock Manager home">
          <span class="auth-brand-mark">S</span>
          <span>STOCK<span>MANAGER</span></span>
        </a>

        <div class="auth-story-copy">
          <p class="auth-kicker">PHONE PARTS / INVENTORY OS</p>
          <h1>${registering ? 'Build a sharper stockroom.' : 'Know what moves.'}</h1>
          <p class="auth-lede">
            ${registering
              ? 'One calm command center for products, purchases, sales, and profit.'
              : 'Every product, purchase, sale, and naira accounted for.'}
          </p>
        </div>

        <div class="auth-story-footer">
          <span class="auth-pulse"></span>
          <span>Private workspace. Your data stays yours.</span>
        </div>
      </section>

      <section class="auth-card-wrap">
        <div class="auth-card">
          <div class="auth-card-topline">
            <span>${registering ? '01 / JOIN' : '02 / RETURN'}</span>
            <span>NGN · LOCAL</span>
          </div>

          <div class="auth-heading">
            <p class="auth-kicker">${registering ? 'New workspace' : 'Your workspace'}</p>
            <h2>${registering ? 'Create your account' : 'Welcome back'}</h2>
            <p>${registering ? 'Start with the essentials. You can grow from there.' : 'Your inventory is waiting.'}</p>
          </div>

          <form id="auth-form" class="auth-form">
            ${registering ? `
              <div class="auth-field">
                <label for="auth-name">Your name</label>
                <input id="auth-name" name="name" type="text" minlength="2" autocomplete="name" placeholder="e.g. Ada Okafor" required>
              </div>
            ` : ''}

            <div class="auth-field">
              <label for="auth-email">Email address</label>
              <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@business.com" required>
            </div>

            <div class="auth-field">
              <div class="auth-label-row">
                <label for="auth-password">Password</label>
                ${registering ? '<span>8+ characters</span>' : '<a href="/signup">Need an account?</a>'}
              </div>
              <input id="auth-password" name="password" type="password" minlength="8" autocomplete="${registering ? 'new-password' : 'current-password'}" placeholder="Enter your password" required>
            </div>

            <button class="auth-submit" type="submit">
              <span>${registering ? 'Create workspace' : 'Enter workspace'}</span>
              <span class="auth-submit-arrow">↗</span>
            </button>
          </form>

          <p class="auth-switch">
            ${registering ? 'Already have an account?' : 'New to Stock Manager?'}
            <a href="${registering ? '/login' : '/signup'}">${registering ? 'Sign in' : 'Create one'}</a>
          </p>
        </div>
      </section>
    </div>
  `;

  const form = document.getElementById('auth-form');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());

    try {
      const data = await api(registering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      saveAuth(data);
      await dashboard();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
}


// ======================================================
// PAGE SETUP
// ======================================================

function setPage(titleText, description, pageKey = titleText.toLowerCase()) {

  title.textContent = titleText;

  if (pageDescription) {
    pageDescription.textContent = description;
  }

  currentPage = pageKey;
}


// ======================================================
// DASHBOARD
// ======================================================

async function dashboard() {

  setPage(
    'Dashboard',
    'Overview of your phone stock business'
  );

  setLoading();

  try {

    const d = await api(`${uri}/api/dashboard`);

    setStatus('Online', 'success');

    app.innerHTML = `

      <div class="cards">

        <div class="card">
          <div class="label">Stock Value</div>
          <div class="value">
            ${money(d.stockValue)}
          </div>
        </div>

        <div class="card">
          <div class="label">Today's Sales</div>
          <div class="value">
            ${money(d.today.sales)}
          </div>
        </div>

        <div class="card">
          <div class="label">Gross Profit</div>
          <div class="value">
            ${money(d.today.grossProfit)}
          </div>
        </div>

        <div class="card">
          <div class="label">Net Profit</div>
          <div class="value">
            ${money(d.today.netProfit)}
          </div>
        </div>

      </div>


      <div class="dashboard-grid">

        <div class="panel">

          <div class="panel-header">

            <div>
              <h3>Inventory</h3>
              <p>Products currently in stock</p>
            </div>

            <button
              class="btn secondary"
              onclick="products()"
            >
              Manage Products
            </button>

          </div>

          ${
            d.products && d.products.length
              ? `
                <div class="table-wrapper">

                  <table>

                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Selling Price</th>
                      </tr>
                    </thead>

                    <tbody>

                      ${d.products.map(p => `

                        <tr>

                          <td>
                            <strong>
                              ${escapeHTML(p.screenCode)}
                            </strong>
                          </td>

                          <td>
                            ${escapeHTML(p.name)}
                          </td>

                          <td>
                            ${Number(p.quantity || 0)}
                          </td>

                          <td>
                            ${money(p.sellingPrice)}
                          </td>

                        </tr>

                      `).join('')}

                    </tbody>

                  </table>

                </div>
              `
              : `
                <div class="empty">
                  <p>No products have been created yet.</p>
                </div>
              `
          }

        </div>

        <div class="panel">

          <div class="panel-header">

            <div>
              <h3>Low Stock</h3>
              <p>Products that need restocking</p>
            </div>

            <button
              class="btn secondary"
              onclick="products()"
            >
              View Products
            </button>

          </div>

          ${
            d.lowStock && d.lowStock.length
              ? `
                <div class="table-wrapper">

                  <table>

                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>

                      ${d.lowStock.map(p => `

                        <tr>

                          <td>
                            <strong>
                              ${escapeHTML(p.screenCode)}
                            </strong>
                          </td>

                          <td>
                            ${escapeHTML(p.name)}
                          </td>

                          <td>
                            ${p.quantity}
                          </td>

                          <td>
                            <span class="badge danger">
                              Low Stock
                            </span>
                          </td>

                        </tr>

                      `).join('')}

                    </tbody>

                  </table>

                </div>
              `
              : `
                <div class="empty">
                  <p>All products have sufficient stock.</p>
                </div>
              `
          }

        </div>


        <div class="panel">

          <div class="panel-header">

            <div>
              <h3>Quick Actions</h3>
              <p>Manage your business</p>
            </div>

          </div>

          <div class="quick-actions">

            <button
              class="action-btn"
              onclick="products()"
            >
              <strong>Products</strong>
              <span>Manage stock</span>
            </button>

            <button
              class="action-btn"
              onclick="sales()"
            >
              <strong>New Sale</strong>
              <span>Record a sale</span>
            </button>

            <button
              class="action-btn"
              onclick="purchases()"
            >
              <strong>Purchase</strong>
              <span>Add stock</span>
            </button>

            <button
              class="action-btn"
              onclick="expenses()"
            >
              <strong>Expense</strong>
              <span>Record expense</span>
            </button>

          </div>

        </div>

      </div>

    `;

  } catch (error) {

    if (error.code === 'AUTH_REQUIRED') return;

    setStatus(error.message, 'error');

    app.innerHTML = `
      <div class="error-box">
        <h3>Unable to load dashboard</h3>
        <p>${escapeHTML(error.message)}</p>

        <button
          class="btn primary"
          onclick="dashboard()"
        >
          Try Again
        </button>
      </div>
    `;
  }
}


// ======================================================
// PRODUCTS
// ======================================================

async function products() {

  setPage(
    'Products',
    'Manage your phone screens and stock'
  );

  setLoading();

  try {

    const response = await api(`${uri}/api/products`);
    const d = response.products;

    setStatus(`${d.length} products`, 'success');

    app.innerHTML = `

      <div class="toolbar">

        <div class="search-box">

          <input
            type="text"
            id="product-search"
            placeholder="Search by code or name..."
          >

        </div>

        <button
          class="btn primary"
          onclick="showProductForm()"
        >
          + Add Product
        </button>

      </div>


      <div class="panel">

        <div class="table-wrapper">

          <table id="products-table">

            <thead>

              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Avg Cost</th>
                <th>Selling Price</th>
                <th>Stock Value</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              ${d.map(p => productRow(p)).join('')}

            </tbody>

          </table>

        </div>

      </div>

    `;

    const search = document.getElementById('product-search');

    search.addEventListener('input', () => {

      const query = search.value.toLowerCase();

      document
        .querySelectorAll('#products-table tbody tr')
        .forEach(row => {

          row.style.display =
            row.textContent.toLowerCase().includes(query)
              ? ''
              : 'none';

        });

    });

  } catch (error) {

    if (error.code === 'AUTH_REQUIRED') return;

    setStatus(error.message, 'error');

    showError(error.message, products);
  }
}


function productRow(p) {

  const quantity = Number(p.quantity || 0);

  let stockClass = '';

  if (quantity <= 0) {
    stockClass = 'out';
  } else if (quantity <= 5) {
    stockClass = 'low';
  }

  return `

    <tr>

      <td>
        <strong>
          ${escapeHTML(p.screenCode)}
        </strong>
      </td>

      <td>
        ${escapeHTML(p.name)}
      </td>

      <td class="${stockClass}">
        ${quantity}
      </td>

      <td>
        ${money(p.averageCost)}
      </td>

      <td>
        ${money(p.sellingPrice)}
      </td>

      <td>
        ${money(quantity * Number(p.averageCost || 0))}
      </td>

      <td>

        <div class="table-actions">

          <button
            class="btn small"
            onclick="editProduct('${p._id}')"
          >
            Edit
          </button>

          <button
            class="btn small danger-btn"
            onclick="deleteProduct('${p._id}')"
          >
            Delete
          </button>

        </div>

      </td>

    </tr>

  `;
}


// ======================================================
// PRODUCT FORM
// ======================================================

function showProductForm(product = null) {

  const editing = Boolean(product);

  const modal = document.createElement('div');

  modal.className = 'modal-overlay';

  modal.innerHTML = `

    <div class="modal">

      <div class="modal-header">

        <h3>
          ${editing ? 'Edit Product' : 'Add Product'}
        </h3>

        <button
          class="modal-close"
          onclick="this.closest('.modal-overlay').remove()"
        >
          ×
        </button>

      </div>


      <form id="product-form">

        <div class="form-grid">

          <div class="form-group">

            <label>Screen Code</label>

            <input
              type="text"
              name="screenCode"
              required
              value="${editing ? escapeHTML(product.screenCode) : ''}"
              placeholder="e.g. BF7"
            >

          </div>


          <div class="form-group">

            <label>Product Name</label>

            <input
              type="text"
              name="name"
              required
              value="${editing ? escapeHTML(product.name) : ''}"
              placeholder="e.g. Infinix Hot 12"
            >

          </div>


          <div class="form-group">

            <label>Quantity</label>

            <input
              type="number"
              name="quantity"
              min="0"
              required
              value="${editing ? product.quantity : 0}"
            >

          </div>


          <div class="form-group">

            <label>Average Cost</label>

            <input
              type="number"
              name="averageCost"
              min="0"
              step="0.01"
              required
              value="${editing ? product.averageCost : ''}"
            >

          </div>


          <div class="form-group">

            <label>Selling Price</label>

            <input
              type="number"
              name="sellingPrice"
              min="0"
              step="0.01"
              required
              value="${editing ? product.sellingPrice : ''}"
            >

          </div>


        </div>


        <div class="modal-actions">

          <button
            type="button"
            class="btn secondary"
            onclick="this.closest('.modal-overlay').remove()"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn primary"
          >
            ${editing ? 'Update Product' : 'Create Product'}
          </button>

        </div>

      </form>

    </div>

  `;

  document.body.appendChild(modal);


  document
    .getElementById('product-form')
    .addEventListener('submit', async (event) => {

      event.preventDefault();

      const formData = new FormData(event.target);

      const body = Object.fromEntries(formData.entries());

      body.quantity = Number(body.quantity);
      body.averageCost = Number(body.averageCost);
      body.sellingPrice = Number(body.sellingPrice);

      try {

        const url = editing
          ? `${uri}/api/products/${product._id}`
          : `${uri}/api/products`;

        const method = editing
          ? 'PUT'
          : 'POST';

        await api(url, {
          method,
          body: JSON.stringify(body)
        });

        modal.remove();

        await products();

        setStatus(
          editing
            ? 'Product updated successfully'
            : 'Product created successfully',
          'success'
        );

      } catch (error) {

        alert(error.message);

      }

    });
}


async function editProduct(id) {

  try {

    const response = await api(`${uri}/api/products/${id}`);

    showProductForm(response.product);

  } catch (error) {

    alert(error.message);

  }
}


async function deleteProduct(id) {

  const confirmed = confirm(
    'Are you sure you want to delete this product?'
  );

  if (!confirmed) return;

  try {

    await api(`${uri}/api/products/${id}`, {
      method: 'DELETE'
    });

    await products();

    setStatus(
      'Product deleted successfully',
      'success'
    );

  } catch (error) {

    alert(error.message);

  }
}


// ======================================================
// GENERIC LIST
// ======================================================

async function list(
  page,
  url,
  columns,
  rowFunction,
  toolbarActions = ''
) {

  setPage(page, `View and manage ${page.toLowerCase()}`);

  setLoading();

  try {

    const response = await api(url);
    const data = response[page.toLowerCase()];

    setStatus(
      `${data.length} records`,
      'success'
    );

    app.innerHTML = `

      <div class="toolbar">

        <input
          type="text"
          id="table-search"
          class="search-input"
          placeholder="Search ${page.toLowerCase()}..."
        >

        ${toolbarActions}

      </div>


      <div class="panel">

        <div class="table-wrapper">

          <table id="data-table">

            <thead>

              <tr>

                ${columns
                  .map(column => `<th>${column}</th>`)
                  .join('')}

              </tr>

            </thead>

            <tbody>

              ${data.map(rowFunction).join('')}

            </tbody>

          </table>

        </div>

      </div>

    `;


    const search =
      document.getElementById('table-search');


    search.addEventListener('input', () => {

      const query =
        search.value.toLowerCase();

      document
        .querySelectorAll('#data-table tbody tr')
        .forEach(row => {

          row.style.display =
            row.textContent
              .toLowerCase()
              .includes(query)
              ? ''
              : 'none';

        });

    });

  } catch (error) {

    if (error.code === 'AUTH_REQUIRED') return;

    setStatus(error.message, 'error');

    showError(error.message, () => {
      list(page, url, columns, rowFunction);
    });

  }
}


// ======================================================
// SALES
// ======================================================

async function showSaleForm() {

  try {
    const response = await api('/api/products');
    const products = response.products.filter(product =>
      Number(product.quantity || 0) > 0
    );

    if (!products.length) {
      alert('There are no products with stock available for sale.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Record Sale</h3>
          <button class="modal-close" type="button"
            onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <form id="sale-form" class="form-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="sale-product">Product</label>
              <select id="sale-product" name="product" required>
                ${products.map(product => `
                  <option value="${product._id}"
                    data-price="${Number(product.sellingPrice || 0)}"
                    data-stock="${Number(product.quantity || 0)}">
                    ${escapeHTML(product.screenCode)} - ${escapeHTML(product.name)} (${Number(product.quantity || 0)} in stock)
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="sale-quantity">Quantity</label>
              <input id="sale-quantity" type="number" name="quantity"
                min="1" value="1" required>
              <small id="sale-stock-hint"></small>
            </div>

            <div class="form-group">
              <label for="sale-unit-price">Unit Price</label>
              <input id="sale-unit-price" type="number" name="unitPrice"
                min="0" step="0.01" required>
            </div>

            <div class="form-group">
              <label for="sale-discount">Discount</label>
              <input type="number" name="discount" min="0" step="0.01" value="0">
            </div>

            <div class="form-group">
              <label for="sale-payment">Payment Method</label>
              <select id="sale-payment" name="paymentMethod">
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div class="form-group">
              <label for="sale-note">Note</label>
              <input id="sale-note" type="text" name="note" maxlength="200">
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn secondary"
              onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn primary">Save Sale</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const productSelect = modal.querySelector('#sale-product');
    const priceInput = modal.querySelector('#sale-unit-price');
    const quantityInput = modal.querySelector('#sale-quantity');
    const stockHint = modal.querySelector('#sale-stock-hint');

    const updateProductFields = () => {
      const option = productSelect.selectedOptions[0];
      const stock = Number(option.dataset.stock);
      priceInput.value = option.dataset.price;
      quantityInput.max = stock;
      stockHint.textContent = `${stock} available`;
    };

    productSelect.addEventListener('change', updateProductFields);
    updateProductFields();

    modal.querySelector('#sale-form').addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const body = Object.fromEntries(formData.entries());
      body.items = [{
        product: body.product,
        quantity: Number(body.quantity),
        unitPrice: Number(body.unitPrice),
      }];
      body.discount = Number(body.discount || 0);
      delete body.product;
      delete body.quantity;
      delete body.unitPrice;

      try {
        await api('/api/sales', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        modal.remove();
        await sales();
        setStatus('Sale recorded successfully', 'success');
      } catch (error) {
        alert(error.message);
      }
    });
  } catch (error) {
    alert(error.message);
  }
}

async function sales() {

  await list(
    'Sales',
    '/api/sales',

    [
      'Invoice',
      'Date',
      'Total',
      'Profit',
      'Payment'
    ],

    s => {

      const profit =
        s.items?.reduce(
          (total, item) =>
            total + Number(item.profit || 0),
          0
        ) || 0;

      return `

        <tr>

          <td>
            <strong>
              ${escapeHTML(s.invoiceNumber)}
            </strong>
          </td>

          <td>
            ${dateTime(s.createdAt)}
          </td>

          <td>
            ${money(s.grandTotal)}
          </td>

          <td class="profit">
            ${money(profit)}
          </td>

          <td>
            <span class="badge">
              ${escapeHTML(s.paymentMethod)}
            </span>
          </td>

        </tr>

      `;

    },

    '<button class="btn primary" type="button" onclick="showSaleForm()">+ New Sale</button>'
  );

}


// ======================================================
// SALES HISTORY
// ======================================================

async function salesHistory(from = '', to = '') {

  setPage(
    'Sales History',
    'Review sales recorded in a selected date range',
    'salesHistory'
  );

  setLoading();

  try {
    const params = new URLSearchParams();

    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const query = params.toString();
    const response = await api(`/api/sales${query ? `?${query}` : ''}`);
    const data = response.sales;
    const total = data.reduce(
      (sum, sale) => sum + Number(sale.grandTotal || 0),
      0
    );

    setStatus(`${data.length} sales · ${money(total)}`, 'success');

    app.innerHTML = `
      <div class="toolbar history-toolbar">
        <div class="date-filters">
          <label>
            From
            <input type="date" id="sales-from" value="${escapeHTML(from)}">
          </label>
          <label>
            To
            <input type="date" id="sales-to" value="${escapeHTML(to)}">
          </label>
          <button class="btn secondary" type="button" id="filter-sales-btn">
            Filter
          </button>
          <button class="btn ghost" type="button" id="clear-sales-filter-btn">
            Clear
          </button>
        </div>

        <button class="btn primary" type="button" onclick="sales()">
          Current Sales
        </button>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Past sales</h3>
            <p>${from || to ? 'Filtered by the selected period' : 'All recorded sales'}</p>
          </div>
        </div>

        ${data.length ? `
          <div class="table-wrapper">
            <table id="sales-history-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(s => {
                  const profit = s.items?.reduce(
                    (sum, item) => sum + Number(item.profit || 0),
                    0
                  ) || 0;

                  return `
                    <tr>
                      <td><strong>${escapeHTML(s.invoiceNumber)}</strong></td>
                      <td>${dateTime(s.createdAt)}</td>
                      <td>${money(s.grandTotal)}</td>
                      <td class="profit">${money(profit)}</td>
                      <td><span class="badge">${escapeHTML(s.paymentMethod)}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty">
            <p>No sales found for this period.</p>
          </div>
        `}
      </div>
    `;

    document.getElementById('filter-sales-btn').addEventListener('click', () => {
      salesHistory(
        document.getElementById('sales-from').value,
        document.getElementById('sales-to').value
      );
    });

    document.getElementById('clear-sales-filter-btn').addEventListener('click', () => {
      salesHistory();
    });
  } catch (error) {
    if (error.code === 'AUTH_REQUIRED') return;

    setStatus(error.message, 'error');
    showError(error.message, () => salesHistory(from, to));
  }
}


// ======================================================
// PURCHASES
// ======================================================

async function showPurchaseForm() {

  try {
    const response = await api('/api/products');
    const products = response.products;

    if (!products.length) {
      alert('Create a product before recording a purchase.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Record Purchase</h3>
          <button class="modal-close" type="button"
            onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>

        <form id="purchase-form" class="form-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="purchase-product">Product</label>
              <select id="purchase-product" name="product" required>
                ${products.map(product => `
                  <option value="${product._id}">
                    ${escapeHTML(product.screenCode)} - ${escapeHTML(product.name)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="purchase-quantity">Quantity</label>
              <input id="purchase-quantity" type="number" name="quantity"
                min="1" value="1" required>
            </div>

            <div class="form-group">
              <label for="purchase-unit-cost">Unit Cost</label>
              <input id="purchase-unit-cost" type="number" name="unitCost"
                min="0" step="0.01" value="0" required>
            </div>

            <div class="form-group">
              <label for="purchase-note">Note</label>
              <input id="purchase-note" type="text" name="note" maxlength="200">
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn secondary"
              onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn primary">Save Purchase</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#purchase-form').addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const body = Object.fromEntries(formData.entries());
      body.items = [{
        product: body.product,
        quantity: Number(body.quantity),
        unitCost: Number(body.unitCost),
      }];
      delete body.product;
      delete body.quantity;
      delete body.unitCost;

      try {
        await api('/api/purchases', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        modal.remove();
        await purchases();
        setStatus('Purchase recorded successfully', 'success');
      } catch (error) {
        alert(error.message);
      }
    });
  } catch (error) {
    alert(error.message);
  }
}

async function purchases() {

  await list(
    'Purchases',
    '/api/purchases',

    [
      'Invoice',
      'Date',
      'Total'
    ],

    p => `

      <tr>

        <td>
          <strong>
            ${escapeHTML(p.invoiceNumber)}
          </strong>
        </td>

        <td>
          ${dateTime(p.createdAt)}
        </td>

        <td>
          ${money(p.grandTotal)}
        </td>

      </tr>

    `,

    '<button class="btn primary" type="button" onclick="showPurchaseForm()">+ New Purchase</button>'
  );

}


// ======================================================
// EXPENSES
// ======================================================

function showExpenseForm() {

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Record Expense</h3>
        <button class="modal-close" type="button"
          onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>

      <form id="expense-form" class="form-content">
        <div class="form-grid">
          <div class="form-group">
            <label for="expense-title">Title</label>
            <input id="expense-title" type="text" name="title" required>
          </div>

          <div class="form-group">
            <label for="expense-category">Category</label>
            <select id="expense-category" name="category">
              <option value="transport">Transport</option>
              <option value="electricity">Electricity</option>
              <option value="rent">Rent</option>
              <option value="salary">Salary</option>
              <option value="internet">Internet</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="expense-amount">Amount</label>
            <input id="expense-amount" type="number" name="amount"
              min="0" step="0.01" required>
          </div>

          <div class="form-group">
            <label for="expense-date">Date</label>
            <input id="expense-date" type="date" name="date">
          </div>

          <div class="form-group">
            <label for="expense-description">Description</label>
            <input id="expense-description" type="text" name="description"
              maxlength="200">
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn secondary"
            onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn primary">Save Expense</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#expense-form').addEventListener('submit', async event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const body = Object.fromEntries(formData.entries());
    body.amount = Number(body.amount);

    if (!body.date) {
      delete body.date;
    }

    try {
      await api('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      modal.remove();
      await expenses();
      setStatus('Expense recorded successfully', 'success');
    } catch (error) {
      alert(error.message);
    }
  });
}

async function expenses() {

  await list(
    'Expenses',
    '/api/expenses',

    [
      'Title',
      'Category',
      'Amount',
      'Date'
    ],

    e => `

      <tr>

        <td>
          <strong>
            ${escapeHTML(e.title)}
          </strong>
        </td>

        <td>
          ${escapeHTML(e.category)}
        </td>

        <td>
          ${money(e.amount)}
        </td>

        <td>
          ${dateOnly(e.date)}
        </td>

      </tr>

    `,

    '<button class="btn primary" type="button" onclick="showExpenseForm()">+ New Expense</button>'
  );

}


// ======================================================
// ERROR HANDLER
// ======================================================

function showError(message, retryFunction) {

  app.innerHTML = `

    <div class="error-box">

      <h3>Something went wrong</h3>

      <p>
        ${escapeHTML(message)}
      </p>

      <button
        class="btn primary"
        id="retry-btn"
      >
        Try Again
      </button>

    </div>

  `;

  document
    .getElementById('retry-btn')
    .onclick = retryFunction;
}


// ======================================================
// NAVIGATION
// ======================================================

const pages = {
  dashboard,
  products,
  sales,
  salesHistory,
  purchases,
  expenses
};

const pagePaths = {
  dashboard: '/dashboard',
  products: '/products',
  sales: '/sales',
  salesHistory: '/sales/history',
  purchases: '/purchases',
  expenses: '/expenses',
};

async function navigateToPage(page, pushState = true) {
  if (!pages[page]) return;

  if (pushState && window.location.pathname !== pagePaths[page]) {
    window.history.pushState({}, '', pagePaths[page]);
  }

  document
    .querySelectorAll('nav button')
    .forEach(button =>
      button.classList.toggle('active', button.dataset.p === page)
    );

  try {
    await pages[page]();
  } catch (error) {
    if (error.code === 'AUTH_REQUIRED') return;

    setStatus(error.message, 'error');
  }
}


document
  .querySelectorAll('nav button')
  .forEach(button => {

    button.addEventListener('click', () => {
      navigateToPage(button.dataset.p);
    });

  });

window.addEventListener('popstate', () => {
  if (authToken) {
    const page = Object.keys(pagePaths).find(
      key => pagePaths[key] === window.location.pathname
    ) || 'dashboard';

    navigateToPage(page, false);
  }
});


// ======================================================
// REFRESH BUTTON
// ======================================================

if (refreshBtn) {

  refreshBtn.addEventListener(
    'click',
    async () => {

      if (!pages[currentPage]) {
        return dashboard();
      }

      refreshBtn.disabled = true;

      try {

        await pages[currentPage]();

      } finally {

        refreshBtn.disabled = false;

      }

    }
  );

}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('phone-stock-token');
    window.location.replace('/login');
  });
}

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Service worker registration failed:', error);
    });
  });
}

if (authToken) {
  if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
    window.history.replaceState({}, '', '/dashboard');
  } else if (window.location.pathname === '/') {
    window.history.replaceState({}, '', '/dashboard');
  }

  logoutBtn.hidden = false;
  if (installBtn && deferredInstallPrompt) {
    installBtn.hidden = false;
  }
  const initialPage = Object.keys(pagePaths).find(
    page => pagePaths[page] === window.location.pathname
  ) || 'dashboard';

  navigateToPage(initialPage, false);
} else {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
    window.location.replace('/login');
  } else {
    showAuthScreen();
  }
}