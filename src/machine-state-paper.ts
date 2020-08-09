import joint = require("jointjs");
import * as dagre from "dagre";
// @ts-ignore
import * as graphlib from "@dagrejs/graphlib";
import './shapes/task';
import { DataNode, MachineStateData, State } from "./state/machine";
import { MachineApiEventName, MachineApi } from "./api/machine-api";
import { join } from "lodash";

/**
 * Colors for the paper state machine to show when machines are done.
 */
export enum MachineStatePaperColor {
    Succees = "#10a324",
    Error = "#ff4365",
    Running = "lightblue",
}

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
    (data: T[], errorNodes: T[]): boolean;
}

/**
 * Default done strategy that returns true when no data node is in error.
 * 
 * Done strategy callback is called when machines enters into `State.Stopped` or `State.Done` states.
 * It should return true whether or not it's considered a success or an error.
 * 
 * For example, a machine may be considered in error when at least 1 data node is in error state.
 * 
 * @param errorNodes data nodes array in error state.
 */
const defaultDoneStrategy: DoneStrategy<CellDataNode> = (data: CellDataNode[], errorNodes: CellDataNode[]) => {
    return errorNodes.length === 0;
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

    private machines: State[] = [];

    constructor(
        private paper: joint.dia.Paper,
        api: MachineApi<T>,
        private doneStrategy: DoneStrategy<T> = defaultDoneStrategy,
    ) {
        this.startShape = new joint.shapes.standard.Circle();
        this.startShape.size(20, 20);
        this.startShape.attr(ElementAttrs.BodyFill, MachineStatePaperColor.Running);
        this.endShape = this.startShape.clone() as joint.dia.Element;
        api.subscribe(data => {
            switch (data.event) {
                case MachineApiEventName.Create:
                    data.machine.subscribe(this.handleMachineStateData.bind(this))
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
    }

    /**
     * Maps data nodes to shapes to be drawn on the Paper with their correspondent links.
     * 
     * @param nodes data nodes from a state machine that was initialized.
     */
    initialize(nodes: T[]) {
        // only add start and end shape is this is the first machine to be added.
        if (this.machines.length === 0) {
            this.paper.model.addCell(this.startShape);
            this.paper.model.addCell(this.endShape);
        }
        const shapesCells = nodes.map(this.nodeToShape);
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
    }

    /**
     * Updates data nodes `nodes` with correspondent state.
     * 
     * @param nodes data nodes from the machine that updated its status.
     */
    update(nodes: T[]) {
        nodes.forEach(node => {
            const cell = this.paper.model.getCell(node.cid)
            cell.attr(ElementAttrs.FieldsState, node.state)
        })
    }

    /**
     * Called when a machine was stopped or done.
     * 
     * @param data machine state data.
     */
    machineDone(data: MachineStateData<T>) {
        // updates data nodes status.
        this.update(data.nodes);
        const errorNodes = data.nodes.filter(n => n.state === State.Error)
        // gets the done strategy output passing nodes and nodes with errors.
        const color = this.doneStrategy(data.nodes, errorNodes) ? MachineStatePaperColor.Succees : MachineStatePaperColor.Error;
        // sets endShape fill color based on the output of `doneStrategy`.        
        this.paper.model.getCell(this.endShape.cid).attr(ElementAttrs.BodyFill, color);
    }

    handleMachineStateData(data: MachineStateData<T>) {
        switch (data.state) {
            case State.Done:
                this.machineDone(data);
                break;
            case State.Ready:
                this.initialize(data.nodes);
                break;
            case State.Stopped:
                this.machineDone(data);
            default:
                this.update(data.nodes);
                break;
        }
    }
}