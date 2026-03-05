import { useEffect, useState } from "react";
import styled from "styled-components";

const ColorBox = styled.div`
    background-color: ${(props) => {
        return props.status == 0
            ? props.id % 7 == 5 || props.id % 7 == 6
                ? "gray"
                : "rgba(240,240,240)"
            : props.status == 1
            ? "rgba(251, 0, 34, 0.9)"
            : props.status == 2
            ? "rgba(4, 170, 56, 1)"
            : "gray";
    }};
    border: 1px solid lightgray;
`;

function Box({ id, maxId, setMaxId, setColor, ...props }) {
    const [status, setStatus] = useState(props.defaultValue || 0);
    const onClick = () => {
        switchStatus();
    };

    useEffect(() => {
        if (status == 0) {
            const i = maxId.indexOf(id);
            if (i != -1) maxId.splice(i, 1);
            if (Math.max(...maxId) == maxId || maxId.length == 0) setColor(status);
        } else {
            if (Math.max(...maxId) < id) {
                setMaxId([...maxId, id]);
                setColor(status);
            } else if (Math.max(...maxId) == id) {
                setColor(status);
            }
        }
    }, [status]);
    const switchStatus = () => {
        setStatus((status + 1) % 3);
    };

    return (
        <ColorBox
            id={id}
            status={status}
            style={{ height: "100%", width: "100%" }}
            onClick={() => onClick()}
        />
    );
}
export default Box;
