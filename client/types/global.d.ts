export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    dob?: Date | string;
    gender?: "male" | "female";
    mobile?: string;
    monthlyIncome?: number;
    currency?: string;
    country?: string;
    profilePicture?: string;
    totalIncome?: number;
    totalExpense?: number;
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

export type TokenType = {
    id: string;
    email: string;
}

export type UserStateType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    registerUser: {
        success: string | null;
        error: null;
    } | null;
    token: string | null;
}