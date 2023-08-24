import React, { useState, useEffect } from 'react';
import Node from './Node';
import { dijkstra } from './dijkstra';
import { AStar } from './astar.js';
import { dfs } from './dfs';
import { bfs } from './bfs';

import './pathfindingvisualizer.css';

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [startNodeRow, setStartNodeRow] = useState(5);
  const [finishNodeRow, setFinishNodeRow] = useState(15);
  const [startNodeCol, setStartNodeCol] = useState(5);
  const [finishNodeCol, setFinishNodeCol] = useState(25);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [rowCount, setRowCount] = useState(25);
  const [colCount, setColCount] = useState(35);
  const [mobileRowCount, setMobileRowCount] = useState(20);
  const [mobileColCount, setMobileColCount] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isStartNode, setIsStartNode] = useState(false);
  const [isFinishNode, setIsFinishNode] = useState(false);
  const [isWallNode, setIsWallNode] = useState(false);
  const [currRow, setCurrRow] = useState(0);
  const [currCol, setCurrCol] = useState(0);
  const [isDesktopView, setIsDesktopView] = useState(false);
  

  useEffect(() => {
    const grid = getInitialGrid();
    setGrid(grid);
  }, []);

  const toggleIsRunning = () => {
    setIsRunning(isRunning=>!isRunning);
  };

  const toggleView = () => {
    if (!isRunning) {
      clearGrid();
      clearWalls();
      setIsDesktopView(!isDesktopView);
      let grid;
      if (isDesktopView) {
        grid = getInitialGrid(rowCount, colCount);
        setGrid(grid);
      } else {
        if (
          startNodeRow > mobileRowCount ||
          finishNodeRow > mobileRowCount ||
          startNodeCol > mobileColCount ||
          finishNodeCol > mobileColCount
        ) {
          alert('Start & Finish Nodes Must Be within 10 Rows x 20 Columns');
        } else {
          grid = getInitialGrid(mobileRowCount, mobileColCount);
          setGrid(grid);
          
        }
      }
    }
  };

  /******************** Set up the initial grid ********************/
  const getInitialGrid = (rowCount = 25, colCount = 35) => {
    const initialGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(createNode(row, col));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  };

  const createNode = (row, col) => {
    return {
      row,
      col,
      isStart: row === startNodeRow && col === startNodeCol,
      isFinish: row === finishNodeRow && col === finishNodeCol,
      distance: Infinity,
      distanceToFinishNode:
        Math.abs(finishNodeRow - row) + Math.abs(finishNodeCol - col),
      isVisited: false,
      isWall: false,
      previousNode: null,
      isNode: true,
    };
  };

  /******************** Control mouse events ********************/
  const handleMouseDown = (row, col) => {
    if (!isRunning) {
      if (isGridClear()) {
        if (document.getElementById(`node-${row}-${col}`).classList.contains('node-start')) {
          setMouseIsPressed(true);
          setIsStartNode(true);
          setCurrRow(row);
          setCurrCol(col);
        } else if (document.getElementById(`node-${row}-${col}`).classList.contains('node-finish')) {
          setMouseIsPressed(true);
          setIsFinishNode(true);
          setCurrRow(row);
          setCurrCol(col);
        } else {
          const newGrid = getNewGridWithWallToggled(grid, row, col);
          setGrid(newGrid);
          setMouseIsPressed(true);
          setIsWallNode(true);
          setCurrRow(row);
          setCurrCol(col);
        }
      } else {
        clearGrid();
      }
    }
  };

  const isGridClear = () => {
    for (const row of grid) {
      for (const node of row) {
        const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).classList;
        if (
          nodeClassName.contains('node-visited') ||
          nodeClassName.contains('node-shortest-path')
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const handleMouseEnter = (row, col) => {
    if (!isRunning) {
      if (mouseIsPressed) {
        const nodeClassName = document.getElementById(`node-${row}-${col}`).classList;
        if (isStartNode) {
          if (!nodeClassName.contains('node-wall')) {
            const prevStartNode = grid[currRow][currCol];
            prevStartNode.isStart = false;
            document.getElementById(`node-${currRow}-${currCol}`).classList.remove('node-start');

            setCurrRow(row);
            setCurrCol(col);
            const currStartNode = grid[row][col];
            currStartNode.isStart = true;
            document.getElementById(`node-${row}-${col}`).classList.add('node-start');
          }
          setStartNodeRow(row);
          setStartNodeCol(col);
        } else if (isFinishNode) {
          if (!nodeClassName.contains('node-wall')) {
            const prevFinishNode = grid[currRow][currCol];
            prevFinishNode.isFinish = false;
            document.getElementById(`node-${currRow}-${currCol}`).classList.remove('node-finish');

            setCurrRow(row);
            setCurrCol(col);
            const currFinishNode = grid[row][col];
            currFinishNode.isFinish = true;
            document.getElementById(`node-${row}-${col}`).classList.add('node-finish');
          }
          setFinishNodeRow(row);
          setFinishNodeCol(col);
        } else if (isWallNode) {
          const newGrid = getNewGridWithWallToggled(grid, row, col);
          setGrid(newGrid);
        }
      }
    }
  };

  const handleMouseUp = (row, col) => {
    if (!isRunning) {
      setMouseIsPressed(false);
      if (isStartNode) {
        setIsStartNode(false);
        setStartNodeRow(row);
        setStartNodeCol(col);
      } else if (isFinishNode) {
        setIsFinishNode(false);
        setFinishNodeRow(row);
        setFinishNodeCol(col);
      }
      getInitialGrid();
    }
  };

  const handleMouseLeave = () => {
    if (isStartNode) {
      setIsStartNode(false);
      setMouseIsPressed(false);
    } else if (isFinishNode) {
      setIsFinishNode(false);
      setMouseIsPressed(false);
    } else if (isWallNode) {
      setIsWallNode(false);
      setMouseIsPressed(false);
      getInitialGrid();
    }
  };

  /******************** Clear Board/Walls ********************/

  const clearGrid = () => {
    if (!isRunning) {
      const newGrid = grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).classList;
          if (
            !nodeClassName.contains('node-start') &&
            !nodeClassName.contains('node-finish') &&
            !nodeClassName.contains('node-wall')
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).classList.remove('node-visited', 'node-shortest-path');
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = Math.abs(finishNodeRow - node.row) + Math.abs(finishNodeCol - node.col);
          }
          if (nodeClassName.contains('node-finish')) {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = 0;
          }
          if (nodeClassName.contains('node-start')) {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = Math.abs(finishNodeRow - node.row) + Math.abs(finishNodeCol - node.col);
            node.isStart = true;
            node.isWall = false;
            node.previousNode = null;
            node.isNode = true;
          }
        }
      }
    }
  };

  const clearWalls = () => {
    if (!isRunning) {
      const newGrid = grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).classList;
          if (nodeClassName.contains('node-wall')) {
            document.getElementById(`node-${node.row}-${node.col}`).classList.remove('node-wall');
            node.isWall = false;
          }
        }
      }
    }
  };

  /******************** Create Animations ********************/
  const visualize = (algo) => {
    if (!isRunning) {
      clearGrid();
      toggleIsRunning();
      const startNode = grid[startNodeRow][startNodeCol];
      const finishNode = grid[finishNodeRow][finishNodeCol];
      let visitedNodesInOrder;
      switch (algo) {
        case 'Dijkstra':
          visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
          break;
        case 'AStar':
          visitedNodesInOrder = AStar(grid, startNode, finishNode);
          break;
        case 'BFS':
          visitedNodesInOrder = bfs(grid, startNode, finishNode);
          break;
        case 'DFS':
          visitedNodesInOrder = dfs(grid, startNode, finishNode);
          break;
        default:
          // should never get here
          break;
      }
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      nodesInShortestPathOrder.push('end');
      animate(visitedNodesInOrder, nodesInShortestPathOrder);
    }
  };

  const animate = (visitedNodesInOrder, nodesInShortestPathOrder) => {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).classList;
        if (!nodeClassName.contains('node-start') && !nodeClassName.contains('node-finish')) {
          document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-visited');
        }
      }, 10 * i);
    }
  };

  /******************** Create path from start to finish ********************/
  const animateShortestPath = (nodesInShortestPathOrder) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      if (nodesInShortestPathOrder[i] === 'end') {
        setTimeout(() => {
          toggleIsRunning();
        }, i * 50);
      } else {
        setTimeout(() => {
          const node = nodesInShortestPathOrder[i];
          const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).classList;
          if (!nodeClassName.contains('node-start') && !nodeClassName.contains('node-finish')) {
            document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-shortest-path');
          }
        }, i * 40);
      }
    }
  };
  const getNewGridWithWallToggled = (grid, row, col) => {
    // mouseDown starts to act strange if I don't make newGrid and work off of grid instead.
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (!node.isStart && !node.isFinish && node.isNode) {
      const newNode = {
        ...node,
        isWall: !node.isWall,
      };
      newGrid[row][col] = newNode;
    }
    return newGrid;
  };
  const getNodesInShortestPathOrder=(finishNode)=> {
    const nodesInShortestPathOrder = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
      nodesInShortestPathOrder.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
  };
  return (
    <div >
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark ">
        <a className="navbar-brand" href="/">
          <b>PathFinding Visualizer</b>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <button
        type="button"
        className="btn btn-danger enlarge-button"
        onClick={() => clearGrid()}
        >
        Clear Grid
        </button>
        <button
        type="button"
        className="btn btn-warning enlarge-button"
        onClick={() => clearWalls()}
      >
        Clear Walls
      </button>
      <button
        type="button"
        className="btn btn-primary enlarge-button"
        onClick={() => visualize('Dijkstra')}
      >
        Dijkstra's
      </button>
      <button
        type="button"
        className="btn btn-primary enlarge-button"
        onClick={() => visualize('AStar')}
      >
        A*
      </button>
      <button
        type="button"
        className="btn btn-primary enlarge-button"
        onClick={() => visualize('BFS')}
      >
        Bread First Search
      </button>
      <button
        type="button"
        className="btn btn-primary enlarge-button"
        onClick={() => visualize('DFS')}
      >
        Depth First Search
      </button>
      {isDesktopView ? (
        <button
          type="button"
          className="btn btn-light enlarge-button"
          onClick={() => toggleView()}
        >
          Desktop View
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-dark enlarge-button"
          onClick={() => toggleView()}
        >
          Mobile View
        </button>
      )}
      </nav>

      <table
        className="grid-container"
        onMouseLeave={() => handleMouseLeave()}
      >
        <tbody className="grid">
          {grid.map((row, rowIdx) => {
            return (
              <tr key={rowIdx}>
                {row.map((node, nodeIdx) => {
                  const { row, col, isFinish, isStart, isWall } = node;
                  return (
                    <Node
                      key={nodeIdx}
                      col={col}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      mouseIsPressed={mouseIsPressed}
                      onMouseDown={(row, col) => handleMouseDown(row, col)}
                      onMouseEnter={(row, col) => handleMouseEnter(row, col)}
                      onMouseUp={() => handleMouseUp(row, col)}
                      row={row}
                    ></Node>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      
      
    </div>
  );
};

export default PathfindingVisualizer;
