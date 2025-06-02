import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';

interface City {
    id: number;
    name: string;
    population: number;
    x_coordinate: number;
    y_coordinate: number;
}

interface RegionMapProps {
    regionName: string;
    cities: City[];
}

const RegionMap: React.FC<RegionMapProps> = ({ regionName, cities }) => {
    const imagePath = `/regions/${regionName.toLowerCase()}.png`;

    return (
        <div className="position-relative">
            <img src={imagePath} alt={`${regionName} map`} className="img-fluid" style={{ width: '100%' }} />
            {cities.map((city, index) => {
                //console.log(city);
                return (
                    <OverlayTrigger
                        key={index}
                        placement="top"
                        overlay={
                            <Tooltip id={`tooltip-${index}`}>
                                <strong>{city.name}</strong><br />
                                Population: {city.population.toLocaleString()}<br />
                                <small>Click to view details</small>
                            </Tooltip>
                        }
                    >
                        <Link to={`/cities/${city.id}`}>
                            <div
                                className="position-absolute"
                                style={{
                                    bottom: `${city.y_coordinate * 100}%`,
                                    left: `${city.x_coordinate * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: 'red',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: '1px solid white',
                                    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                                }}
                            ></div>
                        </Link>
                    </OverlayTrigger>
                );
            })}
        </div>
    );
};

export default RegionMap;