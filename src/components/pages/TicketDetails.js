import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ticketUpdateService } from '../../utils/ticketUpdateService';
import { updateTicketStatus, addCommentWithHistory } from '../../api/tickets';
import { getTicketDetails } from '../../api/tickets';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState({ name: 'John Doe' }); // Example user object

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketData = await getTicketDetails(ticketId);
        setTicket(ticketData);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
      }
    };

    fetchTicket();

    // Register for real-time updates
    const unsubscribe = ticketUpdateService.onUpdate((changes) => {
      const relevantChange = changes.find(change => change.ticket.id === ticketId);
      if (relevantChange) {
        setTicket(relevantChange.ticket);
      }
    });

    return () => unsubscribe();
  }, [ticketId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      const updatedTicket = { ...ticket, status: newStatus };
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim() === '') return;

    try {
      await addCommentWithHistory(ticketId, comment, user.name);
      const updatedTicket = { ...ticket, comments: [...ticket.comments, { text: comment, user: user.name }] };
      setTicket(updatedTicket);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="ticket-details">
      <h2>Ticket Details</h2>
      {ticket ? (
        <div>
          <p><strong>ID:</strong> {ticket.id}</p>
          <p><strong>Title:</strong> {ticket.title}</p>
          <p><strong>Description:</strong> {ticket.description}</p>
          <p><strong>Status:</strong> {ticket.status}</p>
          <button onClick={() => handleStatusChange('Resolved')}>Mark as Resolved</button>
          <button onClick={() => handleStatusChange('Open')}>Reopen Ticket</button>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment"
            />
            <button type="submit">Submit Comment</button>
          </form>
          <div className="ticket-comments">
            <h3>Comments</h3>
            {ticket.comments && ticket.comments.length > 0 ? (
              <ul>
                {ticket.comments.map((c, index) => (
                  <li key={index}>
                    <p><strong>{c.user}:</strong> {c.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No comments yet</p>
            )}
          </div>
          <div className="ticket-history">
            <h3>History</h3>
            <div className="history-container">
              {ticket.history && ticket.history.length > 0 ? (
                <ul className="history-list">
                  {ticket.history.map((item, index) => (
                    <li key={index} className="history-item">
                      <div className="history-timestamp">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="history-action">{item.action}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No history available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading ticket details...</p>
      )}
    </div>
  );
};

export default TicketDetails;