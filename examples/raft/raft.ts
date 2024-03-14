import { HEARTBEAT_INTERVAL, MAX_ELECTION_TIMEOUT, MIN_ELECTION_TIMEOUT } from './const';
import { Node } from './node';
import { NodeState } from './types';

let lastNodeId = 0;

const makeNode = () => {
    lastNodeId++;

    return new Node(
        lastNodeId.toString(),
        HEARTBEAT_INTERVAL,
        MIN_ELECTION_TIMEOUT,
        MAX_ELECTION_TIMEOUT,
    );
};

const nodes = new Array(9).fill(0).map(makeNode);

Node.registerNode(...nodes);

let tick = 1;
setInterval(() => {
    for (const node of nodes) {
        if (node.state === NodeState.Leader) {
            node.destroy();
        }
    }

    console.log(`Tick: ${tick++}`);
}, 1_000);
