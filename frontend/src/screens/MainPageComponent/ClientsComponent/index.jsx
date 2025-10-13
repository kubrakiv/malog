import React from "react";

import Swiper from "swiper";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./style.scss";

import agromat from "../../../img/Clients/agromat-logo.jpg";
import lkw from "../../../img/Clients/lkw-walter-internationale-transportorganisation-ag-logo-vector-2023.png";
import asstra from "../../../img/Clients/asstra.png";
import magnus from "../../../img/Clients/magnus-logo.png";
import m_logistic from "../../../img/Clients/m-logistic-logo.png";
import hopi from "../../../img/Clients/hopi-logo-main.svg";
import gruber from "../../../img/Clients/gruber-logistics-logo-color.png";

const ClientsComponent = () => {
  React.useEffect(() => {
    const swiper = new Swiper(".swiper", {
      modules: [Pagination, Autoplay],
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        1200: {
          slidesPerView: 5,
        },
        1024: {
          slidesPerView: 4,
        },
        768: {
          slidesPerView: 3,
        },
        480: {
          slidesPerView: 2,
        },
        320: {
          slidesPerView: 1,
        },
      },
    });
  }, []);
  return (
    <section id="our-clients" className="clients-section">
      <h1>Our partners</h1>
      <div className="swiper">
        <div className="swiper-wrapper">
          <div className="swiper-slide">
            <img src={agromat} alt="Client 1" />
          </div>
          <div className="swiper-slide">
            <img src={lkw} alt="Client 2" />
          </div>
          <div className="swiper-slide">
            <img src={asstra} alt="Client 3" />
          </div>
          <div className="swiper-slide">
            <img src={magnus} alt="Client 4" />
          </div>
          <div className="swiper-slide">
            <img src={m_logistic} alt="Client 5" />
          </div>
          <div className="swiper-slide">
            <img src={hopi} alt="Client 6" />
          </div>
          <div className="swiper-slide">
            <img src={gruber} alt="Client 7" />
          </div>
        </div>

        {/* Pagination */}
        <div className="swiper-pagination"></div>

        {/* Scrollbar (if needed) */}
        <div className="swiper-scrollbar"></div>
      </div>
    </section>
  );
};

export default ClientsComponent;
