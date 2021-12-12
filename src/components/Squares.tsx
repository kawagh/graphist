type SquareState = 'O' | 'X' | null
type SquareProps = {
    value: SquareState
    onClick: () => void
}

const Square = (props: SquareProps) => {
    return (
        <button className="square"
            onClick={props.onClick}
        > {props.value}</button >
    );
}
export { Square };
export type { SquareState };