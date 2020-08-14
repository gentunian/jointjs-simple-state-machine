import './css/custom.css';
import 'jointjs/dist/joint.core.min.css';
import * as joint from 'jointjs';
import { MachineStatePaper, CellDataNode, DoneStrategy } from './machine-state-paper';
import { MachineApi } from './api/machine-api';
import { WindowMessageApi } from './api/window-message-api';

(<any>window).createMachineStatePaper = <T extends CellDataNode>(
    elementId?: string,
    api?: MachineApi<T>,
    doneStrategy?: DoneStrategy<T>,
    $window: Window = window
) => {
    const prepareElement = (id: string, document: Document): HTMLElement => {
        let element: HTMLElement;
        if (id) {
            element = document.getElementById(id);
        } else {
            element = document.createElement("div")
            document.body.append(element);
        }
        element.style.overflowX = "auto";
        element.style.overflowY = "auto";
        element.style.width = "100%";
        element.style.height = "100%";
        return element;
    }
    const document = $window.document;
    const $paper = prepareElement(elementId, document);
    const paper = new joint.dia.Paper({
        el: $paper,
        cellViewNamespace: joint.shapes,
        model: new joint.dia.Graph({},{ cellNamespace: joint.shapes }),
        gridSize: 10,
        drawGrid: false,
        background: {},
        height: "100%",
        width: "100%"
    });

    const $container = document.createElement("div");
    $container.style.pointerEvents = "none";
    $container.style.position = "absolute";
    $paper.append($container);

    return new MachineStatePaper(paper, api || new WindowMessageApi<T>($window), doneStrategy).api;
}

