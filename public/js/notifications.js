document.addEventListener('DOMContentLoaded', () => {
  // Initialize Socket.io connection
  const socket = io();
  
  // Get user info from the page if available
  const userElement = document.getElementById('current-user');
  if (userElement) {
    const userId = userElement.getAttribute('data-user-id');
    const userRole = userElement.getAttribute('data-user-role');
    
    // Join appropriate rooms based on user role
    if (userId) {
      socket.emit('joinUserRoom', userId);
    }
    
    if (userRole === 'admin') {
      socket.emit('joinAdminRoom');
    }
    
    // Listen for ticket updates (user-specific)
    socket.on('ticket-updated', (data) => {
      const ticketRow = document.querySelector(`.ticket-row[data-id="${data.id}"]`);
      if (ticketRow) {
        const statusBadge = ticketRow.querySelector('td:nth-child(4) .badge');
        
        // Update status badge
        if (statusBadge) {
          statusBadge.textContent = data.status;
          statusBadge.className = `badge bg-${
            data.status === 'Åpen' ? 'danger' : 
            data.status === 'Under arbeid' ? 'warning' : 'success'
          }`;
        }
        
        // Flash the updated row
        ticketRow.classList.add('bg-highlight');
        setTimeout(() => {
          ticketRow.classList.remove('bg-highlight');
        }, 3000);
      }
      
      // Show notification toast
      createToast('Henvendelse oppdatert', 
        `Status på din henvendelse er endret til "${data.status}"`, 
        data.id);
    });
    
    // Listen for new tickets (admin-specific)
    socket.on('new-ticket', (data) => {
      createToast('Ny henvendelse', 
        `En ny henvendelse "${data.title}" fra ${data.user} er opprettet.`, 
        data.id,
        false); // Do not auto-close new ticket notifications
      
      // Reload page after a delay to show the new ticket
      setTimeout(() => {
        location.reload();
      }, 3000);
    });
    
    // Listen for new comments (both user and admin)
    socket.on('new-comment', (data) => {
      createToast('Ny kommentar', data.message, data.ticketId);
    });
  }
});

/**
 * Creates and displays a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message content
 * @param {string} ticketId - ID of the related ticket (for the link)
 * @param {boolean} autoClose - Whether to auto-close the toast (default: true)
 */
function createToast(title, message, ticketId, autoClose = true) {
  // Create notification elements
  const notification = document.createElement('div');
  notification.className = 'toast show';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  notification.setAttribute('aria-atomic', 'true');
  
  notification.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
      ${ticketId ? `
      <div class="mt-2 pt-2 border-top">
        <a href="/api/tickets/view/${ticketId}" class="btn btn-sm btn-primary">Vis henvendelse</a>
      </div>
      ` : ''}
    </div>
  `;
  
  // Create container for toast if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Add toast to container
  toastContainer.appendChild(notification);
  
  // Only set auto-remove timer if autoClose is true
  if (autoClose) {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (toastContainer.contains(notification)) {
          toastContainer.removeChild(notification);
        }
        
        // Remove container if empty
        if (toastContainer.children.length === 0) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 5000);
  }
  
  // Add click event to close button
  const closeButton = notification.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (toastContainer.contains(notification)) {
          toastContainer.removeChild(notification);
        }
        
        // Remove container if empty
        if (toastContainer.children.length === 0) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    });
  }
}
