import styled from "styled-components";
import { useDraggable } from "@dnd-kit/core";

const Usero = styled.li`
    width: 100%;
    max-width: ${(props) => (props.source != "list" ? "175px" : "225px")};
    background-color: ${(props) => (props.source != "list" ? "unset" : "whitesmoke")};
    min-width: 100px;
    border-radius: ${(props) => (props.source != "list" ? "unset" : "3px")};
    padding: ${(props) => (props.source != "list" ? "2px 10px" : "2px 5px")};
    margin: ${(props) => (props.source != "list" ? "unset" : "2px 6px")};
    cursor: ${(props) => (props.editing && props.available ? "move" : "inherit")};
`;

const Dot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 10px;
    background-color: ${(props) => (props.available ? "darkgreen" : "crimson")};
`;

function UserTag({
    id,
    employeeId,
    machineId,
    name,
    editing = false,
    source = "list",
    available,
    ...props
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: {
            id: id,
            employeeId: employeeId,
            name: name,
            available: available,
            operation: source,
            machine: machineId,
        },
        //disabled: !editing || (!available && source == 'list')
        disabled: !editing,
    });

    return (
        <Usero
            editing={editing}
            available={available}
            source={source}
            className='d-flex align-items-center justify-content-between'
            ref={setNodeRef}
            {...listeners}
            {...attributes}
        >
            <div style={{ fontSize: "14px" }}>{name}</div>
            <Dot available={available} />
        </Usero>
    );
}

export default UserTag;
