import { Container, Row } from "react-bootstrap";
import StockCard from "./StockCard";
import { useLastSync } from "../../../data/ReactQuery";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const stockCategories = {
    default: ["casts", "protectors", "fireclays", "spirals", "clips", "rings"],
    livarna_obdelovalnica: ["casts", "rings"],
};

export default function Stock({ selectedUnit, ...props }) {
    const categories = stockCategories[selectedUnit?.keyword] || stockCategories["default"];
    const lastSync = useLastSync();
    const { t } = useTranslation("labels");

    return (
        <Container className='g-0'>
            <Row className='gy-4 pb-4'>
                <div className='d-flex gap-2'>
                    <div>{t("last_updated")}:</div>
                    <div>{lastSync.isSuccess && dayjs(lastSync.data[0].date).format("LLL")}</div>
                </div>
            </Row>
            <Row className='gy-4 pb-4'>
                {categories.map((category) => (
                    <StockCard key={category} stockCategory={category} />
                ))}
            </Row>
        </Container>
    );
}
