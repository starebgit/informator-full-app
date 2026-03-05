import { WidthProvider, Responsive } from "react-grid-layout";
import { useEffect, useState } from "react";
const ResponsiveReactGridLayout = WidthProvider(Responsive);

//Requires parent with state that handles layout changes and if wanted fetches user-settings layout from db
function DynamicGrid(props) {
    //const layoutLS = getFromLS(props.source);
    const [layout, setLayouts] = useState({});
    let layoutDB = props.layouts ? { ...props.layouts } : {};

    useEffect(() => {
        setLayouts(props.layouts ? { ...props.layouts } : {});
    }, [props.layouts]);

    useEffect(() => {
        if (props.reset) {
            setLayouts({ ...layoutDB });
            props.setReset(false);
        }
    }, [props.reset]);

    const onLayoutChangeHandler = (layout, layouts) => {
        if (Object.keys(layoutDB).length !== Object.keys(layouts).length) {
            props.initLayoutsHandler(layouts, props.source);
            //initNewLayoutHandler(layouts, props.source);
        } else if (props.isEditable) {
            //setLayouts({...layouts});
            props.setTempLayoutsHandler(layouts, props.source);
        }
    };

    const resetLayout = () => {
        setLayouts({});
    };

    const Grid = (
        <div>
            {/* <button type='button' onClick={() => resetLayout()}>Reset</button> */}
            <ResponsiveReactGridLayout
                className='layout'
                cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}
                rowHeight={20}
                margin={[30, 15]}
                isDraggable={props.isEditable}
                isResizable={props.isEditable}
                measureBeforeMount={true}
                useCSSTransforms={false}
                layouts={layout}
                onLayoutChange={(layout, layouts) => onLayoutChangeHandler(layout, layouts)}
            >
                {props.children}
            </ResponsiveReactGridLayout>
        </div>
    );

    return <div>{Grid}</div>;
}

export default DynamicGrid;
