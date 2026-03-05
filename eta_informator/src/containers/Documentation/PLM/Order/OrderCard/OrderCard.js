import { Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

function OrderCard(props) {
    const { t } = useTranslation("documentation");
    return (
        <Table borderless responsive='md' size='sm' onClick={() => props.onClick(true)}>
            <tbody>
                <tr>
                    <th>{t("material")}</th>
                    <td>{props.material}</td>
                </tr>
                <tr>
                    <th>{t("name")}</th>
                    <td>{props.name}</td>
                </tr>
                <tr>
                    <th>{t("dimension")}</th>
                    <td>
                        {props.dimension != "\r" && props.dimension
                            ? props.dimension
                            : "Ni podatka"}
                    </td>
                </tr>
                <tr>
                    <th>{t("launched_quantity")}</th>
                    <td>{props.quantity}</td>
                </tr>
            </tbody>
        </Table>
    );
}

export default OrderCard;
