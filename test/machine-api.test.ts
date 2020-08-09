import { MachineApi, MachineApiEventName } from "../src/api/machine-api"
import { CellDataNode } from "../src/machine-state-paper"
import { State } from "../src/state/machine";

describe("Machine API test suite.", () => {
    it("should not be possible to create two machines with same name.", () => {
        const api = new MachineApi<CellDataNode>();
        api.create("m1");
        expect(() => { api.create("m1"); }).toThrowError("Illegal operation create(): Machine with id 'm1' already exist.");
    })

    it("should create new machine and notify subscribers.", () => {
        const api = new MachineApi<CellDataNode>();
        api.subscribe(data => {
            expect(data.event).toBe(MachineApiEventName.Create);
            expect(data.machine).toBeDefined();
        });
        api.create("m1");
    })

    it("should initialize machine calling initialize() and notify subscribers.", (done: any) => {
        const nodes: CellDataNode[] = [1].map(i => ({ name: `node${i}`, state: State.Created }));
        const api = new MachineApi<CellDataNode>();
        const m1 = api.create("m1");
        m1.subscribe(data => {
            expect(data.current).toBe(0);
            expect(data.state).toBe(State.Ready);
            expect(data.nodes).toEqual(nodes);
            done();
        });
        api.subscribe(data => {
            expect(data.event).toBe(MachineApiEventName.Initialize);
            expect(data.machine).toEqual(m1);
        })
        api.initialize("m1", { nodes });
    })

    it("should call machine start() and notify subscribers.", (done: any) => {
        const nodes: CellDataNode[] = [1, 2].map(i => ({ name: `node${i}`, state: State.Created }));
        const api = new MachineApi<CellDataNode>();
        const m1 = api.create("m1");
        api.initialize("m1", { nodes });
        m1.subscribe(data => {
            expect(data.current).toBe(0);
            expect(data.state).toBe(State.Running);
            expect(data.nodes[data.current].state).toBe(State.Running);
            done();
        });
        api.subscribe(data => {
            expect(data.event).toBe(MachineApiEventName.Start);
            expect(data.machine).toEqual(m1);
        })
        api.start("m1");
    })

    it("should call machine next() and notify subscribers.", (done: any) => {
        const nodes: CellDataNode[] = [1, 2].map(i => ({ name: `node${i}`, state: State.Created }));
        const api = new MachineApi<CellDataNode>();
        const m1 = api.create("m1");
        api.initialize("m1", { nodes });
        api.start("m1");
        m1.subscribe(data => {
            expect(data.current).toBe(1);
            expect(data.state).toBe(State.Running);
            expect(data.nodes[data.current].state).toBe(State.Running);
            done();
        });
        api.subscribe(data => {
            expect(data.event).toBe(MachineApiEventName.Next);
            expect(data.machine).toEqual(m1);
        })
        api.next("m1");
    })

    it("should call machine stop() and notify subscribers.", (done: any) => {
        const nodes: CellDataNode[] = [1, 2, 3].map(i => ({ name: `node${i}`, state: State.Created }));
        const api = new MachineApi<CellDataNode>();
        const m1 = api.create("m1");
        api.initialize("m1", { nodes });
        api.start("m1");
        api.next("m1");
        m1.subscribe(data => {
            expect(data.current).toBe(1);
            expect(data.state).toBe(State.Stopped);
            expect(data.nodes[data.current].state).toBe(State.Done);
            done();
        });
        api.subscribe(data => {
            expect(data.event).toBe(MachineApiEventName.Stop);
            expect(data.machine).toEqual(m1);
        })
        api.stop("m1");
    })


})