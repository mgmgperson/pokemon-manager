// CREATE TABLE message (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     sent_at TEXT NOT NULL DEFAULT (datetime('now')),
//     sender TEXT,
//     subject TEXT NOT NULL,
//     body TEXT NOT NULL,
//     is_read BOOLEAN DEFAULT FALSE,
//     message_type TEXT CHECK(message_type IN (
//         'battle_result', 'offer', 'news', 'tutorial', 'alert', 'finance'
//     ))
// );

// CREATE TABLE game_state (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     save_name TEXT NOT NULL,
//     created_at TEXT NOT NULL DEFAULT (datetime('now')),
//     last_played_at TEXT NOT NULL DEFAULT (datetime('now')),

//     -- in-world clock
//     current_date TEXT NOT NULL,         
//     current_time TEXT NOT NULL,

//     active_trainer_id INTEGER NOT NULL, -- The trainer currently being played
//     active_location_id INTEGER NOT NULL, -- The current location of the active trainer

//     FOREIGN KEY (active_trainer_id) REFERENCES trainer(id),
//     FOREIGN KEY (active_location_id) REFERENCES location(id)
// );


// CREATE TABLE trainer_finance (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     trainer_id INTEGER NOT NULL,
//     balance INTEGER DEFAULT 0, 
//     debt INTEGER DEFAULT 0, 
//     FOREIGN KEY (trainer_id) REFERENCES trainer(id)
// );

// CREATE TABLE financial_transaction (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     trainer_id INTEGER NOT NULL,
//     amount INTEGER NOT NULL,
//     description TEXT,
//     date TEXT NOT NULL,
//     category TEXT CHECK(category IN (
//         'prize', 'wages', 'sponsor', 'training', 'travel',
//         'item_purchase', 'sale', 'taxes', 'misc'
//     )),
//     FOREIGN KEY (trainer_id) REFERENCES trainer(id)
// );

// CREATE TABLE inventory (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     trainer_id INTEGER NOT NULL,
//     item_id INTEGER NOT NULL,
//     quantity INTEGER DEFAULT 1, 
//     FOREIGN KEY (trainer_id) REFERENCES trainer(id),
//     FOREIGN KEY (item_id) REFERENCES item(id)
// );

export interface Message {
    id: number;
    sentAt: string;
    sender?: string;
    subject: string;
    body: string;
    isRead: boolean;
    messageType: 'battle_result' | 'offer' | 'news' | 'tutorial' | 'alert' | 'finance';
}

export interface GameState {
    id: number;
    saveName: string;
    createdAt: string;
    lastPlayedAt: string;
    currentDate: string;
    currentTime: string;
    activeTrainerId: number;
    activeLocationId: number;
}

export interface TrainerFinance {
    id: number;
    trainerId: number;
    balance: number;
    debt: number;
}

export interface FinancialTransaction {
    id: number;
    trainerId: number;
    amount: number;
    description?: string;
    date: string;
    category: 'prize' | 'wages' | 'sponsor' | 'training' | 'travel' | 'item_purchase' | 'sale' | 'taxes' | 'misc';
}

export interface InventoryItem {
    id: number;
    trainerId: number;
    itemId: number;
    quantity: number;
}

export const defaultMessages: Message[] = [
    {
        id: 1,
        sentAt: '2036-09-01T09:00:00',
        sender: 'Professor Oak',
        subject: 'Welcome to the World of Pokémon!',
        body: 'Welcome to your new journey! Remember to visit my laboratory to receive your first Pokémon.',
        isRead: false,
        messageType: 'tutorial'
    },
];

export const defaultGameState: GameState = {
    id: 1,
    saveName: 'New Game',
    createdAt: '2025-06-20T09:00:00',
    lastPlayedAt: '2025-06-20T09:00:00',
    currentDate: '2036-09-01',
    currentTime: '09:00:00',
    activeTrainerId: 1,
    activeLocationId: 1  // Greater Pallet
};

export const defaultTrainerFinances: TrainerFinance[] = [
    {
        id: 1,
        trainerId: 1,
        balance: 3000,    // Starting money
        debt: 0
    }
];

export const defaultFinancialTransactions: FinancialTransaction[] = [
    {
        id: 1,
        trainerId: 1,
        amount: 3000,
        description: 'Initial funds from family',
        date: '2036-09-01T09:00:00',
        category: 'misc'
    }
];

export const defaultInventory: InventoryItem[] = [
    {
        id: 1,
        trainerId: 1,
        itemId: 1,        // Poké Ball
        quantity: 5
    },
    {
        id: 2,
        trainerId: 1,
        itemId: 100,        // Potion
        quantity: 3
    }
];