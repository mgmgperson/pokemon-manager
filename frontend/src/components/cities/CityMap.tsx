import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface CityMapProps {
    regionName: string;
    cityName: string;
    x_coordinate: number;
    y_coordinate: number;
}

const CityMap: React.FC<CityMapProps> = ({ regionName, cityName, x_coordinate, y_coordinate }) => {
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;

    return (
        <div className="position-relative">
            <h3 className="mb-4">{cityName} Location</h3>
            <img src={imagePath} alt={`${regionName} map`} className="img-fluid" style={{ width: '100%' }} />
            <OverlayTrigger
                placement="top"
                overlay={
                    <Tooltip id={`tooltip-${cityName}`}>
                        <strong>{cityName}</strong>
                    </Tooltip>
                }
            >
                <div
                    className="position-absolute"
                    style={{
                        bottom: `${y_coordinate * 100}%`,
                        left: `${x_coordinate * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '15px',
                        height: '15px',
                        backgroundColor: 'red',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: '2px solid white',
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                    }}
                ></div>
            </OverlayTrigger>
        </div>
    );
};

export default CityMap;