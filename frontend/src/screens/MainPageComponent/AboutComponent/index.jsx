import React from "react";
import "./style.scss";

const AboutComponent = () => {
  return (
    <section id="section2" className="section">
      <div className="section-background about-bg"></div>
      <div className="container-page about-page">
        <h1>About Us</h1>
        <div className="about-content">
          <div>
            <div className="about-item">
              <h2>Who We Are</h2>
              <div className="heading-underline"></div>
              <p>
                We are a logistics company specializing in international
                transportation across Europe, delivering reliable and efficient
                solutions tailored to meet your specific needs.
              </p>
            </div>
            <div className="about-item">
              <div className="about-block">
                <h2>Our Experience</h2>
                <div className="heading-underline"></div>
                <p>
                  With over a decade of experience, our expertise has earned the
                  trust of clients throughout the industry since our
                  establishment in 2010.
                </p>
              </div>
              <div className="about-block"></div>
            </div>
            <div className="about-item">
              <h2>Our Commitment</h2>
              <div className="heading-underline"></div>
              <p>
                Our dedicated team is committed to ensuring the safe and timely
                delivery of your goods, always ready to meet your logistics
                needs.
              </p>
            </div>
          </div>
        </div>
        {/* <span className="heading-with-line"></span> */}
      </div>
    </section>
  );
};

export default AboutComponent;
