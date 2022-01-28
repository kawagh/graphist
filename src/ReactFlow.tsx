import React, { useState, useRef, useCallback } from 'react';
import calculateWinner from './util';
import ReactFlow, {
    ReactFlowProvider,
    removeElements,
    addEdge,
    MiniMap,
    Controls,
    isNode,
    Position
} from 'react-flow-renderer';
import dagre from 'dagre';
import Boards from './components/Boards';

type Node = {
    id: string
    type: "input" | "default" | "output"
    data: any
    position: any
}
type Edge = {
    id: string
    source: string
    target: string
    label: string
}
type Element = Node | Edge

const initialElements: Element[] = [
    {
        id: '0',
        type: 'input',
        data: { label: 'root' },
        position: { x: 250, y: 5 },
    },
];



const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// const nodes = useStoreState(state => state.nodes) and then node.__rf.width, node.__rf.height
const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (elements: any, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    elements.forEach((el: any) => {
        if (isNode(el)) {
            dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
        } else {
            dagreGraph.setEdge(el.source, el.target);
        }
    });

    dagre.layout(dagreGraph);

    return elements.map((el: any) => {
        if (isNode(el)) {
            const nodeWithPosition = dagreGraph.node(el.id);
            el.targetPosition = isHorizontal ? Position.Left : Position.Top;
            el.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

            // unfortunately we need this little hack to pass a slightly different position
            // to notify react flow about the change. Moreover we are shifting the dagre node position
            // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
            el.position = {
                x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
                y: nodeWithPosition.y - nodeHeight / 2,
            };
        }

        return el;
    });
};

const layoutedElements = getLayoutedElements(initialElements);




let id = 1;
const getId = () => `${id++}`;
// const getId2 = () => Math.floor(Math.random() * 1000);
const DnDFlow = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [elements, setElements] = useState(initialElements);
    const [lastNodeId, setLastNodeId] = useState(0);

    const [history, setHistory] = useState([{ squares: Array(9).fill(null), }]);
    const [xIsNext, setxIsNext] = useState(false);

    const GamehandleClick = (i: number) => {
        console.log('button clicked');
        const currentHistory = history[lastNodeId];

        // 終了か置かれたマスにはおけない
        if (calculateWinner(currentHistory.squares) || currentHistory.squares[i]) {
            return;
        }

        let _xIsNext = currentHistory.squares.filter(x => x != null).length % 2 != 0;
        const newSquares = currentHistory.squares.slice();
        newSquares[i] = _xIsNext ? 'X' : 'O';
        // newSquares[i] = xIsNext ? 'X' : 'O';
        setHistory(history.concat([{ squares: newSquares }]));
        setxIsNext(!_xIsNext);

        // グラフ更新の処理
        handleClick();
    }
    const resetState = () => {
        setxIsNext(false);

    }

    // const onConnect = (params: any) => setElements((els) => addEdge(params, els));
    // const onElementsRemove = (elementsToRemove: any) =>
    //     setElements((els) => removeElements(elementsToRemove, els));
    const onLayout = useCallback(
        (direction) => {
            const layoutedElements = getLayoutedElements(elements, direction);
            setElements(layoutedElements);
        },
        [elements]
    );

    const onLoad = (_reactFlowInstance: any) =>
        setReactFlowInstance(_reactFlowInstance);

    const onDragOver = (event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };
    const onNodeMouseEnter = (event: any, node: any) => {
        console.log("on node", node.id)
        console.log("on node", current.squares);
        event.preventDefault();
        setLastNodeId(parseInt(node.id));

        // 反映が遅い
        setxIsNext(history[lastNodeId].squares.filter(x => x !== null).length % 2 !== 0);
    }

    const handleClick = () => {
        // nodeとedgeを新たに追加する
        const newNode: Node = {
            id: getId(),
            type: "default",
            position: { x: Math.random() * 300, y: Math.random() * 300 },
            data: { label: `${id}` },
        };
        const newEdge = { id: `e${lastNodeId}-${newNode.id}`, source: `${lastNodeId}`, target: `${newNode.id}`, label: 'e' };

        setElements((es) => es.concat(newNode));
        setElements((es) => es.concat(newEdge));

        // sort
        setElements((es) => getLayoutedElements(es, 'TB'));

        // 追加されたノードを直近のノードにする
        setLastNodeId(parseInt(newNode.id));

    }

    // const onDrop = (event: any) => {
    //     event.preventDefault();

    //     const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    //     const type = event.dataTransfer.getData('application/reactflow');
    //     const position = reactFlowInstance.project({
    //         x: event.clientX - reactFlowBounds.left,
    //         y: event.clientY - reactFlowBounds.top,
    //     });
    //     const newNode = {
    //         id: getId(),
    //         type,
    //         position,
    //         data: { label: `${type} node` },
    //     };

    //     setElements((es) => es.concat(newNode));
    // };



    const current = history[lastNodeId];
    const winner = calculateWinner(current.squares);
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    }
    //  else {
    //     status = 'Next player: ' + (xIsNext ? 'X' : 'O');
    // }
    return (

        <div className="dndflow">
            <div className="flex-box">
                <div className="flex-box-item">
                    <div>current: {lastNodeId + 1}</div>
                    <Boards
                        squares={current.squares}
                        onClick={(i) => { GamehandleClick(i); }}
                    />

                    <div className="controls">
                        <button onClick={() => onLayout('TB')}>vertical layout</button>
                        {/* <button onClick={() => onLayout('LR')}>horizontal layout</button> */}
                    </div>
                    <div> {winner != null && status} </div>
                </div>

                <div className="flex-box-item">
                    <ReactFlowProvider>
                        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                            <ReactFlow
                                elements={elements}
                                // onConnect={onConnect}
                                // onElementsRemove={onElementsRemove}
                                onLoad={onLoad}
                                onNodeMouseEnter={onNodeMouseEnter}
                                // onDrop={onDrop}
                                onDragOver={onDragOver}
                                style={{ height: 800, width: 1000 }}
                            >
                                {/* <MiniMap
                                    nodeStrokeColor={(n: any) => {
                                        if (n.style?.background) return n.style.background;
                                        if (n.type === 'input') return '#0041d0';
                                        if (n.type === 'output') return '#ff0072';
                                        if (n.type === 'default') return '#1a192b';

                                        return '#eee';
                                    }}
                                    nodeColor={(n: any) => {
                                        if (n.style?.background) return n.style.background;

                                        return '#fff';
                                    }}
                                    nodeBorderRadius={2}
                                /> */}

                                {/* <Controls /> */}
                            </ReactFlow>

                        </div>
                    </ReactFlowProvider>
                </div>
            </div>

        </div>
    );
};

export default DnDFlow;