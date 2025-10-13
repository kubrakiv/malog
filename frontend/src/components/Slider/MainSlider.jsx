import React, { useState, useEffect } from "react";
import delta_dog from "../../img/delta_dog.jpg";
import delta_dog_1 from "../../img/delta_dog_1.jpg";
import delta_dog_2 from "../../img/delta_dog_2.jpg";
import delta_dog_3 from "../../img/delta_dog_3.jpg";
import delta_1 from "../../img/delta_1.jpg";
import delta_2 from "../../img/delta_2.jpg";
import trucks from "../../img/trucks.jpg";
import "./MainSlider.scss";

function MainSlider() {
    const [slideIndex, setSlideIndex] = useState(1);

    const slider = [
        delta_1,
        delta_2,
        delta_dog,
        delta_dog_1,
        delta_dog_2,
        delta_dog_3,
        trucks,
    ];

    useEffect(() => {
        showSlides(slideIndex);
    }, [slideIndex]);

    function plusSlides(n) {
        setSlideIndex((prevIndex) => {
            let newIndex = prevIndex + n;
            if (newIndex > slider.length) {
                newIndex = 1;
            } else if (newIndex < 1) {
                newIndex = slider.length;
            }
            return newIndex;
        });
    }

    function currentSlide(n) {
        setSlideIndex(n);
    }

    function showSlides(n) {
        const slides = document.getElementsByClassName("mySlides");
        const dots = document.getElementsByClassName("dot");
        if (n > slides.length) {
            setSlideIndex(1);
        }
        if (n < 1) {
            setSlideIndex(slides.length);
        }
        for (let i = 0; i < slider.length; i++) {
            slides[i].style.display = "none";
        }
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" visible", "");
        }
        slides[slideIndex - 1].style.display = "block";
        dots[slideIndex - 1].className += " visible";
    }

    return (
        <div className="slider-container">
            <div className="slideshow-container">
                {slider.map((imgSrc, index) => (
                    <div
                        key={index}
                        className={`mySlides fade-slide ${
                            index + 1 === slideIndex ? "visible" : ""
                        }`}
                    >
                        <div className="numbertext">{`${index + 1} / ${
                            slider.length
                        }`}</div>
                        <img
                            src={imgSrc}
                            alt={`dog${index + 1}`}
                            className="slider-image"
                        />
                        <div className="text"></div>
                    </div>
                ))}

                <button className="prev" onClick={() => plusSlides(-1)}>
                    ❮
                </button>
                <button className="next" onClick={() => plusSlides(1)}>
                    ❯
                </button>
                <div id="dots">
                    {slider.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${
                                index + 1 === slideIndex ? "visible" : ""
                            }`}
                            onClick={() => currentSlide(index + 1)}
                        ></span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MainSlider;
