import styled from "styled-components";
import { Button } from "react-bootstrap";
import { useHistory, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
const Card = styled.div`
    border: 1px solid var(--bs-primary);
    width: 30%;
    padding: 1rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    margin: 8px 16px;
`;

function GroupSquare({ name, id, conditions, ...props }) {
    const { path } = useRouteMatch();
    const { t } = useTranslation("manual_input");
    const history = useHistory();
    return (
        <Card>
            <h4>{name}</h4>
            <h6 className='text-truncate'>
                {conditions == 0
                    ? t("no_condition")
                    : conditions + " " + t("condition", { count: conditions })}
            </h6>
            <Button
                className='mx-auto mt-auto'
                size='sm'
                onClick={() => history.push(path + "/edit/" + id)}
            >
                {t("edit")}
            </Button>
        </Card>
    );
}

export default GroupSquare;
