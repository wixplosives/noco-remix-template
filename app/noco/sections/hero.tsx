import React from 'react';

export interface HeroProps {
    title: string;
    subtitle: string;
    /** @format image-url */
    image: string;
}

export const Hero = (props: HeroProps) => {
    return (
        <div>
            <h1>{props.title}</h1>
            <h2>{props.subtitle}</h2>
            <img src={props.image} alt="" />
        </div>
    );
};
