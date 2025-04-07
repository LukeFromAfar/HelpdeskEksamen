import React, { useState } from 'react';
import { addCommentWithHistory } from '../../api/tickets';

const CommentForm = ({ ticketId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = { name: 'Current User' }; // Replace with actual user context or prop

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim() === '') return;

    setSubmitting(true);
    try {
      await addCommentWithHistory(ticketId, comment, user.name);
      setComment('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment"
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

export default CommentForm;