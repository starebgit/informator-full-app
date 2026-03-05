import styles from "./Workunit.module.scss";

function Workunit(props) {
    return <div className={styles.Workunit}>{props.unit}</div>;
}
export default Workunit;
