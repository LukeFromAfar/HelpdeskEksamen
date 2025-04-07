import { getTicket, updateTicket, addComment } from './tickets';

// Function to add a history item to a ticket
export const addHistoryItem = async (ticketId, action) => {
  const historyItem = {
    timestamp: new Date().toISOString(),
    action,
  };
  
  const ticket = await getTicket(ticketId);
  
  if (!ticket.history) {
    ticket.history = [];
  }
  
  ticket.history.push(historyItem);
  
  return await updateTicket(ticketId, { history: ticket.history });
};

// Helper function to add history when ticket status changes
export const updateTicketStatus = async (ticketId, status) => {
  await updateTicket(ticketId, { status });
  await addHistoryItem(ticketId, `Status changed to: ${status}`);
};

// Helper function for adding comments with history
export const addCommentWithHistory = async (ticketId, comment, user) => {
  const updatedTicket = await addComment(ticketId, comment, user);
  await addHistoryItem(ticketId, `Comment added by ${user}`);
  return updatedTicket;
}