import React from "react";
import "./style.scss";
import gal_1 from "../../../img/gallery/gal_1.jpg";
import gal_2 from "../../../img/gallery/gal_2.jpg";
import gal_3 from "../../../img/gallery/gal_3.jpg";
import gal_4 from "../../../img/gallery/gal_4.jpg";
import gal_6 from "../../../img/gallery/gal_6.jpg";
import gal_7 from "../../../img/gallery/gal_7.jpg";
import gal_8 from "../../../img/gallery/delta_dog.jpg";

const GalleryComponent = () => {
  return (
    <section id="section5" className="section">
      <div className="section-background gallery-bg"></div>
      <div className="container-page gallery-page">
        <h1>How we do it</h1>
        <div className="gallery-background">
          <div className="gallery-container">
            <div className="gallery-item large">
              <img src={gal_1} alt="Gallery Image 1" />
            </div>
            <div className="gallery-item">
              <img src={gal_2} alt="Gallery Image 2" />
            </div>
            <div className="gallery-item">
              <img src={gal_3} alt="Gallery Image 3" />
            </div>
            <div className="gallery-item">
              <img src={gal_4} alt="Gallery Image 4" />
            </div>

            <div className="gallery-item">
              <img src={gal_6} alt="Gallery Image 6" />
            </div>
            <div className="gallery-item">
              <img src={gal_8} alt="Gallery Image 7" />
            </div>
            <div className="gallery-item">
              <img src={gal_7} alt="Gallery Image 7" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GalleryComponent;
