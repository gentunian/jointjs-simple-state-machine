import { StateMachine, DataNode } from "../state/machine"
import { MachineApi } from "./machine-api";

export enum StateMachineMessageCommand {
    Initialize = "initialize",
    Next = "next",
    Start = "start",
    Create = "create",
    Destroy = "destroy",
    Stop = "stop",
}

export interface StateMachineMessageData<T> {
    error?: any;
    nodes: T[];
}

export interface StateMachineMessage<T extends DataNode> {
    id: string;
    command: StateMachineMessageCommand;
    data?: StateMachineMessageData<T>;
}

export interface MachinesDict<T extends DataNode> {
    [key: string]: StateMachine<T>;
}

/**
 * Transport based on window messaging (`window.postMessage`) capability.
 */
export class WindowMessageApi<T extends DataNode> extends MachineApi<T> {

    constructor(window: Window) {
        super();
        const handleEvent = (event: MessageEvent) => {
            const message = event.data as StateMachineMessage<T>
            if (this[message.command]) {
                this[message.command](message.id, message.data)
            } else {
                console.error(`WARN: No handler for command '${message.command}'. `)
            }
        }
        window.addEventListener("message", handleEvent);
    }
}
