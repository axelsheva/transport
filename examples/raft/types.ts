export enum NodeState {
    Leader = 'Leader',
    Follower = 'Follower',
    Candidate = 'Candidate',
}

export type Command = {
    id: string;
    query: string;
};

export interface LogEntry {
    term: number;
    command: Command; // Команда для машины состояний
}
