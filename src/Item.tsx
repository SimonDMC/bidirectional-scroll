export default function Item(props: { number: number; id?: string }) {
    return (
        <div className="item" id={props.id}>
            {props.number}
        </div>
    );
}
