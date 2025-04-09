document.addEventListener('DOMContentLoaded', () => {
  // Get all filter elements
  const userSearch = document.getElementById('userSearch');
  const roleFilter = document.getElementById('roleFilter');
  const sortSelector = document.getElementById('sortSelector');
  const clearSearchBtn = document.getElementById('clearSearch');
  const searchBtn = document.getElementById('searchBtn');
  
  // Enter key in search field
  userSearch.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      applyServerFilters();
    }
  });

  // Search button click event
  searchBtn.addEventListener('click', () => {
    applyServerFilters();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    userSearch.value = '';
    applyServerFilters();
  });
  
  // Add server-side filtering to dropdown filters
  roleFilter.addEventListener('change', () => applyServerFilters());
  
  // Sort selector event listener
  sortSelector.addEventListener('change', () => {
    const [field, order] = sortSelector.value.split(':');
    applyServerFilters(field, order);
  });
  
  /**
   * Apply server-side filtering by reloading the page with filter parameters
   */
  function applyServerFilters(sortFieldParam, sortOrderParam) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get current page and sort parameters
    const currentPage = urlParams.get('page') || '1';
    const sortField = sortFieldParam || urlParams.get('sortField') || 'createdAt';
    const sortOrder = sortOrderParam || urlParams.get('sortOrder') || 'desc';
    
    // Build the new URL with filters
    let url = `/api/users/admin?page=1&sortField=${sortField}&sortOrder=${sortOrder}`;
    
    // Add search term to URL if present
    const searchTerm = userSearch.value.trim();
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const role = roleFilter.value;
    if (role) {
      url += `&role=${role}`;
    }
    
    // Navigate to filtered results
    window.location.href = url;
  }
});
