import React, { useEffect } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '../../types/message';

interface MessageDetailProps {
    message: Message;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message }) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!message.is_read) {
            axios.patch(`http://localhost:5000/messages/${message.id}/read`)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                });
        }
    }, [message, queryClient]);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    return (
        <Paper className="p-6 h-full">
            <Box className="mb-6">
                <Typography variant="h5" className="text-white mb-2">
                    {message.subject}
                </Typography>
                <Typography variant="subtitle1" className="text-gray-400">
                    From: {message.sender || 'System'}
                </Typography>
                <Typography variant="subtitle2" className="text-gray-500">
                    {formatDateTime(message.sent_at)}
                </Typography>
            </Box>
            
            <Divider className="my-4 !bg-gray-700" />
            
            <Box>
                <Typography className="text-white whitespace-pre-wrap">
                    {message.body}
                </Typography>
            </Box>
        </Paper>
    );
};

export default MessageDetail;