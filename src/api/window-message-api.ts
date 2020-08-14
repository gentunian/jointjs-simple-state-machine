import { DataNode } from "../state/machine"
import { MachineApi, MachineApiEventName, MachineApiData } from "./machine-api";

/**
 * A message handled into `window.postMessage` has the following type:
 */
export interface WindowMessageApiMessage<T extends DataNode> {
    id: string;
    command: MachineApiEventName;
    data?: MachineApiData<T>;
}

/**
 * Transport based on window messaging (`window.postMessage`) capability.
 */
export class WindowMessageApi<T extends DataNode> extends MachineApi<T> {

    constructor(window: Window) {
        super();
        const handleEvent = (event: MessageEvent) => {
            const message = event.data as WindowMessageApiMessage<T>
            if (this[message.command]) {
                this[message.command](message.id, message.data)
            } else {
                console.error(`WARN: No handler for command '${message.command}'. `)
            }
        }
        window.addEventListener("message", handleEvent);
    }
}
