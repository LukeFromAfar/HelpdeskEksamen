document.addEventListener('DOMContentLoaded', () => {
  // Get all filter elements
  const ticketSearch = document.getElementById('ticketSearch');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortSelector = document.getElementById('sortSelector');
  const clearSearchBtn = document.getElementById('clearSearch');
  const ticketCount = document.getElementById('ticketCount');
  
  // Get all ticket rows
  const ticketRows = document.querySelectorAll('#adminTicketList tr');
  
  // Count all rows since we're showing everything initially
  const initialVisibleCount = ticketRows.length;
  
  updateTicketCount(initialVisibleCount, ticketRows.length);
  
  // Add event listeners for filter changes
  ticketSearch.addEventListener('input', applyFilters);
  
  // Add server-side filtering to dropdown filters
  statusFilter.addEventListener('change', () => applyServerFilters());
  categoryFilter.addEventListener('change', () => applyServerFilters());
  priorityFilter.addEventListener('change', () => applyServerFilters());
  
  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    ticketSearch.value = '';
    applyFilters();
  });
  
  // Sort selector event listener
  sortSelector.addEventListener('change', () => {
    const [field, order] = sortSelector.value.split(':');
    applyServerFilters(field, order);
  });
  
  /**
   * Apply client-side filtering for search
   */
  function applyFilters() {
    const searchTerm = ticketSearch.value.trim().toLowerCase();
    
    let visibleCount = 0;
    
    ticketRows.forEach(row => {
      const id = row.querySelector('td:nth-child(1)').textContent.trim();
      const title = row.querySelector('td:nth-child(2)').textContent.trim().toLowerCase();
      const username = row.querySelector('td:nth-child(3)').textContent.trim().toLowerCase();
      
      // Check if the row satisfies search condition
      const matchesSearch = searchTerm === '' || 
                           title.toLowerCase().includes(searchTerm) || 
                           username.includes(searchTerm) || 
                           id.toLowerCase().includes(searchTerm);
      
      // Show or hide the row
      row.style.display = matchesSearch ? '' : 'none';
      
      // Count visible rows
      if (matchesSearch) visibleCount++;
    });
    
    // Update the count display
    updateTicketCount(visibleCount, ticketRows.length);
  }
  
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
