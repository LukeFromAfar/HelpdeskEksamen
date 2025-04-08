document.addEventListener('DOMContentLoaded', () => {
  // Get all filter elements
  const ticketSearch = document.getElementById('ticketSearch');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const clearSearchBtn = document.getElementById('clearSearch');
  const ticketCount = document.getElementById('ticketCount');
  
  // Get all ticket rows
  const ticketRows = document.querySelectorAll('#adminTicketList tr');
  
  // Hide closed tickets initially
  ticketRows.forEach(row => {
    if (row.getAttribute('data-closed') === 'true') {
      row.style.display = 'none';
    }
  });
  
  // Set initial count of visible rows
  const initialVisibleCount = Array.from(ticketRows).filter(row => 
    row.style.display !== 'none'
  ).length;
  
  updateTicketCount(initialVisibleCount, ticketRows.length);
  
  // Add event listeners for filter changes
  ticketSearch.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  priorityFilter.addEventListener('change', applyFilters);
  
  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    ticketSearch.value = '';
    applyFilters();
  });
  
  /**
   * Apply all filters to the ticket list
   */
  function applyFilters() {
    const searchTerm = ticketSearch.value.trim().toLowerCase();
    const statusValue = statusFilter.value;
    const categoryValue = categoryFilter.value;
    const priorityValue = priorityFilter.value;
    
    let visibleCount = 0;
    
    ticketRows.forEach(row => {
      const id = row.querySelector('td:nth-child(1)').textContent.trim();
      const title = row.querySelector('td:nth-child(2)').textContent.trim().toLowerCase();
      const username = row.querySelector('td:nth-child(3)').textContent.trim().toLowerCase();
      const category = row.querySelector('td:nth-child(4)').textContent.trim();
      const statusBadge = row.querySelector('td:nth-child(5) .badge');
      const status = statusBadge ? statusBadge.textContent.trim() : '';
      const priorityBadge = row.querySelector('td:nth-child(6) .badge');
      const priority = priorityBadge ? priorityBadge.textContent.trim() : '';
      const isClosed = row.getAttribute('data-closed') === 'true';
      
      // Check if the row satisfies all filter conditions
      const matchesSearch = searchTerm === '' || 
                           title.toLowerCase().includes(searchTerm) || 
                           username.includes(searchTerm) || 
                           id.toLowerCase().includes(searchTerm);
      
      // Special handling for status filter
      let matchesStatus = true;
      if (statusValue === '') {
        // If no status filter selected, show only non-closed tickets
        matchesStatus = !isClosed;
      } else if (statusValue === 'all') {
        // If "all" is selected, show all tickets including closed ones
        matchesStatus = true;
      } else {
        // Otherwise, match the specific status
        matchesStatus = status === statusValue;
      }
      
      const matchesCategory = categoryValue === '' || category === categoryValue;
      const matchesPriority = priorityValue === '' || priority === priorityValue;
      
      const shouldShow = matchesSearch && matchesStatus && matchesCategory && matchesPriority;
      
      // Show or hide the row
      row.style.display = shouldShow ? '' : 'none';
      
      // Count visible rows
      if (shouldShow) visibleCount++;
    });
    
    // Update the count display
    updateTicketCount(visibleCount, ticketRows.length);
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
