import { Observable } from "../utils/observable";
import { StateMachine, DataNode } from "../state/machine";
import { StateMachineMessageData } from "./window-message-api";

/**
 * Event names for observable api.
 */
export enum MachineApiEventName {
    Initialize = "initialize",
    Next = "next",
    Start = "start",
    Create = "create",
    Destroy = "destroy",
    Stop = "stop",
}

/**
 * Event for observable api. An event has a defined `MachineApiEventName` and
 * the machine.
 */
export interface MachineApiEvent<T extends DataNode> {
    event: MachineApiEventName;
    machine: StateMachine<T>;
}

export interface MachinesDict<T extends DataNode> {
    [key: string]: StateMachine<T>;
}

/**
 * Simplistic API for managing multiple state machines.
 * 
 * API may be extended for different transports implementations.
 */
export class MachineApi<T extends DataNode> extends Observable<MachineApiEvent<T>> {
    protected machines: MachinesDict<T> = {};

    /**
     * Creates a new state machine and notifies subscribers.
     * 
     * @param id of the machine to be created.
     * @returns the state machine created.
     */
    public create(id: string): StateMachine<T> {
        if (this.machines[id]) {
            throw new Error(`Illegal operation create(): Machine with id '${id}' already exist.`)
        }
        const machine = new StateMachine<T>();
        this.machines[id] = machine;
        this.notifySubscribers(id, MachineApiEventName.Create);
        return machine;
    }

    /**
     * Initializes the machine with id `id` and data `data`.
     * 
     * @param id of the machine to initialize.
     * @param data for the machine to initialize.
     */
    public initialize(id: string, data: StateMachineMessageData<T>) {
        this.machines[id]?.initialize(data.nodes);
        this.notifySubscribers(id, MachineApiEventName.Initialize);
    }

    /**
     * Invokes next(data) on the machine with id `id` passing `data` as arguments.
     * 
     * @param id of the machine to call next.
     * @param data for the machine for the next() transition.
     */
    public next(id: string, data?: StateMachineMessageData<T>) {
        this.machines[id]?.next(data?.error);
        this.notifySubscribers(id, MachineApiEventName.Next);
    }

    /**
     * Stops a machine with id `id`.
     * 
     * @param id of the matchine to stop.
     * @param data for the machine for the stop() transition.
     */
    public stop(id: string, data?: StateMachineMessageData<T>) {
        this.machines[id]?.stop(data?.error);
        this.notifySubscribers(id, MachineApiEventName.Stop);
    }

    /**
     * Starts the machine with id `id`.
     * 
     * @param id of the machine to start.
     */
    public start(id: string) {
        this.machines[id]?.start()
        this.notifySubscribers(id, MachineApiEventName.Start);
    }

    /**
     * Removes a machine.
     * 
     * @param id of the machine to destroy.
     */
    public destroy(id: string) {
        this.notifySubscribers(id, MachineApiEventName.Destroy);
        delete this.machines[id];
    }

    private notifySubscribers(id: string, event: MachineApiEventName) {
        this.machines[id] && this.notify({ event, machine: this.machines[id] })
    }
}