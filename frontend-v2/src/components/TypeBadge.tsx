import React from 'react';

interface TypeBadgeProps {
    type: string;
}

const typeColors: { [key: string]: string } = {
    normal: 'bg-[#A8A77A]',
    fire: 'bg-[#EE8130]',
    water: 'bg-[#6390F0]',
    electric: 'bg-[#F7D02C]',
    grass: 'bg-[#7AC74C]',
    ice: 'bg-[#96D9D6]',
    fighting: 'bg-[#C22E28]',
    poison: 'bg-[#A33EA1]',
    ground: 'bg-[#E2BF65]',
    flying: 'bg-[#A98FF3]',
    psychic: 'bg-[#F95587]',
    bug: 'bg-[#A6B91A]',
    rock: 'bg-[#B6A136]',
    ghost: 'bg-[#735797]',
    dragon: 'bg-[#6F35FC]',
    dark: 'bg-[#705746]',
    steel: 'bg-[#B7B7CE]',
    fairy: 'bg-[#D685AD]',
};

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
    const colorClass = typeColors[type.toLowerCase()] || 'bg-gray-500';
    
    return (
        <span className={`${colorClass} px-3 py-1 rounded-full text-white font-bold text-sm uppercase`}>
            {type}
        </span>
    );
};

export default TypeBadge; 