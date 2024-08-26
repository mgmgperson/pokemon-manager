import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Sprites } from '../../types';

interface PokemonSpritesProps {
    sprites: Sprites;
}

const PokemonSprites: React.FC<PokemonSpritesProps> = ({ sprites }) => {
    const renderSpriteRow = (id: string, spriteUrls: (string | null)[]) => {
        const hasSprites = spriteUrls.some((url) => url !== null);
        if (!hasSprites) return null;

        return (
            <>
                <h4>{id}</h4>
                <Row className="mb-4">
                    {spriteUrls.map((url, index) => url && (
                        <Col xs={6} md={3} key={`${id}-${index}`}>
                            <img src={url} alt={`${id}-${index}`} style={{ width: '30%' }} />
                        </Col>
                    ))}
                </Row>
            </>
        );
    };

    return (
        <div>
            {renderSpriteRow("Default", [
                sprites.front_default, sprites.back_default, 
                sprites.front_shiny, sprites.back_shiny
            ])}

            {sprites.other && (
                <>
                    {renderSpriteRow("Dream World", [
                        sprites.other.dream_world.front_default
                    ])}
                    {renderSpriteRow("Home", [
                        sprites.other.home.front_default, sprites.other.home.front_shiny
                    ])}
                    {renderSpriteRow("Official Artwork", [
                        sprites.other['official-artwork'].front_default, sprites.other['official-artwork'].front_shiny
                    ])}
                    {renderSpriteRow("Showdown", [
                        sprites.other.showdown.front_default, sprites.other.showdown.back_default,
                        sprites.other.showdown.front_shiny, sprites.other.showdown.back_shiny
                    ])}
                </>
            )}

            {sprites.versions && Object.entries(sprites.versions).map(([generation, games], index) => {
                const spriteUrls = Object.values(games).flatMap(game => 
                    Object.values(game as { [key: string]: string | null }).filter((url): url is string | null => typeof url === 'string' || url === null)
                );
                if (spriteUrls.length === 0) return null;
                return (
                    <div key={`generation-${generation}-${index}`}>
                        {renderSpriteRow(generation.toUpperCase().replace(/-/g, ' '), spriteUrls)}
                    </div>
                );
            })}
        </div>
    );
};

export default PokemonSprites;
