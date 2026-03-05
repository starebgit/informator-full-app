import { useState } from "react";
import Char from "./Char/Char";
import GridClick from "./GridClick/GridClick";
function Character(props) {
    const [maxId, setMaxId] = useState([]);
    const [color, setColor] = useState(0);
    return (
        <div className='d-flex flex-column align-items-center justify-content-center'>
            <Char color={color} char={props.char} />
            <div style={{ fontWeight: "900" }}>{props.title}</div>
            <GridClick
                defaultValues={props.defaultValues}
                setMaxId={setMaxId}
                maxId={maxId}
                setColor={setColor}
                x={props.x}
                y={props.y}
            />
        </div>
    );
}

export default Character;
