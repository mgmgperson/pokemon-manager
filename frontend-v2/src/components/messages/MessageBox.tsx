import React, { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import { Message } from '../../types/message';

const MessageBox: React.FC = () => {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    return (
        <Box className="p-6 h-[calc(100vh-76px)]">
            <Typography variant="h4" className="text-white mb-6">
                Messages
            </Typography>

            <br></br>
            
            <Box className="flex gap-6 h-[calc(100%-4rem)]">
                <Paper className="h-full overflow-hidden w-1/3">
                    <MessageList
                        onSelectMessage={setSelectedMessage}
                        selectedMessageId={selectedMessage?.id}
                    />
                </Paper>
                
                <Box className="h-full w-2/3">
                    {selectedMessage ? (
                        <MessageDetail message={selectedMessage} />
                    ) : (
                        <Paper className="h-full flex items-center justify-center">
                            <Typography className="text-gray-500">
                                Select a message to read
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default MessageBox;
