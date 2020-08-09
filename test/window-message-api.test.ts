import { WindowMessageApi, StateMachineMessageCommand, StateMachineMessage } from "../src/api/window-message-api";
import { CellDataNode } from "../src/machine-state-paper";
import { State, StateMachine } from "../src/state/machine";

describe("Window Message API test suite.", () => {
    it("should call MachineApi methods when proper message data is received.", (done: any) => {
        const wapi = new WindowMessageApi(window);
        const nodes: CellDataNode[] = [1, 2, 3].map(i => ({ name: `node${i}`, state: State.Created }));
        const createMessage: StateMachineMessage<CellDataNode> = { command: StateMachineMessageCommand.Create, id: "m0" };
        const startMessage: StateMachineMessage<CellDataNode> = { command: StateMachineMessageCommand.Start, id: "m0" };
        const nextMessage: StateMachineMessage<CellDataNode> = { command: StateMachineMessageCommand.Next, id: "m0" };
        const stopMessage: StateMachineMessage<CellDataNode> = { command: StateMachineMessageCommand.Stop, id: "m0" };
        const initializeMessage: StateMachineMessage<CellDataNode> = { command: StateMachineMessageCommand.Initialize, id: "m0", data: { nodes } };

        spyOn(wapi, "create").and.callFake(() => {
            expect(wapi.create).toHaveBeenCalled();
            return done(new StateMachine<CellDataNode>())
        })
        spyOn(wapi, "initialize").and.callFake(() => {
            expect(wapi.initialize).toHaveBeenCalled();
            done();
        })
        spyOn(wapi, "start").and.callFake(() => {
            expect(wapi.start).toHaveBeenCalled();
            done();
        })
        spyOn(wapi, "next").and.callFake(() => {
            expect(wapi.next).toHaveBeenCalled();
            done();
        })
        spyOn(wapi, "stop").and.callFake(() => {
            expect(wapi.stop).toHaveBeenCalled();
            done();
        })

        window.postMessage(createMessage, "*");
        window.postMessage(initializeMessage, "*");
        window.postMessage(startMessage, "*");
        window.postMessage(nextMessage, "*");
        window.postMessage(stopMessage, "*");
    })
});
