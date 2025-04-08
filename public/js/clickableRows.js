document.addEventListener('DOMContentLoaded', () => {
  // Get all ticket rows
  const ticketRows = document.querySelectorAll('.ticket-row');
  
  // Add click event to each row
  ticketRows.forEach(row => {
    row.style.cursor = 'pointer'; // Add pointer cursor to indicate clickability
    
    row.addEventListener('click', (event) => {
      // Don't navigate if the click was on a button or link
      if (event.target.tagName === 'BUTTON' || 
          event.target.tagName === 'A' || 
          event.target.closest('button') || 
          event.target.closest('a')) {
        return;
      }
      
      // Get the ticket ID from the data attribute
      const ticketId = row.getAttribute('data-id');
      
      // Navigate to the ticket view page
      window.location.href = `/api/tickets/view/${ticketId}`;
    });
  });
});
