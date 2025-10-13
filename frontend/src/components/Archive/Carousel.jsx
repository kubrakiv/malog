import { useState } from "react";
import Carousel from "react-bootstrap/Carousel";
import { Image, Container, Row, Col } from "react-bootstrap";
import images from "../../img/images";

function ControlledCarousel() {
    const [index, setIndex] = useState(0);

    const handleSelect = (selectedIndex) => {
        setIndex(selectedIndex);
    };

    return (
        <>
            {images.map((image, index) => (
                <Carousel activeIndex={index} onSelect={handleSelect}>
                    <Carousel.Item>
                        <Image
                            text={`${index} slide`}
                            as="img"
                            key={index}
                            src={image.logo}
                            rounded
                        />
                        <Carousel.Caption>
                            {/* <h3>First slide label</h3> */}
                            {/* <p>
                                Nulla vitae elit libero, a pharetra augue mollis
                                interdum.
                            </p> */}
                        </Carousel.Caption>
                    </Carousel.Item>
                </Carousel>
            ))}
        </>
    );
}

export default ControlledCarousel;
