import React from 'react';

export interface GalleryProps {
    title: string;
    /** @format image-url */
    images: string[];
}

export const Gallery = (props: GalleryProps) => {
    return (
        <div>
            <h1>{props.title}</h1>
            {props.images.map((image) => (
                <img key={image} src={image} alt="" />
            ))}
        </div>
    );
};
