import React from "react";
import SfmBoard from "../Indicators/SfmBoard";

export default function Organisation({ selectedUnit }) {
    return (
        <div className='p-3'>
            <SfmBoard subunit={selectedUnit?.label} />
        </div>
    );
}
