import { getTickets } from '../api/tickets';

class TicketUpdateService {
  constructor() {
    this.pollingInterval = null;
    this.callbacks = [];
    this.lastTickets = null;
  }

  startPolling(intervalMs = 5000) {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(async () => {
      try {
        const tickets = await getTickets();
        
        // If we have previous data to compare with
        if (this.lastTickets) {
          // Check for changes in tickets
          const changes = this.detectChanges(this.lastTickets, tickets);
          if (changes.length > 0) {
            this.notifyCallbacks(changes, tickets);
          }
        }
        
        this.lastTickets = tickets;
      } catch (error) {
        console.error('Error polling for ticket updates:', error);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  onUpdate(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  notifyCallbacks(changes, allTickets) {
    this.callbacks.forEach(callback => callback(changes, allTickets));
  }

  detectChanges(oldTickets, newTickets) {
    const changes = [];
    
    // Check for modified tickets
    newTickets.forEach(newTicket => {
      const oldTicket = oldTickets.find(t => t.id === newTicket.id);
      if (oldTicket) {
        if (JSON.stringify(oldTicket) !== JSON.stringify(newTicket)) {
          changes.push({
            type: 'modified',
            ticket: newTicket,
            oldTicket
          });
        }
      } else {
        changes.push({
          type: 'added',
          ticket: newTicket
        });
      }
    });
    
    // Check for deleted tickets
    oldTickets.forEach(oldTicket => {
      if (!newTickets.find(t => t.id === oldTicket.id)) {
        changes.push({
          type: 'deleted',
          ticket: oldTicket
        });
      }
    });
    
    return changes;
  }
}

// Singleton instance
export const ticketUpdateService = new TicketUpdateService();
