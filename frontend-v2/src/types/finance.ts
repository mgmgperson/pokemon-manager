export interface FinanceStatus {
    balance: number;
    debt: number;
}

export interface Transaction {
    id: number;
    trainer_id: number;
    amount: number;
    description: string;
    date: string;
    category: TransactionCategory;
}

export type TransactionCategory = 
    | 'prize'
    | 'wages'
    | 'sponsor'
    | 'training'
    | 'travel'
    | 'item_purchase'
    | 'sale'
    | 'taxes'
    | 'misc';

export interface TransactionResponse {
    transactions: Transaction[];
    total: number;
    limit: number;
    offset: number;
}
