/* ─── CART SYSTEM ─── */
const Cart = {
  KEY: 'tam-cart',

  getItems() {
    return JSON.parse(sessionStorage.getItem(this.KEY) || '[]');
  },

  save(items) {
    sessionStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    this.renderDrawer();
  },

  add(product, size) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id && i.size === size);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        size: size,
        qty: 1,
        price: product.price,
        image: product.image
      });
    }
    this.save(items);
    this.open();
  },

  remove(id, size) {
    let items = this.getItems();
    items = items.filter(i => !(i.id === id && i.size === size));
    this.save(items);
  },

  updateQty(id, size, delta) {
    const items = this.getItems();
    const item = items.find(i => i.id === id && i.size === size);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.remove(id, size);
      return;
    }
    this.save(items);
  },

  getTotal() {
    return this.getItems().reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  getCount() {
    return this.getItems().reduce((sum, i) => sum + i.qty, 0);
  },

  updateBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = this.getCount();
    });
  },

  open() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) { drawer.classList.add('open'); }
    if (overlay) { overlay.classList.add('open'); }
    document.body.style.overflow = 'hidden';
  },

  close() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) { drawer.classList.remove('open'); }
    if (overlay) { overlay.classList.remove('open'); }
    document.body.style.overflow = '';
  },

  renderDrawer() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    if (!body) return;

    const items = this.getItems();

    if (items.length === 0) {
      const emptyText = (typeof Lang !== 'undefined') ? Lang.t('cart_empty') : 'Your cart is empty';
      body.innerHTML = `<div class="cart-empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" style="width:48px;height:48px;color:var(--gray-300);margin-bottom:1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
        </svg>
        <p>${emptyText}</p>
      </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    body.innerHTML = items.map(item => `
      <div class="cart-item">
        <a href="product.html?id=${item.id}" class="cart-item-img">
          <img src="${item.image}" alt="${item.name}">
        </a>
        <div class="cart-item-info">
          <a href="product.html?id=${item.id}" class="cart-item-name">${item.name}</a>
          <div class="cart-item-size">${(typeof Lang !== 'undefined') ? Lang.t('product_size') : 'Size'}: ${item.size}</div>
          <div class="cart-item-bottom">
            <div class="cart-qty">
              <button onclick="Cart.updateQty('${item.id}','${item.size}',-1)">−</button>
              <span>${item.qty}</span>
              <button onclick="Cart.updateQty('${item.id}','${item.size}',1)">+</button>
            </div>
            <div class="cart-item-price">${(item.price * item.qty).toFixed(2)} <span class="sar"></span></div>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove('${item.id}','${item.size}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('');

    if (footer) {
      footer.style.display = 'block';
      document.getElementById('cartTotal').innerHTML = this.getTotal().toFixed(2) + ' <span class="sar"></span>';
      const count = this.getCount();
      const itemWord = (typeof Lang !== 'undefined') ? (count !== 1 ? Lang.t('cart_items') : Lang.t('cart_item')) : (count !== 1 ? 'items' : 'item');
      document.getElementById('cartItemCount').textContent = count + ' ' + itemWord;
    }
  },

  init() {
    this.updateBadge();
    // Inject drawer HTML if not present
    if (!document.getElementById('cartDrawer')) {
      const _t = (k, d) => (typeof Lang !== 'undefined') ? Lang.t(k) : d;
      const drawerHTML = `
      <div class="cart-overlay" id="cartOverlay" onclick="Cart.close()"></div>
      <div class="cart-drawer" id="cartDrawer">
        <div class="cart-header">
          <h3>${_t('cart_title', 'Cart')}</h3>
          <button class="cart-close" onclick="Cart.close()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="cart-body" id="cartBody"></div>
        <div class="cart-footer" id="cartFooter">
          <div class="cart-summary">
            <span id="cartItemCount">0 ${_t('cart_items', 'items')}</span>
            <span id="cartTotal">0.00 <span class="sar"></span></span>
          </div>
          <button class="cart-checkout" onclick="window.location.href='checkout.html'">${_t('cart_checkout', 'Checkout')}</button>
          <p class="cart-shipping-note">${_t('cart_shipping_note', 'Free shipping on orders over 100')} <span class="sar"></span></p>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', drawerHTML);
    }
    this.renderDrawer();
  }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
