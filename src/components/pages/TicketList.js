import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ticketUpdateService } from '../../utils/ticketUpdateService';
import Ticket from '../Ticket';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Start polling for updates
    ticketUpdateService.startPolling();

    // Register callback for updates
    const unsubscribe = ticketUpdateService.onUpdate((changes, allTickets) => {
      setTickets(allTickets);

      // Show notification for changes
      changes.forEach(change => {
        if (change.type === 'modified') {
          toast.info(`Ticket #${change.ticket.id} was updated`);
        } else if (change.type === 'added') {
          toast.info(`New ticket #${change.ticket.id} was added`);
        } else if (change.type === 'deleted') {
          toast.warning(`Ticket #${change.ticket.id} was deleted`);
        }
      });
    });

    return () => {
      // Clean up
      ticketUpdateService.stopPolling();
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <h1>Ticket List</h1>
      <ul>
        {tickets.map(ticket => (
          <Ticket key={ticket.id} ticket={ticket} />
        ))}
      </ul>
    </div>
  );
};

export default TicketList;