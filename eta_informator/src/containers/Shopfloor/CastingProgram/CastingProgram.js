import { Card, Container } from "react-bootstrap";
import { useCastingProgram } from "../../../data/ReactQuery";
import { PulseLoader, ScaleLoader } from "react-spinners";
import { useTranslation } from "react-i18next";
import { getNoticesByQuery } from "../../../data/API/Informator/InformatorAPI";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Inline from "yet-another-react-lightbox/plugins/inline";
import "yet-another-react-lightbox/styles.css";

export default function CastingProgram() {
    const { t } = useTranslation("shopfloor");
    const [selectedNotice, setSelectedNotice] = useState(0);
    const castingProgramQuery = useCastingProgram();
    const noticesQuery = useQuery(
        ["notices", castingProgramQuery.data?.data[0]?.program],
        () => {
            const program = castingProgramQuery.data?.data[0]?.program;
            function extractFormCode(program) {
                const match = program?.match(/\d+/);
                return match ? match[0] : "";
            }
            const formCodeSearch = extractFormCode(program);
            return getNoticesByQuery(1, 100, -1, {
                formCode: formCodeSearch,
            });
        },
        {
            enabled: castingProgramQuery.isSuccess,
            refetchInterval: 1000 * 60 * 5,
        },
    );

    //Use effect on inital load to increment the selected notice every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            setSelectedNotice((prev) => (prev + 1) % noticesQuery.data?.data.length);
        }, 60000);
        return () => clearInterval(interval);
    }, [noticesQuery.data?.data.length]);

    // refresh page every 10 minutes
    useEffect(() => {
        const interval = setInterval(
            () => {
                window.location.reload();
            },
            12 * 60 * 1000,
        ); // 12 minut v milisekundah
        return () => clearInterval(interval);
    }, []);

    const images = useMemo(
        () =>
            noticesQuery.data?.data[selectedNotice]?.uploads?.map((upload) => {
                const imagePath = new URL(`http://${process.env.REACT_APP_INFORMATOR}/`);
                imagePath.pathname = upload.path.split("public")[1];
                return {
                    src: imagePath.toString(),
                    description: upload.description,
                };
            }),
        [noticesQuery.data, selectedNotice],
    );

    if (castingProgramQuery.isLoading || noticesQuery.isLoading)
        return (
            <Container>
                <div
                    className='d-flex h-100 justify-content-center align-items-center'
                    style={{ minHeight: "300px" }}
                >
                    <ScaleLoader color='#2c3e50' size={15} margin={10} />
                </div>
            </Container>
        );

    const castingProgram = castingProgramQuery.data?.data[0] || {};
    const notice = noticesQuery.data?.data[selectedNotice] || {};

    return (
        <Container>
            <Card className='border-0 shadow p-4 d-flex flex-row justify-content-between align-items-center flex-wrap mb-3'>
                <div className='d-flex flex-column gap-1'>
                    <h3 className='mb-0'>{t("current_casting_program")}</h3>
                    <div>
                        {t("started_at")}:{" "}
                        <span>
                            {dayjs(castingProgram?.startTimestamp)
                                .subtract(2, "hour")
                                .format("LLL")}
                        </span>
                    </div>
                </div>
                <div className='d-flex flex-row gap-3'>
                    <div className='fs-4'>
                        {t("program_id")}:{" "}
                        <span className='fw-bold'>{castingProgram?.programId}</span> -{" "}
                        <span className='fw-bold'>{castingProgram?.program}</span>
                    </div>
                </div>
            </Card>
            {noticesQuery.data?.data.length > 0 ? (
                <div className='d-flex flex-column gap-1'>
                    <div className='d-flex align-items-center gap-3'>
                        <h3 className='mb-0'>{t("notices")}</h3>{" "}
                        <div className='mb-0 fs-4'>
                            {selectedNotice + 1} / {noticesQuery?.data?.data?.length}
                        </div>
                    </div>
                    <div className='px-2'>
                        <div className='mb-1'>
                            {t("description")}: {notice.description}
                        </div>
                        <div className='d-flex justify-content-center'>
                            <Lightbox
                                plugins={[Inline, Slideshow]}
                                slides={images}
                                inline={{
                                    style: {
                                        width: "100%",
                                        maxWidth: "60vw",
                                        aspectRatio: "3 / 2",
                                    },
                                }}
                                slideshow={{ autoplay: true, delay: 5000 }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className='d-flex justify-content-center mt-5'>
                    <div className='fs-4'>{t("no_linked_notices")}</div>
                </div>
            )}
        </Container>
    );
}
