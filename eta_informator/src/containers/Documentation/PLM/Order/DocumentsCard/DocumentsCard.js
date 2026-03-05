import { Tab, Row, Col, Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import FilesTable from "./FilesTable/FilesTable";

function DocumentsCard(props) {
    let categories = {};
    let pills = null;
    let content = null;

    const { t } = useTranslation("documentation");
    if (!!props.documents) {
        props.documents?.dokumente?.forEach((value) => {
            //const category = value.kategorie.replace(" ", "_").toLowerCase();
            const category = value.kategorie;
            if (!categories[category]) {
                categories[category] = [];
            }
            value.path = "https://plmordersearch-0004.bfits.com//data/";
            const categoriesArray = [...categories[category]];
            categoriesArray.push(value);
            categories[category] = categoriesArray;
        });
        pills = Object.keys(categories)
            .sort()
            .map((category) => {
                return (
                    <Nav.Item size='small' key={category + "item"}>
                        <Nav.Link style={{ textDecoration: "none" }} eventKey={category}>
                            <h6 className='mb-0 text-uppercase small'>{t(category)}</h6>
                        </Nav.Link>
                    </Nav.Item>
                );
            });
        content = Object.keys(categories).map((category) => {
            return (
                <Tab.Pane key={category} eventKey={category}>
                    <FilesTable
                        clicked={props.clicked}
                        files={categories[category]}
                        path={
                            category == "drawings_local"
                                ? `http://${process.env.REACT_APP_DRAWINGS}/`
                                : props.path
                        }
                    />
                </Tab.Pane>
            );
        });
    } else {
    }
    return (
        <Tab.Container id='left-tabs-example' defaultActiveKey={Object.keys(categories).sort()[0]}>
            <Row className='justify-content-around no-gutters'>
                <Col xs={12} sm={12} lg={3} xl={2} className='border-lg-right pe-lg-3'>
                    <h6 className='p-1' style={{ color: "var(--bs-secondary)" }}>
                        {t("categories")}
                    </h6>
                    <Nav variant='pills' className='flex-column'>
                        {pills}
                    </Nav>
                </Col>
                <Col xs={12} sm={12} lg={9} xl={10}>
                    <Tab.Content>{content}</Tab.Content>
                </Col>
            </Row>
        </Tab.Container>
    );
}
export default DocumentsCard;
