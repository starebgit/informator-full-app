import { useDroppable, DragOverlay } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import UserTag from "./UserTag";

const Container = styled.div`
    width: 100%;
    min-height: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    background: ${(props) => (props.empty ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,1)")};
    border: ${(props) => (props.active ? "1px dotted lightgray" : "1px solid white")};
    padding: 0.1em;
    flex-wrap: wrap;
    font-size: 12px;
    li:not(:last-child) {
        border-bottom: 1px solid lightgray;
    }
`;

function Dropbox({ operation, employees, setDistribution, editing, active, machine, ...props }) {
    const { t, i18n } = useTranslation("manual_input");
    const { isOver, setNodeRef } = useDroppable({
        id: machine + operation,
        data: {
            operation: operation,
            machine: machine,
        },
    });
    const Tags = employees
        ?.sort((a, b) => new Intl.Collator("sl").compare(a.lastname, b.lastname))
        .map((entry) => {
            return (
                <UserTag
                    key={entry.employeeId}
                    name={entry.firstname + " " + entry.lastname}
                    id={entry.id}
                    machineId={machine}
                    employeeId={entry.employeeId}
                    source={operation}
                    editing={editing}
                    available={entry.available}
                />
            );
        });
    return (
        <Container empty={employees?.length == 0} active={isOver} ref={setNodeRef}>
            {/* //{isActive ? 'Release to add an employee' : workers.length == 0 ? 'Drag an employee from the thing' : Tags} */}
            {employees?.length == 0 ? t("drag_from_list") : Tags}
        </Container>
    );
}

export default Dropbox;
