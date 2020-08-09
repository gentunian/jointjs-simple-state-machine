import './css/custom.css';
import 'jointjs/dist/joint.core.min.css';
import * as joint from 'jointjs';
import { MachineStatePaper, CellDataNode } from './machine-state-paper';
import { WindowMessageApi } from './api/window-message-api';

const $paper = document.createElement("div");
$paper.style.overflowX = "auto";
$paper.style.overflowY = "auto";
$paper.style.width = "100%"
$paper.style.height = "100%"
document.body.append($paper);

const paper = new joint.dia.Paper({
    el: $paper,
    cellViewNamespace: joint.shapes,
    model: new joint.dia.Graph({},{ cellNamespace: joint.shapes }),
    gridSize: 10,
    drawGrid: false,
    background: {},
    interactive: true,
    height: $paper.clientHeight,
    width: $paper.clientWidth,
});

const $container = document.createElement("div");
$container.style.pointerEvents = "none";
$container.style.position = "absolute";
$paper.append($container);

new MachineStatePaper(paper, new WindowMessageApi<CellDataNode>());
