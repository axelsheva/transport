import { Command, LogEntry, NodeState } from './types';
import { randomIn } from './utils';

export class Node {
    static readonly nodes: Node[] = [];

    private readonly id: string;
    public state: NodeState;
    private term: number; // текущий срок
    private votedFor: string | undefined; // ID узла, которому этот узел отдал свой голос в текущем сроке

    private electionTimeout: ReturnType<typeof setTimeout> | undefined;
    private heartbeatInterval: ReturnType<typeof setInterval> | undefined;

    private readonly logMap: Map<number, LogEntry>;
    private nextLogIndex: number;

    constructor(
        id: string,
        private readonly heartbeatTime: number,
        private readonly minElectionTimeout: number,
        private readonly maxElectionTimeout: number,
    ) {
        this.id = id;
        this.state = NodeState.Follower; // по умолчанию все узлы - Followers
        this.term = 0;
        this.logMap = new Map<number, LogEntry>();
        this.nextLogIndex = 0;

        this.resetElectionTimer();
    }

    private get isLeader() {
        return this.state === NodeState.Leader;
    }

    becomeCandidate() {
        this.state = NodeState.Candidate;
        this.term += 1; // увеличиваем срок на 1, так как начинаем новые выборы
        this.votedFor = this.id; // голосуем за себя

        console.log(`[Node:${this.id}][${this.term}] 🗳️  became candidate`);
    }

    becomeLeader() {
        if (this.state === NodeState.Candidate) {
            this.state = NodeState.Leader;

            console.log(`[Node:${this.id}][${this.term}] 👑 became leader`);

            // Здесь будет логика для отправки сердцебиений
            this.startHeartbeatTimer();
        }
    }

    receiveHeartbeat(leaderTerm: number) {
        if (leaderTerm < this.term) {
            return;
        }

        // Сбросить таймер следования, чтобы избежать ненужных выборов
        this.resetElectionTimer();

        if (this.votedFor) {
            this.votedFor = undefined;
        }
        if (this.state !== NodeState.Follower) {
            console.log(`[Node:${this.id}][${this.term}] 🐑 became follower`);
            this.state = NodeState.Follower;
        }
        if (this.term !== leaderTerm) {
            this.term = leaderTerm;
        }
    }

    static registerNode(...nodes: Array<Node>) {
        Node.nodes.push(...nodes);
    }

    requestVotes() {
        const votesNeeded = Math.floor(Node.nodes.length / 2) + 1;
        let votesReceived = 1; // Голос за себя

        Node.nodes.forEach((node) => {
            if (
                node.id !== this.id &&
                node.state === NodeState.Follower &&
                node.term <= this.term
            ) {
                const voteGranted = node.receiveVote(this.id, this.term);
                if (voteGranted) {
                    votesReceived++;
                }
            }
        });

        if (votesReceived >= votesNeeded) {
            this.becomeLeader();
        } else {
            this.votedFor = undefined;
            this.resetElectionTimer();
        }
    }

    receiveVote(candidateId: string, candidateTerm: number): boolean {
        if (
            (this.votedFor === undefined || this.votedFor === candidateId) &&
            this.term <= candidateTerm
        ) {
            this.votedFor = candidateId;
            this.term = candidateTerm;
            return true; // Голос отдан
        }

        return false; // Голос не отдан
    }

    private sendHeartbeats() {
        if (this.state !== NodeState.Leader) return;

        Node.nodes.forEach((node) => {
            if (node.id !== this.id) {
                node.receiveHeartbeat(this.term);
            }
        });
    }

    private resetElectionTimer() {
        if (this.electionTimeout) clearTimeout(this.electionTimeout);

        if (this.state !== NodeState.Follower) {
            this.state = NodeState.Follower;
        }

        // Задаем случайное время для таймера, например, от 150 до 300 мс
        const timeout = randomIn(this.minElectionTimeout, this.maxElectionTimeout);

        this.electionTimeout = setTimeout(() => {
            this.becomeCandidate();
            this.requestVotes();
        }, timeout);
    }

    private startHeartbeatTimer() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.sendHeartbeats();

        // Отправляем сердцебиение каждые 50 мс, например
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeats();
        }, this.heartbeatTime);
    }

    async onRequest(request: any): Promise<boolean> {
        return true;
    }

    private broadcast(request: any) {
        const promises: Array<Promise<boolean>> = [];

        Node.nodes.forEach((node) => {
            if (node.id !== this.id) {
                promises.push(node.onRequest(request));
            }
        });

        return Promise.race(promises);
    }

    // Добавление записи в журнал
    async appendEntry(term: number, command: Command): Promise<boolean> {
        if (this.isLeader) {
            const successNeeded = Math.floor(Node.nodes.length / 2) + 1;

            // Отправка AppendEntries всем последователям для репликации
            Node.nodes.forEach((node) => {
                if (node.id !== this.id) {
                    node.appendEntry(term, command);
                }
            });
        }

        this.applyCommand(command);

        this.logMap.set(this.nextLogIndex, { term, command });

        this.nextLogIndex++;

        return true;
    }

    // Применение команд из журнала к машине состояний
    applyCommand(command: Command) {
        // Применяем команду к машине состояний
    }

    commit(term: number, commandId: string) {
        // this.broadcast()
    }

    destroy() {
        console.log(`[Node:${this.id}][${this.term}] 🛑 destroyed`);

        if (this.state !== NodeState.Leader) {
            return;
        }

        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.state = NodeState.Follower;
        this.votedFor = undefined;
    }
}
