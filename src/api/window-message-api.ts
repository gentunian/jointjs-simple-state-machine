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
    id?: number;
    command: StateMachineMessageCommand;
    data: StateMachineMessageData<T>;
}

export interface MachinesDict<T extends DataNode> {
    [key: string]: StateMachine<T>;
}

/**
 * Transport based on window messaging (`window.postMessage`) capability.
 */
export class WindowMessageApi<T extends DataNode> extends MachineApi<T> {

    private api = {
        create: this.create,
        initialize: this.initialize,
        next: this.next,
        stop: this.stop,
        start: this.start,
        destroy: this.destroy,
    }

    constructor() {
        super();
        const handleEvent = (event: MessageEvent) => {
            const message = event.data as StateMachineMessage<T>
            const handler = this.api[message.command]
            if (handler) {
                handler.bind(this)(message.id, message.data)
            } else {
                console.error(`WARN: No handler for command '${message.command}'. `)
            }
        }
        window.addEventListener("message", handleEvent.bind(this));
    }
}
