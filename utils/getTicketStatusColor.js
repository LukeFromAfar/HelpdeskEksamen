/**
 * Returns the appropriate Bootstrap color class for a ticket status
 * @param {string} status - The ticket status
 * @returns {string} Bootstrap color class
 */
const getTicketStatusColor = (status) => {
  switch (status) {
    case 'Åpen':
      return 'danger';
    case 'Under arbeid':
      return 'warning';
    case 'Løst':
      return 'success';
    case 'Lukket':
      return 'secondary';
    default:
      return 'primary';
  }
};

module.exports = getTicketStatusColor;
