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
      // Show notification toast without auto close
      createToast('Henvendelse oppdatert', 
        `Status på din henvendelse er endret til "${data.status}"`, 
        data.id,
        false,  // Do not auto close
        true    // Add OK button that refreshes
      );
      
      // Auto-refresh if on related page
      if (window.location.pathname.includes(`/api/tickets/view/${data.id}`)) {
        location.reload();
      }
    });
    
    // Listen for new tickets (admin-specific)
    socket.on('new-ticket', (data) => {
      createToast('Ny henvendelse', 
        `En ny henvendelse "${data.title}" fra ${data.user} er opprettet.`, 
        data.id,
        false, // Do not auto close
        true   // Add refresh button
      );
      
      // Auto-refresh admin dashboard if active
      if (window.location.pathname === '/api/tickets/admin') {
        location.reload();
      }
    });
    
    // Listen for new comments (both user and admin)
    socket.on('new-comment', (data) => {
      createToast('Ny kommentar', data.message, data.ticketId, false, true);
      
      // Auto-refresh if on the ticket page
      if (window.location.pathname.includes(`/api/tickets/view/${data.ticketId}`)) {
        location.reload();
      }
    });
  }
});

/**
 * Creates and displays a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message content
 * @param {string} ticketId - ID of the related ticket (for the link)
 * @param {boolean} autoClose - Whether to auto-close the toast (default: true)
 * @param {boolean} addOkButton - Whether to add an OK button that refreshes the page
 */
function createToast(title, message, ticketId, autoClose = true, addOkButton = false) {
  // Create notification elements
  const notification = document.createElement('div');
  notification.className = 'toast show';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  notification.setAttribute('aria-atomic', 'true');
  
  let footerContent = '';
  
  if (ticketId) {
    footerContent += `<a href="/api/tickets/view/${ticketId}" class="btn btn-sm btn-primary">Vis henvendelse</a>`;
  }
  
  if (addOkButton) {
    footerContent += `<button type="button" class="btn btn-sm btn-success ms-2 ok-button">OK</button>`;
  }
  
  notification.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
      ${footerContent ? `<div class="mt-2 pt-2 border-top">${footerContent}</div>` : ''}
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
  
  // Add click event to OK button if it exists
  const okButton = notification.querySelector('.ok-button');
  if (okButton) {
    okButton.addEventListener('click', () => {
      // Refresh the page to show the changes
      location.reload();
    });
  }
}
