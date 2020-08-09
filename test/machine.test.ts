import { StateMachine, State, MachineStateData, IllegalStateError } from "../src/state/machine"
import { CellDataNode } from "../src/machine-state-paper";

interface MyNode extends CellDataNode {
    foo: string;
}

describe("StateMachine transition constraints suite.", () => {
    /**
     * initialize() transition constraints.
     */
    it("should not be possible to call initialize() when machine is on ready state.", () => {
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize([]);
        expect(() => { machine.initialize([]) }).toThrow(new IllegalStateError("initialize()", State.Created, State.Ready));
    })
    it("should not be possible to call initialize() when machine is on running state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        expect(() => { machine.initialize([]) }).toThrow(new IllegalStateError("initialize()", State.Created, State.Running));
    })
    it("should not be possible to call initialize() when machine is on stopped state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.stop();
        expect(() => { machine.initialize([]) }).toThrow(new IllegalStateError("initialize()", State.Created, State.Stopped));
    })
    it("should not be possible to call initialize() when machine is on done state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next();
        expect(() => { machine.initialize([]) }).toThrow(new IllegalStateError("initialize()", State.Created, State.Done));
    })

    /**
     * start() transition constraints.
     */
    it("should not be possible to call start() when machine is on created state.", () => {
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        expect(() => { machine.start() }).toThrow(new IllegalStateError("start()", State.Ready, State.Created));
    })
    it("should not be possible to call start() when machine is on running state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        expect(() => { machine.start() }).toThrow(new IllegalStateError("start()", State.Ready, State.Running));
    })
    it("should not be possible to call start() when machine is on stopped state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.stop();
        expect(() => { machine.start() }).toThrow(new IllegalStateError("start()", State.Ready, State.Stopped));
    })
    it("should not be possible to call start() when machine is on done state.", () => {
        const nodes: MyNode[] = [1].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next();
        expect(() => { machine.start() }).toThrow(new IllegalStateError("start()", State.Ready, State.Done));
    })

    /**
     * next() transition constraints.
     */
    it("should not be possible to call next() when machine is on created state.", () => {
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        expect(() => { machine.next() }).toThrow(new IllegalStateError("next()", "running", State.Created));
    })
    it("should not be possible to call next() when machine is on ready state.", () => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        expect(() => { machine.next() }).toThrow(new IllegalStateError("next()", "running", State.Ready));
    })
    it("should not be possible to call next() when machine is on stopped state.", () => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.stop();
        expect(() => { machine.next() }).toThrow(new IllegalStateError("next()", "running", State.Stopped));
    })
    it("should not be possible to call next() when machine is on done state.", () => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next();
        machine.next();
        machine.next();
        expect(() => { machine.next() }).toThrow(new IllegalStateError("next()", "running", State.Done));
    })

    /**
     * stop() transition constraints.
     */
    it("should not be possible to call stop() when machine is on created state.", () => {
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        expect(() => { machine.stop() }).toThrow(new IllegalStateError("stop()", "running", State.Created));
    })

    it("should not be possible to call stop() when machine is on ready state.", () => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        expect(() => { machine.stop() }).toThrow(new IllegalStateError("stop()", "running", State.Ready));
    })
    it("should not be possible to call stop() when machine is on done state.", () => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next();
        machine.next();
        machine.next();
        expect(() => { machine.stop() }).toThrow(new IllegalStateError("stop()", "running", State.Done));
    })
})

describe("StateMachine notify observables suite.", () => {
    it("should initialize machine state correctly and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.nodes).toEqual(nodes);
            expect(data.current).toBe(0);
            expect(data.state).toBe(State.Ready);
            done();
        })
        machine.initialize(nodes);
    });

    it("should start machine correctly and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(0);
            expect(data.nodes[data.current].state).toBe(State.Running);
            expect(data.state).toBe(State.Running);
            done();
        })
        machine.start();
    })

    it("should set next data node correctly and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(1);
            expect(data.nodes[data.current].state).toBe(State.Running);
            expect(data.nodes[data.current - 1].state).toBe(State.Done);
            expect(data.state).toBe(State.Running);
            done();
        })
        machine.next()
    })

    it("should set next data node with error and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(1);
            expect(data.nodes[data.current - 1].state).toBe(State.Error);
            expect(data.nodes[data.current - 1].error).toBe("error data");
            expect(data.state).toBe(State.Running);
            done();
        })
        machine.next("error data")
    })

    it("should start and finish machine correctly and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next()
        machine.next()
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(nodes.length - 1);
            expect(data.nodes[data.current].state).toBe(State.Done);
            expect(data.state).toBe(State.Done);
            done();
        })
        machine.next()
    })

    it("should stop a running maching and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next()
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(1);
            expect(data.nodes[data.current].state).toBe(State.Done);
            expect(data.state).toBe(State.Stopped);
            done();
        })
        machine.stop()
    })

    it("should stop a running maching setting and error and notify subscribers.", (done: any) => {
        const nodes: MyNode[] = [1, 2, 3].map(i => ({ foo: `foo node ${i}`, name: `node${i}`, state: State.Created }));
        const machine: StateMachine<MyNode> = new StateMachine<MyNode>();
        machine.initialize(nodes);
        machine.start();
        machine.next()
        machine.subscribe((data: MachineStateData<MyNode>) => {
            expect(data.current).toBe(1);
            expect(data.nodes[data.current].state).toBe(State.Error);
            expect(data.nodes[data.current].error).toBe("error data");
            expect(data.state).toBe(State.Stopped);
            done();
        })
        machine.stop("error data")
    })
})