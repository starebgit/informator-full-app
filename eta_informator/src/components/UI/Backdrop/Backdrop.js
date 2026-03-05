import styles from "./Backdrop.module.scss";

function Backdrop(props) {
    return props.show ? (
        <div
            onClick={props.clicked}
            style={{ opacity: props.show ? 1 : 0 }}
            className={styles.Backdrop}
        ></div>
    ) : null;
}

export default Backdrop;
