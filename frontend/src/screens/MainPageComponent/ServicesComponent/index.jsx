import React from "react";
import "./style.scss";
import { FaCaretRight } from "react-icons/fa";

const ServicesComponent = () => {
  return (
    <section id="section3" className="section">
      <div className="section-background services-bg">
        <div className=" services-page services-left-bg grid-pattern">
          <div className="services-left">
            <h1>Our Services</h1>
            <div className="services-list">
              <div className="services-item">
                <h2>International Transportation</h2>
                <p>
                  We operate across Europe with a our own fleet of modern
                  curtain trailers, offering efficient and secure transportation
                  services.
                </p>
              </div>
              <div className="services-item service-item-alt">
                <h2>Our Fleet</h2>
                <p>
                  <div className="p-line">
                    <FaCaretRight />
                    Scania R450 with Krone trailers
                  </div>
                  <div className="p-line">
                    <FaCaretRight />
                    All trailers are 90m<sup>3</sup> with XL certificates
                  </div>
                  <div className="p-line">
                    <FaCaretRight />
                    Eco-friendly fleet EURO-6
                  </div>
                </p>
              </div>
              <div className="services-item service-item-alt-2">
                <h2>Main directions</h2>
                <p className="p-container">
                  <div className="p-line">
                    <FaCaretRight />
                    CZ - IT - CZ
                  </div>
                  <div className="p-line">
                    <FaCaretRight />
                    CZ - DE - CZ
                  </div>
                  <div className="p-line">
                    <FaCaretRight />
                    CZ - FR - CZ
                  </div>
                  <div className="p-line">
                    <FaCaretRight />
                    CZ - IT - DE - CZ
                  </div>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesComponent;
