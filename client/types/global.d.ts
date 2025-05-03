export type User = {
    id: string;
    firstName: string;
    lastName?: string;
    dob: Date;
    gender: "male" | "female";
    totalIncome: number;
    totalExpense: number;
}

export type UserTransactions = {
    userId: string;
    transactions: TransactionsData[];
}

export type TransactionsData = {
    month: string;
    transactions: Transaction[];
}

export type Transaction = {
    id: string;
    userId: string;
    type: "credit" | "debit";
    amount: number;
    date: Date;
    category: Category;
    description?: string;
}

export type Category = {
    name: string;
    icon: string;
}