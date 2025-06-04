// Products data will be loaded from JSON
let productsData = []
let isLoading = false

// Load products from JSON file
async function loadProducts() {
  if (isLoading) return
  isLoading = true
  
  showLoading()
  
  try {
    // Try to load from the current directory first
    let response = await fetch("./products.json")
    
    // If that fails, try to load from the root directory
    if (!response.ok) {
      response = await fetch("/products.json")
    }
    
    // If both attempts fail, throw an error
    if (!response.ok) {
      throw new Error('Failed to load products')
    }
    
    productsData = await response.json()
    if (!productsData || productsData.length === 0) {
      throw new Error('No products available')
    }
    displayProducts()
    
    // If on product details page, load product details after products are loaded
    if (window.location.pathname.includes("products.html")) {
      loadProductDetails()
    }
  } catch (error) {
    console.error("Error loading products:", error)
    // Show a more helpful error message
    const errorMessage = window.location.protocol === 'file:' 
      ? "يرجى تشغيل الموقع على خادم محلي (localhost) لعرض المنتجات"
      : "عذراً، لا يمكن تحميل المنتجات في الوقت الحالي"
    showError(errorMessage)
  } finally {
    isLoading = false
  }
}

// Format price with currency
function formatPrice(price) {
  return `${price} جنية`
}

// Filter products based on selected criteria
function filterProducts() {
  const sessionFilter = document.getElementById("sessionFilter").value
  const minPrice = document.getElementById("minPrice").value
  const maxPrice = document.getElementById("maxPrice").value
  const speciesFilter = document.getElementById("speciesFilter").value
  const attachmentsFilter = document.getElementById("attachmentsFilter").value

  const filteredProducts = productsData.filter(product => {
    // Session filter
    if (sessionFilter && product.session !== sessionFilter) return false

    // Price filter
    const price = product.price
    if (minPrice && price < parseInt(minPrice)) return false
    if (maxPrice && price > parseInt(maxPrice)) return false

    // Species filter
    if (speciesFilter && product.species !== speciesFilter) return false

    // Attachments filter
    if (attachmentsFilter) {
      if (attachmentsFilter === "none" && product.attachments !== null) return false
      if (attachmentsFilter !== "none" && product.attachments !== attachmentsFilter) return false
    }

    return true
  })

  displayFilteredProducts(filteredProducts)
}

// Display filtered products
function displayFilteredProducts(filteredProducts) {
  const productsGrid = document.getElementById("productsGrid")
  if (!productsGrid) return

  productsGrid.innerHTML = ""

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-search"></i>
        <p>لا توجد منتجات تطابق معايير البحث</p>
      </div>
    `
    return
  }

  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div")
    productCard.className = "product-card"
    productCard.onclick = () => goToProductPage(product.id)

    productCard.innerHTML = `
            <img src="${product.image.url}" alt="${product.name}" class="product-image" 
                 style="width: ${product.image.width}px; height: ${product.image.height}px;">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-amount">الكمية المتوفرة: ${product.amount}</div>
                <a href="https://wa.me/201026885654?text=${encodeURIComponent(product.whatsappMessage)}" 
                   class="buy-btn" 
                   onclick="event.stopPropagation()" 
                   target="_blank">
                    <i class="fab fa-whatsapp"></i>
                    اشتري الآن
                </a>
            </div>
        `

    productsGrid.appendChild(productCard)
  })
}

// Display products on the main page
function displayProducts() {
  displayFilteredProducts(productsData)
}

// Navigate to product detail page
function goToProductPage(productId) {
  window.location.href = `products.html?id=${productId}`
}

// Load and display product details on product page
function loadProductDetails() {
  const urlParams = new URLSearchParams(window.location.search)
  const productId = Number.parseInt(urlParams.get("id"))

  if (!productId) {
    showError("لم يتم العثور على المنتج")
    return
  }

  const product = productsData.find((p) => p.id === productId)

  if (!product) {
    showError("لم يتم العثور على المنتج")
    return
  }

  const productDetail = document.getElementById("productDetail")
  if (!productDetail) return

  // Create additional data HTML if it exists
  let additionalDataHTML = ''
  if (product.addentionaldata) {
    additionalDataHTML = `
      <div class="additional-data">
        <h3>المواصفات</h3>
        <div class="specs-grid">
          ${Object.entries(product.addentionaldata).map(([key, value]) => {
            // Check if the value is long (more than 50 characters)
            const isLong = value.length > 50
            return `
              <div class="spec-item" ${isLong ? 'data-long="true"' : ''}>
                <span class="spec-label">${key}:</span>
                <span class="spec-value">${value}</span>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  }

  productDetail.innerHTML = `
        <div class="product-detail-image-container">
            <img src="${product.image.url}" alt="${product.name}" class="product-detail-image"
                 style="width: ${product.image.width}px; height: ${product.image.height}px;">
        </div>
        <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="price">${formatPrice(product.price)}</div>
            <div class="amount">الكمية المتوفرة: ${product.amount}</div>
            <p class="description">${product.description}</p>
            ${additionalDataHTML}
            <a href="https://wa.me/201026885654?text=${encodeURIComponent(product.whatsappMessage)}" 
               class="buy-btn" 
               target="_blank">
                <i class="fab fa-whatsapp"></i>
                اشتري الآن عبر واتساب
            </a>
        </div>
    `
}

// Add event listeners for filters
document.addEventListener("DOMContentLoaded", () => {
  // Load products when page loads
  loadProducts()

  // Add filter event listeners
  const filterSelects = document.querySelectorAll('.filter-select')
  filterSelects.forEach(select => {
    select.addEventListener('change', filterProducts)
  })

  // Add price input event listeners
  const priceInputs = document.querySelectorAll('.price-input')
  priceInputs.forEach(input => {
    input.addEventListener('input', filterProducts)
  })

  // If on product details page, load product details
  if (window.location.pathname.includes("products.html")) {
    loadProductDetails()
  }

  // Smooth scrolling for anchor links
  const links = document.querySelectorAll('a[href^="#"]')
  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href").substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
})

// Add loading animation
function showLoading() {
  const productsGrid = document.getElementById("productsGrid")
  const productDetail = document.getElementById("productDetail")
  const targetElement = productsGrid || productDetail
  
  if (targetElement) {
    targetElement.innerHTML = '<div style="text-align: center; padding: 2rem;">جاري التحميل...</div>'
  }
}

// Error handling for images
document.addEventListener("DOMContentLoaded", () => {
  // Handle image loading errors
  document.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName === "IMG") {
        e.target.src = "https://placehold.co/300x250/e9e9e9/666666?text=صورة+غير+متوفرة"
      }
    },
    true,
  )
})

// Display error message
function showError(message) {
  const productsGrid = document.getElementById("productsGrid")
  const productDetail = document.getElementById("productDetail")
  const targetElement = productsGrid || productDetail
  
  if (targetElement) {
    targetElement.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `
  }
}
