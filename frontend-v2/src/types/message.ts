export type MessageType = 'battle_result' | 'offer' | 'news' | 'tutorial' | 'alert' | 'finance';

export interface Message {
    id: number;
    sent_at: string;
    sender: string | null;
    subject: string;
    body: string;
    is_read: boolean;
    message_type: MessageType;
}
