import React from 'react';
import '../css/Pokedex.scss';

interface TypeBadgeProps {
    type: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
    return (
        <span className={`type-badge type-${type.toLowerCase()}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
    );
};

export default TypeBadge;
