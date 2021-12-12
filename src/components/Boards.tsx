import { Square, SquareState } from "./Squares"
type BoardState = SquareState[]
type BoardProps = {
    squares: BoardState
    onClick: (i: number) => void
}
const Boards = (props: BoardProps) => {
    const renderSquare = (i: number) => {
        return <Square
            value={props.squares[i]}
            onClick={() => props.onClick(i)} />
    }
    return <>
        <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
        </div>
        <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
        </div>
        <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
        </div>
    </>
}
export default Boards;