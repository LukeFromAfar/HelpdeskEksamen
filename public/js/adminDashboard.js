document.addEventListener('DOMContentLoaded', () => {
  // Get all filter elements
  const ticketSearch = document.getElementById('ticketSearch');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const assignedToFilter = document.getElementById('assignedToFilter'); // New filter
  const sortSelector = document.getElementById('sortSelector');
  const clearSearchBtn = document.getElementById('clearSearch');
  const searchBtn = document.getElementById('searchBtn'); // New search button
  const ticketCount = document.getElementById('ticketCount');
  
  // Get all ticket rows
  const ticketRows = document.querySelectorAll('#adminTicketList tr');
  
  // Count all rows since we're showing everything initially
  const initialVisibleCount = ticketRows.length;
  
  updateTicketCount(initialVisibleCount, ticketRows.length);
  
  // Enter key in search field
  ticketSearch.addEventListener('keypress', (event) => {
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
    ticketSearch.value = '';
    applyServerFilters();
  });
  
  // Add server-side filtering to dropdown filters
  statusFilter.addEventListener('change', () => applyServerFilters());
  categoryFilter.addEventListener('change', () => applyServerFilters());
  priorityFilter.addEventListener('change', () => applyServerFilters());
  assignedToFilter.addEventListener('change', () => applyServerFilters()); // Add event listener for new filter
  
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
    let url = `/api/tickets/admin?page=1&sortField=${sortField}&sortOrder=${sortOrder}`;
    
    // Add search term to URL if present
    const searchTerm = ticketSearch.value.trim();
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const status = statusFilter.value;
    if (status) {
      url += `&status=${status}`;
    }
    
    const category = categoryFilter.value;
    if (category) {
      url += `&category=${category}`;
    }
    
    const priority = priorityFilter.value;
    if (priority) {
      url += `&priority=${priority}`;
    }
    
    // Add assignedTo filter
    const assignedTo = assignedToFilter.value;
    if (assignedTo) {
      url += `&assignedTo=${assignedTo}`;
    }
    
    // Navigate to filtered results
    window.location.href = url;
  }
  
  /**
   * Update the ticket count display
   * @param {number} visibleCount - Number of visible tickets
   * @param {number} totalCount - Total number of tickets
   */
  function updateTicketCount(visibleCount, totalCount) {
    if (totalCount === undefined) {
      ticketCount.textContent = `${visibleCount} henvendelser`;
    } else {
      ticketCount.textContent = `${visibleCount} av ${totalCount} henvendelser`;
    }
  }
});
