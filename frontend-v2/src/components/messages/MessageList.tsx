import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Typography,
    CircularProgress,
    Divider,
} from '@mui/material';
import { Message } from '../../types/message';

const fetchMessages = async (): Promise<Message[]> => {
    const { data } = await axios.get('http://localhost:5000/messages');
    return data.data;
};

interface MessageListProps {
    onSelectMessage: (message: Message) => void;
    selectedMessageId?: number;
}

const MessageList: React.FC<MessageListProps> = ({ onSelectMessage, selectedMessageId }) => {
    const { data: messages, isLoading, error } = useQuery({
        queryKey: ['messages'],
        queryFn: fetchMessages,
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full p-4">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center h-full p-4">
                <Typography color="error">Error loading messages.</Typography>
            </Box>
        );
    }

    return (
        <List className="h-full overflow-y-auto">
            {messages?.map((message) => (
                <React.Fragment key={message.id}>
                    <ListItemButton
                        selected={message.id === selectedMessageId}
                        onClick={() => onSelectMessage(message)}
                        className={`
                            ${!message.is_read ? 'bg-opacity-10 bg-blue-500' : ''}
                            hover:!bg-opacity-20 hover:!bg-blue-500
                            flex items-center
                        `}
                    >
                        {!message.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0" />
                        )}
                        <ListItemText
                            primary={
                                <Typography
                                    className={`${!message.is_read ? '!font-bold' : ''} text-white`}
                                >
                                    {message.subject}
                                </Typography>
                            }
                            secondary={
                                <Typography
                                    variant="body2"
                                    className="text-gray-400"
                                    component="div"
                                >
                                    {message.sender || 'System'} • {formatDate(message.sent_at)}
                                </Typography>
                            }
                        />
                    </ListItemButton>
                    <Divider className="!bg-gray-700" />
                </React.Fragment>
            ))}
        </List>
    );
};

export default MessageList;