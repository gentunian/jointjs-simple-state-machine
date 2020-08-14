import joint = require("jointjs");
import * as dagre from "dagre";
// @ts-ignore
import * as graphlib from "@dagrejs/graphlib";
import './shapes/task';
import { DataNode, MachineStateData, State } from "./state/machine";
import { MachineApiEventName, MachineApi } from "./api/machine-api";

/**
 * Extends `DataNode` to add the cell id for getting cells from `joint.dia.Graph`.
 */
export interface CellDataNode extends DataNode {
    cid?: string | number;
}

/**
 * Function type receives the full data nodes array and the data nodes that are in error state.
 */
export interface DoneStrategy<T extends CellDataNode> {
    local: (id: string, machine: MachineStateData<T>) => State;
    global: (states: State[]) => State;
}

/**
 * Default done strategy.
 */
const defaultDoneStrategy: DoneStrategy<CellDataNode> = {
    local: (id: string, machine: MachineStateData<CellDataNode>): State => {
        if (machine.state === State.Stopped || machine.state === State.Done) {
            return (machine.nodes.filter(n => n.state === State.Error).length > 0) ? State.Error : State.Done;
        } else {
            return State.Running
        }
    },
    global: (states: State[]): State => {
        return states.reduce((p, c) => (p === State.Running || p === State.Error && c !== State.Running) ? p : c, State.Done);
    }
}

enum ElementAttrs {
    FieldsId = "fields/id",
    FieldsName = "fields/name",
    FieldsState = "fields/state",
    BodyFill = "body/fill",
}

enum LinkRouter {
    Metro = "metro",
    Manhattan = "manhattan",
}

enum LinkConnector {
    Rounded = "rounded",
}

interface MachineStats {
    errors: number;
    ok: number;
    nodes: number;
}

// defaults directions for route algorithm.
const routeDir = ["top", "right", "bottom", "left"];

/**
 * Class responsible of drawing state machines.
 * 
 * Note: data nodes are mutable. See `noteToShape` comment.
 */
export class MachineStatePaper<T extends CellDataNode> {

    // start circle on paper shows initial point.
    private startShape: joint.dia.Element;

    // end circle on paper shows final point.
    private endShape: joint.dia.Element;

    // global state for each machine by id. Not to be confused with the state of the machine.
    // This is the state from the paper point of view based on configured strategies.
    private states: { [key in string]: State } = {};

    // Colors for the paper state machine to show when machines are done.
    private machineStatePaperColor: { [key in State]: string } = {
        [State.Done]: "#10a324",
        [State.Error]: "#ff4365",
        [State.Running]: "lightblue",
        [State.Running]: "lightblue",
        [State.Stopped]: "#10a324",
        [State.Created]: "lightblue",
        [State.Ready]: "lightblue",
    };

    constructor(
        private paper: joint.dia.Paper,
        public readonly api: MachineApi<T>,
        private doneStrategy: DoneStrategy<T> = defaultDoneStrategy,
    ) {
        this.startShape = new joint.shapes.standard.Circle();
        this.startShape.size(20, 20);
        this.startShape.attr(ElementAttrs.BodyFill, this.machineStatePaperColor[State.Running]);
        this.endShape = this.startShape.clone() as joint.dia.Element;
        api.subscribe(data => {
            switch (data.event) {
                case MachineApiEventName.Create:
                    data.machine.subscribe(mData => this.handleMachineStateData(data.machineId, mData));
                    break;
            }
        });
    }

    /**
     * Creates a new shape based on the data node.
     * Shape cid is assigned to data node `cid` property.
     * 
     * We need to mutate node data in order to find the shape in the paper
     * more efficiently. An inmutable approach is possible, but more complex
     * data structures needs to be implemented and it's worthless.
     * 
     * @param node a state machine data node to wrap as a custom Task.
     */
    nodeToShape(node: T): joint.dia.Cell {
        const shape = new joint.shapes.custom.Task();
        shape.attr(ElementAttrs.FieldsName, node.name);
        shape.attr(ElementAttrs.FieldsState, node.state);
        node.cid = shape.cid;
        return shape;
    }

    /**
     * Links shapes together.
     * 
     * @param source cell.
     * @param target cell.
     * @param start cell.
     * @param end cell.
     */
    linkShapes(
        source: joint.dia.Cell,
        target: joint.dia.Cell,
        startDirections: string[] = routeDir,
        endDirections: string[] = routeDir
    ): joint.dia.Cell {
        const link = new joint.shapes.standard.Link();
        link.router(LinkRouter.Metro, { startDirections, endDirections });
        link.connector(LinkConnector.Rounded);
        link.source(source);
        link.target(target);
        return link;
    }

    /**
     * Do a layout with `dagre` and `graphlib` algorithms.
     */
    layout() {
        joint.layout.DirectedGraph.layout(this.paper.model, {
            dagre,
            graphlib,
            marginX: 30,
            marginY: 30,
        });
        this.paper.fitToContent({ padding: 10 });
    }

    /**
     * Maps data nodes to shapes to be drawn on the Paper with their correspondent links.
     * 
     * @param nodes data nodes from a state machine that was initialized.
     */
    initialize(id: string, data: MachineStateData<T>) {
        if (Object.keys(this.states).length === 0) {
            this.paper.model.addCell(this.startShape);
            this.paper.model.addCell(this.endShape);
        }
        const shapesCells = data.nodes.map(this.nodeToShape);
        const linksCells = shapesCells
            .map((shape, index) => {
                if (index > 0) {
                    return this.linkShapes(shapesCells[index - 1], shape);
                } else {
                    return this.linkShapes(this.startShape, shape, ["bottom"], ["top"]);
                }
            });

        // always link to endShape.
        linksCells.push(this.linkShapes(shapesCells[shapesCells.length - 1], this.endShape, ["bottom"], ["top"]))
        this.paper.model.addCells(shapesCells);
        this.paper.model.addCells(linksCells);
        this.layout();
        // global state for machine id `id` based on this paper.
        this.states[id] = State.Running;
    }

    /**
     * Updates data nodes `nodes` with correspondent state.
     * 
     * @param nodes data nodes from the machine that updated its status.
     */
    updatePaper(nodes: T[]) {
        nodes.forEach(node => {
            const cell = this.paper.model.getCell(node.cid)
            if (cell) {
                cell.attr(ElementAttrs.FieldsState, node.state)
            }
        })
    }

    /**
     * Returns a color based on the state parameter.
     * 
     * @param state to retrieve a color from.
     */
    private getColorFromState(state: State): string {
        return this.machineStatePaperColor[state];
    }

    /**
     * Called when a machine was stopped, done, or in error.
     * 
     * @param states the states for each machine.
     */
    machineDone(id: string, data: MachineStateData<T>) {
        // updates data nodes status.
        this.updatePaper(data.nodes);

        // gets the local state for machine `id`.
        this.states[id] = this.doneStrategy.local(id, data);
        
        // gets all states for all machines.
        const states = Object.keys(this.states).map(k => this.states[k]);

        // gets the global state.
        const globalState = this.doneStrategy.global(states)
        const color = this.getColorFromState(globalState);

        // sets endShape fill color based on the output of `doneStrategy`.        
        this.paper.model.getCell(this.endShape.cid).attr(ElementAttrs.BodyFill, color);
    }

    handleMachineStateData(machineId: string, data: MachineStateData<T>) {
        switch (data.state) {
            case State.Ready:
                this.initialize(machineId, data);
                break;
            case State.Done:
            case State.Stopped:
            case State.Error:
                this.machineDone(machineId, data);
                break;
            default:
                this.updatePaper(data.nodes);
                break;
        }
    }
}