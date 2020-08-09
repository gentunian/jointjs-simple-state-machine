import { Observable } from "../utils/observable";

export enum State {
    Running = "running",
    Error = "error",
    Stopped = "stopped",
    Created = "created",
    Ready = "ready",
    Done = "done",
}

export interface DataNode {
    name: string;
    state: State;
    error?: any;
}

/**
 * MachineStateData defines the state that a `StateMachine` may have.
 * 
 * `nodes` are `DataNode`s that holds a name, a state and an error object.
 * `state` is the current state of the machine. 
 * `current` is the index of the current node the machine is actually setting.
 */
export interface MachineStateData<T extends DataNode> {
    nodes: T[];
    state: State;
    current: number;
}

export class IllegalStateError extends Error {
    constructor(invoked: string, expected: string, current: string) {
        super(`Illegal state: ${invoked} called when machine is not ${expected}. Current state: ${current}`)
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

/**
 * Simplistic observable state machine.
 * 
 * Note: machineState is mutable from outside `StateMachine`. This was not avoided on purpouse
 * because is out of scope of this simple implementation. Future changes may bring inmutability to the project.
 */
export class StateMachine<T extends DataNode> extends Observable<MachineStateData<T>> {

    private machineState: MachineStateData<T> = {
        nodes: [],
        state: State.Created,
        current: -1
    }

    /**
     * Initializes the StateMachine with data nodes (states). `initial` will not mutate and
     * internal nodes will be a different array.
     * 
     * Nodes states are set to `State.Initialized` state.
     * StateMachine state is set to `State.Ready`.
     * 
     * initialize() can be called only once.
     * 
     * @param initial array of data nodes or states.
     */
    initialize(initial: T[]) {
        if (this.machineState.state !== State.Created) {
            throw new IllegalStateError("initialize()", State.Created, this.machineState.state);
        }
        this.machineState.nodes = initial.map(item => ({ ...item, state: State.Created }));
        this.machineState.current = 0
        this.machineState.state = State.Ready;
        this.wrapNotify();
    }

    /**
     * Starts the machine. Puts the machine state to `State.Running` and sets the first
     * state node to `State.Running` state.
     * 
     * Start cannot be called with empty nodes.
     * Start cannot be called if machine is not in `State.Ready` state.
     */
    start() {
        if (this.machineState.state !== State.Ready) {
            throw new IllegalStateError("start()", State.Ready, this.machineState.state);
        }
        if (this.machineState.nodes.length === 0) {
            throw Error("Illegal state: start() called with empty machine.");
        }
        this.machineState.current = 0;
        this.machineState.state = State.Running;
        this.machineState.nodes[this.machineState.current].state = State.Running;
        this.wrapNotify()
    }

    /**
     * Sets the current data node to `State.Done` if no `error` was provided, or `State.Error` otherwise.
     * 
     * Takes the next (if any) data node and sets its state to `State.Running`.
     * 
     * If no more data nodes are left, puts itself to `State.Done` state.
     * 
     * next() cannot be called if machine is not running.
     * 
     * @param error indicates that the current data node is in error state.
     */
    next(error?: any) {
        if (this.machineState.state !== State.Running) {
            throw new IllegalStateError("next()", State.Running, this.machineState.state);
        }

        if (error) {
            this.machineState.nodes[this.machineState.current].state = State.Error;
            this.machineState.nodes[this.machineState.current].error = error;
        } else {
            this.machineState.nodes[this.machineState.current].state = State.Done;
        }

        if (this.machineState.current >= this.machineState.nodes.length - 1) {
            this.machineState.state = State.Done;
        } else {
            this.machineState.current++
            this.machineState.nodes[this.machineState.current].state = State.Running
        }
        this.wrapNotify()
    }

    /**
     * Stops the state machine. If error is not undefined, current data node is set to
     * `State.Done`, and to `State.Error` otherwise.
     * 
     * Machine state is set to `State.Stopped`.
     * 
     * @param error set this parameter is current data node should be set to `State.Error` state.
     */
    stop(error?: any) {
        if (this.machineState.state !== State.Running) {
            throw new IllegalStateError("stop()", State.Running, this.machineState.state);
        }

        if (error) {
            this.machineState.nodes[this.machineState.current].state = State.Error;
            this.machineState.nodes[this.machineState.current].error = error;
        } else {
            this.machineState.nodes[this.machineState.current].state = State.Done;
        }

        this.machineState.state = State.Stopped;
        this.wrapNotify();
    }

    // helper method that notifies current machine state to subscribers.
    private wrapNotify() {
        this.notify(this.machineState);
    }
}